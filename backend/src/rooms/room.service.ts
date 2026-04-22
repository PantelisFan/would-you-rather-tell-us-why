import { Injectable } from '@nestjs/common';
import {
  Room,
  Player,
  RoomConfig,
  Phase,
  DEFAULT_ROOM_CONFIG,
  validateRoomConfig,
  LiveRoomControls,
  DEFAULT_LIVE_CONTROLS,
  Vote,
  BestAnswerVote,
  StoryEntry,
  RoundResults,
  SummaryData,
} from '@wyr/shared';
import { randomBytes } from 'crypto';

export interface InternalRoom {
  room: Room;
  /** Socket ID → Player ID */
  socketToPlayer: Map<string, string>;
  /** Player ID → Socket ID (may be null while disconnected) */
  playerToSocket: Map<string, string | null>;
  /** Reconnect timers keyed by playerId */
  reconnectTimers: Map<string, NodeJS.Timeout>;
  /** Structural config snapshot taken at game start */
  lockedConfig: RoomConfig | null;
  /** Current live controls */
  liveControls: LiveRoomControls;
  /** Game-round state */
  votes: Map<string, Vote[]>; // questionId → votes
  bestVotes: Map<string, BestAnswerVote[]>;
  stories: Map<string, StoryEntry[]>;
  usedQuestionIds: Set<string>;
  phaseTimer: NodeJS.Timeout | null;
  phaseEndsAt: number;
  currentResults: RoundResults | null;
  currentBestCandidates: Vote[];
  currentHotTakePlayerIds: string[];
  currentStoryPromptPlayerIds: string[];
  currentSummary: SummaryData | null;
}

@Injectable()
export class RoomService {
  private rooms = new Map<string, InternalRoom>();

  private generateCode(): string {
    let code: string;
    do {
      code = randomBytes(2)
        .toString('hex')
        .toUpperCase()
        .slice(0, 4);
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(
    hostSocketId: string,
    hostName: string,
    configOverrides?: Partial<RoomConfig>,
  ): { room: Room; playerId: string } {
    const code = this.generateCode();
    const playerId = randomBytes(8).toString('hex');

    let config: RoomConfig = { ...DEFAULT_ROOM_CONFIG };
    if (configOverrides) {
      const err = validateRoomConfig(configOverrides);
      if (err) throw new Error(err);
      config = { ...config, ...configOverrides };
    }

    const host: Player = {
      id: playerId,
      name: hostName,
      connected: true,
      isHost: true,
    };

    const room: Room = {
      code,
      hostId: playerId,
      players: [host],
      config,
      phase: Phase.LOBBY,
      currentQuestion: null,
      currentQuestionIndex: 0,
      totalQuestions: config.questionCount,
      started: false,
    };

    const internal: InternalRoom = {
      room,
      socketToPlayer: new Map([[hostSocketId, playerId]]),
      playerToSocket: new Map([[playerId, hostSocketId]]),
      reconnectTimers: new Map(),
      lockedConfig: null,
      liveControls: { ...DEFAULT_LIVE_CONTROLS },
      votes: new Map(),
      bestVotes: new Map(),
      stories: new Map(),
      usedQuestionIds: new Set(),
      phaseTimer: null,
      phaseEndsAt: 0,
      currentResults: null,
      currentBestCandidates: [],
      currentHotTakePlayerIds: [],
      currentStoryPromptPlayerIds: [],
      currentSummary: null,
    };

    this.rooms.set(code, internal);
    return { room, playerId };
  }

  joinRoom(
    socketId: string,
    code: string,
    name: string,
  ): { room: Room; playerId: string } {
    const internal = this.rooms.get(code);
    if (!internal) throw new Error('Room not found');

    const { room } = internal;

    if (room.started && !room.config.allowLateJoin) {
      throw new Error('Game already started — late join disabled');
    }
    if (room.players.length >= room.config.maxPlayers) {
      throw new Error('Room is full');
    }

    const playerId = randomBytes(8).toString('hex');
    const player: Player = {
      id: playerId,
      name,
      connected: true,
      isHost: false,
    };

    room.players.push(player);
    internal.socketToPlayer.set(socketId, playerId);
    internal.playerToSocket.set(playerId, socketId);

    return { room, playerId };
  }

  rejoinRoom(
    socketId: string,
    code: string,
    playerId: string,
  ): Room {
    const internal = this.rooms.get(code);
    if (!internal) throw new Error('Room not found');

    const player = internal.room.players.find((p) => p.id === playerId);
    if (!player) throw new Error('Player not found in room');

    // Clear old reconnect timer
    const timer = internal.reconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      internal.reconnectTimers.delete(playerId);
    }

    // Re-associate socket
    player.connected = true;
    internal.socketToPlayer.set(socketId, playerId);
    internal.playerToSocket.set(playerId, socketId);

    return internal.room;
  }

  handleDisconnect(socketId: string): { code: string; playerId: string } | null {
    for (const [code, internal] of this.rooms) {
      const playerId = internal.socketToPlayer.get(socketId);
      if (!playerId) continue;

      internal.socketToPlayer.delete(socketId);
      internal.playerToSocket.set(playerId, null);

      const player = internal.room.players.find((p) => p.id === playerId);
      if (player) {
        player.connected = false;

        // Schedule removal after grace period
        const graceSec = internal.room.config.reconnectGraceSec;
        const timer = setTimeout(() => {
          internal.room.players = internal.room.players.filter(
            (p) => p.id !== playerId,
          );
          internal.playerToSocket.delete(playerId);
          internal.reconnectTimers.delete(playerId);

          // If room is empty, clean it up
          if (internal.room.players.length === 0) {
            if (internal.phaseTimer) clearTimeout(internal.phaseTimer);
            this.rooms.delete(code);
          }
        }, graceSec * 1000);
        internal.reconnectTimers.set(playerId, timer);
      }

      return { code, playerId };
    }
    return null;
  }

  updateConfig(
    code: string,
    playerId: string,
    configOverrides: Partial<RoomConfig>,
  ): RoomConfig {
    const internal = this.rooms.get(code);
    if (!internal) throw new Error('Room not found');
    if (internal.room.hostId !== playerId)
      throw new Error('Only the host can update config');
    if (internal.room.started)
      throw new Error('Cannot change structural config after game start');

    const err = validateRoomConfig(configOverrides);
    if (err) throw new Error(err);

    internal.room.config = { ...internal.room.config, ...configOverrides };
    internal.room.totalQuestions = internal.room.config.questionCount;
    return internal.room.config;
  }

  getInternal(code: string): InternalRoom | undefined {
    return this.rooms.get(code);
  }

  getRoomBySocket(socketId: string): InternalRoom | undefined {
    for (const internal of this.rooms.values()) {
      if (internal.socketToPlayer.has(socketId)) return internal;
    }
    return undefined;
  }

  getPlayerIdBySocket(socketId: string): string | undefined {
    for (const internal of this.rooms.values()) {
      const pid = internal.socketToPlayer.get(socketId);
      if (pid) return pid;
    }
    return undefined;
  }

  getRoomCodeBySocket(socketId: string): string | undefined {
    for (const [code, internal] of this.rooms) {
      if (internal.socketToPlayer.has(socketId)) return code;
    }
    return undefined;
  }

  deleteRoom(code: string): void {
    const internal = this.rooms.get(code);
    if (internal) {
      if (internal.phaseTimer) clearTimeout(internal.phaseTimer);
      for (const t of internal.reconnectTimers.values()) clearTimeout(t);
      this.rooms.delete(code);
    }
  }
}
