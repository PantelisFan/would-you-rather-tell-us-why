import { socket } from './client';
import { useGameStore } from '../store/gameStore';
import {
  C2S,
  S2C,
  RoomStatePayload,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  PhaseChangePayload,
  ErrorPayload,
  RoundResults,
  Vote,
  SummaryData,
} from '@wyr/shared';
import { clientLog } from '../utils/debug';

export function hydrateRoomState(data: RoomStatePayload) {
  const store = useGameStore.getState();
  const player = data.room.players.find((roomPlayer) => roomPlayer.id === data.playerId);

  clientLog('info', 'socket', 'Hydrating room state', {
    roomCode: data.room.code,
    playerId: data.playerId,
    phase: data.phaseState?.phase ?? data.room.phase,
    playerCount: data.room.players.length,
  });

  if (player) {
    store.setMe(player, data.playerId);
  }

  store.setRoom(data.room);
  store.setPhase(data.phaseState?.phase ?? data.room.phase, data.phaseState?.endsAt ?? 0);
  store.setCurrentQuestion(data.phaseState?.question ?? data.room.currentQuestion ?? null);
  store.setResults(data.phaseState?.results ?? null);
  store.setBestCandidates(data.phaseState?.bestCandidates ?? []);
  store.setHotTakePlayerIds(data.phaseState?.hotTakePlayerIds ?? []);
  store.setStoryPromptPlayerIds(data.phaseState?.storyPromptPlayerIds ?? []);
  store.setSummary(data.phaseState?.summary ?? null);
  store.setNudgePlayerId(null);

  sessionStorage.setItem('wyr:playerId', data.playerId);
  sessionStorage.setItem('wyr:roomCode', data.room.code);
}

export function setupListeners() {
  const store = useGameStore.getState;

  socket.on('connect', () => {
    clientLog('info', 'socket', 'Socket connected', { socketId: socket.id ?? 'pending' });
    useGameStore.setState({ connected: true, error: null });

    // Auto-rejoin on reconnect
    const playerId = sessionStorage.getItem('wyr:playerId');
    const code = sessionStorage.getItem('wyr:roomCode');
    if (playerId && code) {
      clientLog('info', 'socket', 'Attempting automatic room rejoin', { code, playerId });
      socket.emit(C2S.ROOM_REJOIN, { code, playerId }, (data?: RoomStatePayload) => {
        if (data?.room) {
          hydrateRoomState(data);
        }
      });
    }
  });

  socket.on('disconnect', () => {
    clientLog('warn', 'socket', 'Socket disconnected');
    useGameStore.setState({ connected: false });
  });

  socket.on(S2C.ROOM_STATE, (data: RoomStatePayload) => {
    hydrateRoomState(data);
  });

  socket.on(S2C.PLAYER_JOINED, (data: PlayerJoinedPayload) => {
    clientLog('info', 'socket', 'Player joined event received', {
      playerId: data.player.id,
      name: data.player.name,
      isHost: data.player.isHost,
    });
    store().addPlayer(data.player);
  });

  socket.on(S2C.PLAYER_LEFT, (data: PlayerLeftPayload) => {
    clientLog('warn', 'socket', 'Player left event received', { playerId: data.playerId });
    store().removePlayer(data.playerId);
  });

  socket.on(S2C.PHASE_CHANGE, (data: PhaseChangePayload) => {
    clientLog('info', 'socket', 'Phase changed', {
      phase: data.phase,
      endsAt: data.endsAt,
      questionId: data.question?.id,
      bestCandidateCount: data.bestCandidates?.length ?? 0,
      hotTakeCount: data.hotTakePlayerIds?.length ?? 0,
      storyPromptCount: data.storyPromptPlayerIds?.length ?? 0,
    });
    store().setPhase(data.phase, data.endsAt);
    if (data.question) store().setCurrentQuestion(data.question);
    if (data.results) store().setResults(data.results);
    if (data.bestCandidates) store().setBestCandidates(data.bestCandidates);
    if (data.hotTakePlayerIds) store().setHotTakePlayerIds(data.hotTakePlayerIds);
    if (data.storyPromptPlayerIds) store().setStoryPromptPlayerIds(data.storyPromptPlayerIds);
    if (data.summary) store().setSummary(data.summary);
    // Reset vote on new question round (REVEAL)
    if (data.phase === 'REVEAL') store().setMyVote(null);
  });

  socket.on(S2C.ROOM_CONFIG_UPDATED, (data: { config: any }) => {
    clientLog('info', 'socket', 'Room config updated', { changedKeys: Object.keys(data.config ?? {}) });
    store().updateConfig(data.config);
  });

  socket.on(S2C.RESULTS_REVEAL, (data: RoundResults) => {
    clientLog('info', 'socket', 'Results revealed', {
      questionId: data.questionId,
      highlightCount: data.highlights.length,
      whyCount: data.allWhys.length,
    });
    store().setResults(data);
  });

  socket.on(S2C.BEST_CANDIDATES, (data: { candidates: Vote[] }) => {
    clientLog('info', 'socket', 'Best-answer candidates received', { candidateCount: data.candidates.length });
    store().setBestCandidates(data.candidates);
  });

  socket.on(S2C.HOT_TAKES_ASSIGNED, (data: { playerIds: string[] }) => {
    clientLog('info', 'socket', 'Hot takes assigned', { playerIds: data.playerIds });
    store().setHotTakePlayerIds(data.playerIds);
  });

  socket.on(S2C.STORY_PROMPT, (data: { playerIds: string[]; prompt: string }) => {
    clientLog('info', 'socket', 'Story prompt received', {
      playerIds: data.playerIds,
      prompt: data.prompt,
    });
    store().setStoryPromptPlayerIds(data.playerIds);
  });

  socket.on(S2C.SILENT_NUDGE, (data: { playerId: string }) => {
    clientLog('warn', 'socket', 'Silent nudge received', { playerId: data.playerId });
    store().setNudgePlayerId(data.playerId);
  });

  socket.on(S2C.SUMMARY_SHOW, (data: SummaryData) => {
    clientLog('info', 'socket', 'Summary received', {
      totalQuestions: data.totalQuestions,
      totalPlayers: data.totalPlayers,
      momentCount: data.moments.length,
    });
    store().setSummary(data);
  });

  socket.on(S2C.ERROR, (data: ErrorPayload) => {
    clientLog('error', 'socket', 'Server error received', { code: data.code, message: data.message });
    useGameStore.setState({ error: data.message });
  });
}

export function teardownListeners() {
  clientLog('debug', 'socket', 'Tearing down socket listeners');
  socket.removeAllListeners();
}
