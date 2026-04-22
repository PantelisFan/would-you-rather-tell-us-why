// ── Client → Server ──────────────────────────────────────

export const C2S = {
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_PREVIEW: 'room:preview',
  ROOM_REJOIN: 'room:rejoin',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATE_CONFIG: 'room:update-config',
  ROOM_LIVE_CONTROL: 'room:live-control',
  GAME_START: 'game:start',
  VOTE_SUBMIT: 'vote:submit',
  BEST_SUBMIT: 'best:submit',
  CHAOS_TRIGGER: 'chaos:trigger',
  NEXT_SKIP: 'next:skip',
} as const;

// ── Server → Client ──────────────────────────────────────

export const S2C = {
  ROOM_STATE: 'room:state',
  ROOM_CONFIG_UPDATED: 'room:config-updated',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PHASE_CHANGE: 'phase:change',
  HOT_TAKES_ASSIGNED: 'hot_takes:assigned',
  RESULTS_REVEAL: 'results:reveal',
  BEST_CANDIDATES: 'best:candidates',
  SILENT_NUDGE: 'silent:nudge',
  SUMMARY_SHOW: 'summary:show',
  ERROR: 'error',
} as const;

// ── Payload types for each event ─────────────────────────

import type {
  RoomConfig,
  LiveRoomControls,
  Room,
  Player,
  PhaseChangePayload,
  Vote,
  BestAnswerVote,
  RoundResults,
  SummaryData,
} from './types';

// Client → Server payloads
export interface CreateRoomPayload {
  hostName: string;
  config?: Partial<RoomConfig>;
}
export interface JoinRoomPayload {
  code: string;
  name: string;
}
export interface RoomPreviewPayload {
  code: string;
}
export interface RejoinRoomPayload {
  code: string;
  playerId: string;
}
export interface UpdateConfigPayload {
  config: Partial<RoomConfig>;
}
export interface LiveControlPayload {
  controls: Partial<LiveRoomControls>;
}
export interface VoteSubmitPayload {
  questionId: string;
  optionId: string;
  why: string;
}
export interface BestSubmitPayload {
  questionId: string;
  targetPlayerId: string;
}
export interface ChaosPayload {
  type: string;
}

// Server → Client payloads
export interface RoomStatePayload {
  room: Room;
  playerId: string;
  phaseState?: PhaseChangePayload;
}
export interface RoomPreviewResponse {
  roomCode: string;
  started: boolean;
  allowLateJoin: boolean;
  canJoin: boolean;
  joinBlockedReason: 'ROOM_FULL' | 'LATE_JOIN_DISABLED' | null;
  playerCount: number;
  connectedPlayerCount: number;
  maxPlayers: number;
  phase: Room['phase'];
}
export interface PlayerJoinedPayload {
  player: Player;
}
export interface PlayerLeftPayload {
  playerId: string;
}
export interface ErrorPayload {
  code: string;
  message: string;
}
