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

let activeListenerConsumers = 0;

const handleConnect = () => {
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
};

const handleDisconnect = () => {
  clientLog('warn', 'socket', 'Socket disconnected');
  useGameStore.setState({ connected: false });
};

const handleRoomState = (data: RoomStatePayload) => {
  hydrateRoomState(data);
};

const handlePlayerJoined = (data: PlayerJoinedPayload) => {
  clientLog('info', 'socket', 'Player joined event received', {
    playerId: data.player.id,
    name: data.player.name,
    isHost: data.player.isHost,
  });
  useGameStore.getState().addPlayer(data.player);
};

const handlePlayerLeft = (data: PlayerLeftPayload) => {
  clientLog('warn', 'socket', 'Player left event received', { playerId: data.playerId });
  useGameStore.getState().removePlayer(data.playerId);
};

const handlePhaseChange = (data: PhaseChangePayload) => {
  clientLog('info', 'socket', 'Phase changed', {
    phase: data.phase,
    endsAt: data.endsAt,
    notice: data.notice,
    questionId: data.question?.id,
    bestCandidateCount: data.bestCandidates?.length ?? 0,
    hotTakeCount: data.hotTakePlayerIds?.length ?? 0,
  });
  const store = useGameStore.getState();
  store.setPhase(data.phase, data.endsAt);
  store.setPhaseNotice(data.notice ?? null);
  if (data.question) store.setCurrentQuestion(data.question);
  if (data.results) store.setResults(data.results);
  if (data.bestCandidates) store.setBestCandidates(data.bestCandidates);
  if (data.hotTakePlayerIds) store.setHotTakePlayerIds(data.hotTakePlayerIds);
  if (data.summary) store.setSummary(data.summary);
  if (data.phase === 'REVEAL') store.setMyVote(null);
};

const handleRoomConfigUpdated = (data: { config: any }) => {
  clientLog('info', 'socket', 'Room config updated', { changedKeys: Object.keys(data.config ?? {}) });
  useGameStore.getState().updateConfig(data.config);
};

const handleResultsReveal = (data: RoundResults) => {
  clientLog('info', 'socket', 'Results revealed', {
    questionId: data.questionId,
    highlightCount: data.highlights.length,
    whyCount: data.allWhys.length,
  });
  useGameStore.getState().setResults(data);
};

const handleBestCandidates = (data: { candidates: Vote[] }) => {
  clientLog('info', 'socket', 'Best-answer candidates received', { candidateCount: data.candidates.length });
  useGameStore.getState().setBestCandidates(data.candidates);
};

const handleHotTakesAssigned = (data: { playerIds: string[] }) => {
  clientLog('info', 'socket', 'Hot takes assigned', { playerIds: data.playerIds });
  useGameStore.getState().setHotTakePlayerIds(data.playerIds);
};

const handleSilentNudge = (data: { playerId: string }) => {
  clientLog('warn', 'socket', 'Silent nudge received', { playerId: data.playerId });
};

const handleSummaryShow = (data: SummaryData) => {
  clientLog('info', 'socket', 'Summary received', {
    totalQuestions: data.totalQuestions,
    totalPlayers: data.totalPlayers,
    momentCount: data.moments.length,
  });
  useGameStore.getState().setSummary(data);
};

const handleError = (data: ErrorPayload) => {
  clientLog('error', 'socket', 'Server error received', { code: data.code, message: data.message });
  useGameStore.setState({ error: data.message });
};

function bindListeners() {
  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on(S2C.ROOM_STATE, handleRoomState);
  socket.on(S2C.PLAYER_JOINED, handlePlayerJoined);
  socket.on(S2C.PLAYER_LEFT, handlePlayerLeft);
  socket.on(S2C.PHASE_CHANGE, handlePhaseChange);
  socket.on(S2C.ROOM_CONFIG_UPDATED, handleRoomConfigUpdated);
  socket.on(S2C.RESULTS_REVEAL, handleResultsReveal);
  socket.on(S2C.BEST_CANDIDATES, handleBestCandidates);
  socket.on(S2C.HOT_TAKES_ASSIGNED, handleHotTakesAssigned);
  socket.on(S2C.SILENT_NUDGE, handleSilentNudge);
  socket.on(S2C.SUMMARY_SHOW, handleSummaryShow);
  socket.on(S2C.ERROR, handleError);
}

function unbindListeners() {
  socket.off('connect', handleConnect);
  socket.off('disconnect', handleDisconnect);
  socket.off(S2C.ROOM_STATE, handleRoomState);
  socket.off(S2C.PLAYER_JOINED, handlePlayerJoined);
  socket.off(S2C.PLAYER_LEFT, handlePlayerLeft);
  socket.off(S2C.PHASE_CHANGE, handlePhaseChange);
  socket.off(S2C.ROOM_CONFIG_UPDATED, handleRoomConfigUpdated);
  socket.off(S2C.RESULTS_REVEAL, handleResultsReveal);
  socket.off(S2C.BEST_CANDIDATES, handleBestCandidates);
  socket.off(S2C.HOT_TAKES_ASSIGNED, handleHotTakesAssigned);
  socket.off(S2C.SILENT_NUDGE, handleSilentNudge);
  socket.off(S2C.SUMMARY_SHOW, handleSummaryShow);
  socket.off(S2C.ERROR, handleError);
}

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
  store.setPhaseNotice(data.phaseState?.notice ?? null);
  store.setCurrentQuestion(data.phaseState?.question ?? data.room.currentQuestion ?? null);
  store.setResults(data.phaseState?.results ?? null);
  store.setBestCandidates(data.phaseState?.bestCandidates ?? []);
  store.setHotTakePlayerIds(data.phaseState?.hotTakePlayerIds ?? []);
  store.setSummary(data.phaseState?.summary ?? null);

  sessionStorage.setItem('wyr:playerId', data.playerId);
  sessionStorage.setItem('wyr:roomCode', data.room.code);
}

export function setupListeners() {
  activeListenerConsumers += 1;
  if (activeListenerConsumers === 1) {
    clientLog('debug', 'socket', 'Binding socket listeners');
    bindListeners();
  }
}

export function teardownListeners() {
  activeListenerConsumers = Math.max(0, activeListenerConsumers - 1);
  if (activeListenerConsumers > 0) {
    clientLog('debug', 'socket', 'Keeping socket listeners bound during route transition', {
      activeListenerConsumers,
    });
    return;
  }

  clientLog('debug', 'socket', 'Tearing down socket listeners');
  unbindListeners();
}
