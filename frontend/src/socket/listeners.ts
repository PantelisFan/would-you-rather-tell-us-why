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

export function hydrateRoomState(data: RoomStatePayload) {
  const store = useGameStore.getState();
  const player = data.room.players.find((roomPlayer) => roomPlayer.id === data.playerId);

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
    useGameStore.setState({ connected: true, error: null });

    // Auto-rejoin on reconnect
    const playerId = sessionStorage.getItem('wyr:playerId');
    const code = sessionStorage.getItem('wyr:roomCode');
    if (playerId && code) {
      socket.emit(C2S.ROOM_REJOIN, { code, playerId }, (data?: RoomStatePayload) => {
        if (data?.room) {
          hydrateRoomState(data);
        }
      });
    }
  });

  socket.on('disconnect', () => {
    useGameStore.setState({ connected: false });
  });

  socket.on(S2C.ROOM_STATE, (data: RoomStatePayload) => {
    hydrateRoomState(data);
  });

  socket.on(S2C.PLAYER_JOINED, (data: PlayerJoinedPayload) => {
    store().addPlayer(data.player);
  });

  socket.on(S2C.PLAYER_LEFT, (data: PlayerLeftPayload) => {
    store().removePlayer(data.playerId);
  });

  socket.on(S2C.PHASE_CHANGE, (data: PhaseChangePayload) => {
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
    store().updateConfig(data.config);
  });

  socket.on(S2C.RESULTS_REVEAL, (data: RoundResults) => {
    store().setResults(data);
  });

  socket.on(S2C.BEST_CANDIDATES, (data: { candidates: Vote[] }) => {
    store().setBestCandidates(data.candidates);
  });

  socket.on(S2C.HOT_TAKES_ASSIGNED, (data: { playerIds: string[] }) => {
    store().setHotTakePlayerIds(data.playerIds);
  });

  socket.on(S2C.STORY_PROMPT, (data: { playerIds: string[]; prompt: string }) => {
    store().setStoryPromptPlayerIds(data.playerIds);
  });

  socket.on(S2C.SILENT_NUDGE, (data: { playerId: string }) => {
    store().setNudgePlayerId(data.playerId);
  });

  socket.on(S2C.SUMMARY_SHOW, (data: SummaryData) => {
    store().setSummary(data);
  });

  socket.on(S2C.ERROR, (data: ErrorPayload) => {
    useGameStore.setState({ error: data.message });
  });
}

export function teardownListeners() {
  socket.removeAllListeners();
}
