import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  Phase,
  PHASE_ORDER,
  OPTIONAL_PHASES,
  Vote,
  BestAnswerVote,
  Highlight,
  RoundResults,
  OptionResult,
  PhaseChangePayload,
  RoomStatePayload,
  SummaryData,
  SummaryMoment,
  S2C,
  LiveRoomControls,
  validateLiveControls,
} from '@wyr/shared';
import { InternalRoom, RoomService } from '../rooms/room.service';
import { QuestionBank } from '../questions/question.bank';
import { formatLogMeta, previewText } from '../common/logging';

@Injectable()
export class GameEngine {
  private server!: Server;
  private readonly logger = new Logger(GameEngine.name);

  constructor(
    private readonly roomService: RoomService,
    private readonly questionBank: QuestionBank,
  ) {}

  setServer(server: Server) {
    this.server = server;
    this.logger.log('Game engine attached to websocket server');
  }

  startGame(code: string): void {
    const internal = this.roomService.getInternal(code);
    if (!internal) return;

    const { room } = internal;

    // Lock structural config
    internal.lockedConfig = { ...room.config };
    room.started = true;
    room.totalQuestions = room.config.questionCount;
    room.currentQuestionIndex = 0;
    internal.currentSummary = null;

    this.logger.log(
      `Started game engine${formatLogMeta({ code, hostId: room.hostId, questionCount: room.totalQuestions })}`,
    );

    this.nextQuestion(code);
  }

  getRoomStatePayload(code: string, playerId: string): RoomStatePayload | null {
    const internal = this.roomService.getInternal(code);
    if (!internal) return null;

    return {
      room: internal.room,
      playerId,
      phaseState: this.buildPhasePayload(
        internal,
        internal.room.phase,
        internal.phaseEndsAt,
      ),
    };
  }

  private nextQuestion(code: string): void {
    const internal = this.roomService.getInternal(code);
    if (!internal) return;

    const { room } = internal;
    const config = internal.lockedConfig ?? room.config;

    if (room.currentQuestionIndex >= config.questionCount) {
      this.goToSummary(code);
      return;
    }

    const questions = this.questionBank.pickQuestions(
      1,
      config.categories,
      config.difficulty,
      internal.usedQuestionIds,
    );

    if (questions.length === 0) {
      this.goToSummary(code);
      return;
    }

    const question = questions[0];
    internal.usedQuestionIds.add(question.id);
    room.currentQuestion = question;
    room.currentQuestionIndex++;

    this.logger.log(
      `Selected next question${formatLogMeta({ code, questionId: question.id, category: question.category, difficulty: question.difficulty, round: room.currentQuestionIndex })}`,
    );

    // Clear round state
    internal.votes.set(question.id, []);
    internal.bestVotes.set(question.id, []);
    internal.currentResults = null;
    internal.currentBestCandidates = [];
    internal.currentHotTakePlayerIds = [];

    this.advancePhase(code, 0); // start at first phase in PHASE_ORDER
  }

  private getActivePhaseOrder(internal: InternalRoom): Phase[] {
    const config = internal.lockedConfig ?? internal.room.config;
    const disabled = new Set<Phase>(internal.liveControls.disabledUpcomingPhases);

    return PHASE_ORDER.filter((phase) => {
      if (disabled.has(phase)) return false;
      if (OPTIONAL_PHASES.includes(phase) && !config.enabledOptionalPhases.includes(phase))
        return false;
      return true;
    });
  }

  private advancePhase(code: string, phaseIndex: number): void {
    const internal = this.roomService.getInternal(code);
    if (!internal) return;

    const activeOrder = this.getActivePhaseOrder(internal);

    if (phaseIndex >= activeOrder.length) {
      // Round done → next question
      this.nextQuestion(code);
      return;
    }

    const phase = activeOrder[phaseIndex];
    const config = internal.lockedConfig ?? internal.room.config;
    const durationSec = config.phaseDurations[phase] || 0;

    internal.room.phase = phase;

    if (phase === Phase.PAUSE) {
      internal.currentHotTakePlayerIds = this.assignHotTakes(internal);
    }

    const endsAt = durationSec > 0 ? Date.now() + durationSec * 1000 : 0;
    internal.phaseEndsAt = endsAt;

    // Reset live-control one-shot flags
    internal.liveControls.skipCurrentPhase = false;
    internal.liveControls.timerAdjustSec = 0;

    const payload = this.buildPhasePayload(internal, phase, endsAt);
    this.logger.log(
      `Advancing phase${formatLogMeta({ code, phase, phaseIndex, durationSec, questionId: internal.room.currentQuestion?.id, endsAt, hotTakeCount: internal.currentHotTakePlayerIds.length, bestCandidateCount: internal.currentBestCandidates.length })}`,
    );
    this.server.to(code).emit(S2C.PHASE_CHANGE, payload);

    if (phase === Phase.PAUSE && internal.currentHotTakePlayerIds.length > 0) {
      this.server.to(code).emit(S2C.HOT_TAKES_ASSIGNED, {
        playerIds: internal.currentHotTakePlayerIds,
      });
    }

    if (phase === Phase.RESULTS && internal.currentResults) {
      this.server.to(code).emit(S2C.RESULTS_REVEAL, internal.currentResults);
    }

    if (phase === Phase.BEST_ANSWER && internal.currentBestCandidates.length > 0) {
      this.server.to(code).emit(S2C.BEST_CANDIDATES, {
        candidates: internal.currentBestCandidates,
      });
    }

    if (durationSec > 0) {
      if (internal.phaseTimer) clearTimeout(internal.phaseTimer);
      internal.phaseTimer = setTimeout(() => {
        this.onPhaseEnd(code, phase, phaseIndex);
      }, durationSec * 1000);
    }
  }

  private onPhaseEnd(code: string, phase: Phase, phaseIndex: number): void {
    const internal = this.roomService.getInternal(code);
    if (!internal) return;

    // Phase-specific post-processing
    if (phase === Phase.VOTE) {
      internal.currentResults = this.computeResults(internal);
      internal.currentBestCandidates = this.pickBestCandidates(internal);
      this.logger.log(
        `Computed vote results${formatLogMeta({ code, questionId: internal.room.currentQuestion?.id, voteCount: internal.currentResults?.allWhys.length ?? 0, bestCandidateCount: internal.currentBestCandidates.length })}`,
      );
    }

    this.advancePhase(code, phaseIndex + 1);
  }

  private buildPhasePayload(
    internal: InternalRoom,
    phase: Phase,
    endsAt: number,
  ): PhaseChangePayload {
    const payload: PhaseChangePayload = { phase, endsAt };

    if (internal.room.currentQuestion) {
      payload.question = internal.room.currentQuestion ?? undefined;
    }

    if (phase === Phase.RESULTS) {
      payload.results = internal.currentResults ?? this.computeResults(internal) ?? undefined;
    }

    if (phase === Phase.BEST_ANSWER && internal.currentBestCandidates.length > 0) {
      payload.bestCandidates = internal.currentBestCandidates;
    }

    if (phase === Phase.PAUSE && internal.currentHotTakePlayerIds.length > 0) {
      payload.hotTakePlayerIds = internal.currentHotTakePlayerIds;
    }

    if (phase === Phase.SUMMARY && internal.currentSummary) {
      payload.summary = internal.currentSummary;
    }

    return payload;
  }

  private assignHotTakes(internal: InternalRoom): string[] {
    const questionId = internal.room.currentQuestion?.id;
    if (!questionId) return [];

    const voters = internal.votes.get(questionId) ?? [];
    const eligibleVoterIds = voters
      .map((vote) => vote.playerId)
      .filter((playerId) => {
        const player = internal.room.players.find((roomPlayer) => roomPlayer.id === playerId);
        return Boolean(player?.connected);
      });

    const playerIds = [...new Set(eligibleVoterIds)];
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(2, shuffled.length));
  }

  private computeResults(internal: InternalRoom): RoundResults | null {
    const question = internal.room.currentQuestion;
    if (!question) return null;

    const votes = internal.votes.get(question.id) ?? [];
    const total = votes.length;
    if (total === 0) return null;

    const countMap = new Map<string, Vote[]>();
    for (const v of votes) {
      const list = countMap.get(v.optionId) ?? [];
      list.push(v);
      countMap.set(v.optionId, list);
    }

    const distribution: OptionResult[] = question.options.map((opt) => {
      const optVotes = countMap.get(opt.id) ?? [];
      return {
        optionId: opt.id,
        count: optVotes.length,
        percentage: total > 0 ? Math.round((optVotes.length / total) * 100) : 0,
        voterNames: optVotes.map((v) => {
          const player = internal.room.players.find((p) => p.id === v.playerId);
          return player?.name ?? 'Unknown';
        }),
      };
    });

    const highlights = this.detectHighlights(distribution, total);

    return {
      questionId: question.id,
      distribution,
      highlights,
      allWhys: votes,
    };
  }

  private detectHighlights(
    distribution: OptionResult[],
    totalVotes: number,
  ): Highlight[] {
    const highlights: Highlight[] = [];
    const sorted = [...distribution].sort((a, b) => b.count - a.count);

    // Unanimous
    if (sorted[0]?.percentage === 100 && totalVotes > 1) {
      highlights.push({
        type: 'unanimous',
        copy: 'Everyone agreed! That\'s rare.',
      });
    }

    // Split (top two within 15%)
    if (
      sorted.length >= 2 &&
      Math.abs(sorted[0].percentage - sorted[1].percentage) <= 15
    ) {
      highlights.push({
        type: 'split',
        copy: 'The room is divided! This one\'s a real debate.',
      });
    }

    // Minority (≤20% when >4 players)
    if (totalVotes > 4) {
      for (const opt of distribution) {
        if (opt.percentage > 0 && opt.percentage <= 20) {
          highlights.push({
            type: 'minority',
            copy: `Only ${opt.count} brave soul${opt.count > 1 ? 's' : ''} went with the minority here.`,
          });
          break;
        }
      }
    }

    return highlights;
  }

  private pickBestCandidates(internal: InternalRoom): Vote[] {
    const question = internal.room.currentQuestion;
    if (!question) return [];

    const votes = internal.votes.get(question.id) ?? [];
    const withWhy = votes.filter((v) => v.why.trim().length > 0);

    // Shuffle and pick up to 4
    const shuffled = [...withWhy].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(4, shuffled.length));
  }

  // ── Live Controls ──────────────────────────────────────

  applyLiveControl(
    code: string,
    playerId: string,
    controls: Partial<LiveRoomControls>,
  ): void {
    const internal = this.roomService.getInternal(code);
    if (!internal) throw new Error('Room not found');
    if (internal.room.hostId !== playerId)
      throw new Error('Only the host can use live controls');
    if (!internal.room.started)
      throw new Error('Game has not started');

    const err = validateLiveControls(controls);
    if (err) throw new Error(err);

    this.logger.log(
      `Applying live control${formatLogMeta({ code, playerId, phase: internal.room.phase, controls })}`,
    );

    // Timer adjust
    if (controls.timerAdjustSec !== undefined && controls.timerAdjustSec !== 0) {
      const adjustMs = controls.timerAdjustSec * 1000;
      internal.phaseEndsAt += adjustMs;

      // Reschedule the phase timer
      if (internal.phaseTimer) {
        clearTimeout(internal.phaseTimer);
        const remaining = internal.phaseEndsAt - Date.now();
        if (remaining > 0) {
          const activeOrder = this.getActivePhaseOrder(internal);
          const currentIdx = activeOrder.indexOf(internal.room.phase);
          internal.phaseTimer = setTimeout(() => {
            this.onPhaseEnd(code, internal.room.phase, currentIdx);
          }, remaining);
        }
      }

      // Broadcast updated endsAt
      this.logger.debug(
        `Adjusted phase timer${formatLogMeta({ code, phase: internal.room.phase, playerId, phaseEndsAt: internal.phaseEndsAt, timerAdjustSec: controls.timerAdjustSec })}`,
      );
      this.server.to(code).emit(S2C.PHASE_CHANGE, {
        phase: internal.room.phase,
        endsAt: internal.phaseEndsAt,
        question: internal.room.currentQuestion ?? undefined,
      } satisfies PhaseChangePayload);
    }

    // Pause / resume
    if (controls.paused !== undefined) {
      internal.liveControls.paused = controls.paused;
      if (controls.paused && internal.phaseTimer) {
        clearTimeout(internal.phaseTimer);
        internal.phaseTimer = null;
      } else if (!controls.paused && internal.phaseEndsAt > 0) {
        const remaining = internal.phaseEndsAt - Date.now();
        if (remaining > 0) {
          const activeOrder = this.getActivePhaseOrder(internal);
          const currentIdx = activeOrder.indexOf(internal.room.phase);
          internal.phaseTimer = setTimeout(() => {
            this.onPhaseEnd(code, internal.room.phase, currentIdx);
          }, remaining);
        }
      }
    }

    // Skip current phase
    if (controls.skipCurrentPhase) {
      this.logger.warn(
        `Skipping current phase${formatLogMeta({ code, playerId, phase: internal.room.phase })}`,
      );
      if (internal.phaseTimer) clearTimeout(internal.phaseTimer);
      const activeOrder = this.getActivePhaseOrder(internal);
      const currentIdx = activeOrder.indexOf(internal.room.phase);
      this.onPhaseEnd(code, internal.room.phase, currentIdx);
    }

    // Disable upcoming phases
    if (controls.disabledUpcomingPhases !== undefined) {
      internal.liveControls.disabledUpcomingPhases =
        controls.disabledUpcomingPhases;
    }
  }

  triggerChaos(code: string, playerId: string, type: string): void {
    const internal = this.roomService.getInternal(code);
    if (!internal) throw new Error('Room not found');
    if (internal.room.hostId !== playerId) {
      throw new Error('Only the host can trigger chaos');
    }
    if (!internal.room.started) {
      throw new Error('Game has not started');
    }

    switch (type) {
      case 'skip':
        this.applyLiveControl(code, playerId, { skipCurrentPhase: true });
        return;
      case 'extend':
        this.applyLiveControl(code, playerId, { timerAdjustSec: 15 });
        return;
      case 'pause':
        this.applyLiveControl(code, playerId, { paused: true });
        return;
      case 'resume':
        this.applyLiveControl(code, playerId, { paused: false });
        return;
      case 'callout': {
        const candidates = internal.room.players.filter(
          (roomPlayer) => roomPlayer.connected && roomPlayer.id !== playerId,
        );
        const target = candidates[Math.floor(Math.random() * candidates.length)];

        if (!target) {
          throw new Error('No player available to call out');
        }

        this.logger.warn(
          `Triggered chaos callout${formatLogMeta({ code, playerId, targetPlayerId: target.id, phase: internal.room.phase })}`,
        );
        this.server.to(code).emit(S2C.SILENT_NUDGE, { playerId: target.id });
        return;
      }
      default:
        throw new Error('Unknown chaos type');
    }
  }

  // ── Skip (host during TRANSITION) ─────────────────────

  skipTransition(code: string, playerId: string): void {
    const internal = this.roomService.getInternal(code);
    if (!internal) return;
    if (internal.room.hostId !== playerId) return;
    if (internal.room.phase !== Phase.TRANSITION) return;

    if (internal.phaseTimer) clearTimeout(internal.phaseTimer);
    const activeOrder = this.getActivePhaseOrder(internal);
    const currentIdx = activeOrder.indexOf(Phase.TRANSITION);
    this.logger.log(`Skipping transition${formatLogMeta({ code, playerId })}`);
    this.onPhaseEnd(code, Phase.TRANSITION, currentIdx);
  }

  // ── Submit handlers ────────────────────────────────────

  submitVote(code: string, playerId: string, questionId: string, optionId: string, why: string): void {
    const internal = this.roomService.getInternal(code);
    if (!internal) throw new Error('Room not found');
    if (internal.room.phase !== Phase.VOTE) throw new Error('Not in voting phase');

    const votes = internal.votes.get(questionId) ?? [];
    // Prevent double voting
    if (votes.some((v) => v.playerId === playerId))
      throw new Error('Already voted');

    votes.push({ playerId, questionId, optionId, why });
    internal.votes.set(questionId, votes);
    this.logger.log(
      `Recorded vote${formatLogMeta({ code, playerId, questionId, optionId, whyPreview: previewText(why), voteCount: votes.length })}`,
    );
  }

  submitBestAnswer(code: string, voterId: string, questionId: string, targetPlayerId: string): void {
    const internal = this.roomService.getInternal(code);
    if (!internal) throw new Error('Room not found');
    if (internal.room.phase !== Phase.BEST_ANSWER) throw new Error('Not in best-answer phase');

    const bv = internal.bestVotes.get(questionId) ?? [];
    if (bv.some((v) => v.voterId === voterId))
      throw new Error('Already voted for best answer');

    bv.push({ voterId, questionId, targetPlayerId });
    internal.bestVotes.set(questionId, bv);
    this.logger.log(
      `Recorded best-answer vote${formatLogMeta({ code, voterId, questionId, targetPlayerId, voteCount: bv.length })}`,
    );
  }

  // ── Summary ────────────────────────────────────────────

  private goToSummary(code: string): void {
    const internal = this.roomService.getInternal(code);
    if (!internal) return;

    internal.room.phase = Phase.SUMMARY;
    const summary = this.buildSummary(internal);
    internal.currentSummary = summary;

    this.logger.log(
      `Built summary${formatLogMeta({ code, momentCount: summary.moments.length, totalQuestions: summary.totalQuestions, totalPlayers: summary.totalPlayers })}`,
    );

    const payload: PhaseChangePayload = {
      phase: Phase.SUMMARY,
      endsAt: 0,
      summary,
    };

    this.server.to(code).emit(S2C.PHASE_CHANGE, payload);
    this.server.to(code).emit(S2C.SUMMARY_SHOW, summary);
  }

  private buildSummary(internal: InternalRoom): SummaryData {
    const moments: SummaryMoment[] = [];

    // Find most-voted-for "best answer" player
    const bestTally = new Map<string, number>();
    for (const bvList of internal.bestVotes.values()) {
      for (const bv of bvList) {
        bestTally.set(bv.targetPlayerId, (bestTally.get(bv.targetPlayerId) ?? 0) + 1);
      }
    }
    if (bestTally.size > 0) {
      const sorted = [...bestTally.entries()].sort((a, b) => b[1] - a[1]);
      const topId = sorted[0][0];
      const topPlayer = internal.room.players.find((p) => p.id === topId);
      moments.push({
        label: 'Best Reasons',
        description: `${topPlayer?.name ?? 'Someone'} gave the most compelling answers.`,
        playerIds: [topId],
      });
    }

    // Find most contrarian (minority voter)
    const minorityCounts = new Map<string, number>();
    for (const voteList of internal.votes.values()) {
      if (voteList.length < 3) continue;
      const optionCounts = new Map<string, number>();
      for (const v of voteList) {
        optionCounts.set(v.optionId, (optionCounts.get(v.optionId) ?? 0) + 1);
      }
      const minOption = [...optionCounts.entries()].sort((a, b) => a[1] - b[1])[0];
      if (minOption) {
        for (const v of voteList) {
          if (v.optionId === minOption[0]) {
            minorityCounts.set(v.playerId, (minorityCounts.get(v.playerId) ?? 0) + 1);
          }
        }
      }
    }
    if (minorityCounts.size > 0) {
      const sorted = [...minorityCounts.entries()].sort((a, b) => b[1] - a[1]);
      const topId = sorted[0][0];
      const topPlayer = internal.room.players.find((p) => p.id === topId);
      moments.push({
        label: 'The Contrarian',
        description: `${topPlayer?.name ?? 'Someone'} went against the group the most.`,
        playerIds: [topId],
      });
    }

    return {
      moments,
      totalQuestions: internal.room.currentQuestionIndex,
      totalPlayers: internal.room.players.length,
    };
  }
}
