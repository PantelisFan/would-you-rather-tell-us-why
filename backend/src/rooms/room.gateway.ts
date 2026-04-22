import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  C2S,
  S2C,
  ErrorPayload,
} from '@wyr/shared';
import { RoomService } from './room.service';
import { GameEngine } from '../game/game.engine';
import {
  BestSubmitDto,
  ChaosTriggerDto,
  CreateRoomDto,
  JoinRoomDto,
  LiveControlDto,
  RejoinRoomDto,
  UpdateConfigDto,
  VoteSubmitDto,
} from './room.dtos';
import { formatLogMeta, previewText } from '../common/logging';

@WebSocketGateway({ cors: { origin: '*' } })
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly submissionThrottle = new Map<string, number>();
  private readonly logger = new Logger(RoomGateway.name);

  constructor(
    private readonly roomService: RoomService,
    private readonly gameEngine: GameEngine,
  ) {}

  afterInit(server: Server) {
    this.gameEngine.setServer(server);
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Socket connected${formatLogMeta({ socketId: client.id })}`);
  }

  handleDisconnect(client: Socket) {
    this.clearSubmissionThrottle(client.id);
    const result = this.roomService.handleDisconnect(client.id);
    this.logger.debug(
      `Socket disconnected${formatLogMeta({ socketId: client.id, roomCode: result?.code, playerId: result?.playerId })}`,
    );
    if (result) {
      client.to(result.code).emit(S2C.PLAYER_LEFT, { playerId: result.playerId });
    }
  }

  // ── Room lifecycle ─────────────────────────────────────

  @SubscribeMessage(C2S.ROOM_CREATE)
  handleCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateRoomDto,
  ) {
    try {
      this.logger.debug(
        `Received room:create${formatLogMeta({ socketId: client.id, hostName: data.hostName, configKeys: Object.keys(data.config ?? {}) })}`,
      );
      if (!data.hostName || data.hostName.trim().length === 0) {
        return this.emitError(client, 'INVALID', 'hostName is required');
      }
      const { room, playerId } = this.roomService.createRoom(
        client.id,
        data.hostName.trim(),
        data.config,
      );
      client.join(room.code);
      const snapshot = this.gameEngine.getRoomStatePayload(room.code, playerId);
      if (snapshot) {
        client.emit(S2C.ROOM_STATE, snapshot);
        this.logger.log(
          `Created room snapshot${formatLogMeta({ socketId: client.id, code: snapshot.room.code, playerId, phase: snapshot.room.phase })}`,
        );
        return snapshot;
      }
      return { room, playerId };
    } catch (e: any) {
      return this.emitError(client, 'CREATE_FAILED', e.message);
    }
  }

  @SubscribeMessage(C2S.ROOM_JOIN)
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ) {
    try {
      this.logger.debug(
        `Received room:join${formatLogMeta({ socketId: client.id, code: data.code, name: data.name })}`,
      );
      if (!data.code || !data.name?.trim()) {
        return this.emitError(client, 'INVALID', 'code and name are required');
      }
      const { room, playerId } = this.roomService.joinRoom(
        client.id,
        data.code.toUpperCase(),
        data.name.trim(),
      );
      client.join(room.code);

      // Broadcast to others
      const player = room.players.find((p) => p.id === playerId)!;
      client.to(room.code).emit(S2C.PLAYER_JOINED, { player });

      const snapshot = this.gameEngine.getRoomStatePayload(room.code, playerId);
      if (snapshot) {
        client.emit(S2C.ROOM_STATE, snapshot);
        this.logger.log(
          `Joined room snapshot${formatLogMeta({ socketId: client.id, code: snapshot.room.code, playerId, phase: snapshot.room.phase, playerCount: snapshot.room.players.length })}`,
        );
        return snapshot;
      }
      return { playerId, room };
    } catch (e: any) {
      return this.emitError(client, 'JOIN_FAILED', e.message);
    }
  }

  @SubscribeMessage(C2S.ROOM_REJOIN)
  handleRejoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RejoinRoomDto,
  ) {
    try {
      this.logger.debug(
        `Received room:rejoin${formatLogMeta({ socketId: client.id, code: data.code, playerId: data.playerId })}`,
      );
      const room = this.roomService.rejoinRoom(
        client.id,
        data.code.toUpperCase(),
        data.playerId,
      );
      client.join(room.code);

      const player = room.players.find((p) => p.id === data.playerId);
      if (player) {
        client.to(room.code).emit(S2C.PLAYER_JOINED, { player });
      }

      const snapshot = this.gameEngine.getRoomStatePayload(room.code, data.playerId);
      if (snapshot) {
        client.emit(S2C.ROOM_STATE, snapshot);
        this.logger.log(
          `Rejoined room snapshot${formatLogMeta({ socketId: client.id, code: snapshot.room.code, playerId: data.playerId, phase: snapshot.room.phase })}`,
        );
        return snapshot;
      }
      return { room, playerId: data.playerId };
    } catch (e: any) {
      return this.emitError(client, 'REJOIN_FAILED', e.message);
    }
  }

  @SubscribeMessage(C2S.ROOM_LEAVE)
  handleLeave(@ConnectedSocket() client: Socket) {
    const result = this.roomService.handleDisconnect(client.id);
    this.logger.log(
      `Processed room:leave${formatLogMeta({ socketId: client.id, roomCode: result?.code, playerId: result?.playerId })}`,
    );
    if (result) {
      client.leave(result.code);
      client.to(result.code).emit(S2C.PLAYER_LEFT, { playerId: result.playerId });
    }
  }

  // ── Config management ──────────────────────────────────

  @SubscribeMessage(C2S.ROOM_UPDATE_CONFIG)
  handleUpdateConfig(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UpdateConfigDto,
  ) {
    try {
      this.logger.debug(
        `Received room:update-config${formatLogMeta({ socketId: client.id, changedKeys: Object.keys(data.config) })}`,
      );
      const code = this.roomService.getRoomCodeBySocket(client.id);
      const playerId = this.roomService.getPlayerIdBySocket(client.id);
      if (!code || !playerId) {
        return this.emitError(client, 'NOT_IN_ROOM', 'Not in a room');
      }

      const newConfig = this.roomService.updateConfig(code, playerId, data.config);
      this.server.to(code).emit(S2C.ROOM_CONFIG_UPDATED, { config: newConfig });
      this.logger.log(
        `Updated room config via gateway${formatLogMeta({ code, playerId, changedKeys: Object.keys(data.config) })}`,
      );
      return { config: newConfig };
    } catch (e: any) {
      return this.emitError(client, 'CONFIG_FAILED', e.message);
    }
  }

  @SubscribeMessage(C2S.ROOM_LIVE_CONTROL)
  handleLiveControl(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LiveControlDto,
  ) {
    try {
      this.logger.debug(
        `Received room:live-control${formatLogMeta({ socketId: client.id, controls: data.controls })}`,
      );
      const code = this.roomService.getRoomCodeBySocket(client.id);
      const playerId = this.roomService.getPlayerIdBySocket(client.id);
      if (!code || !playerId) {
        return this.emitError(client, 'NOT_IN_ROOM', 'Not in a room');
      }

      this.gameEngine.applyLiveControl(code, playerId, data.controls);
      this.logger.log(
        `Applied live control${formatLogMeta({ code, playerId, controls: data.controls })}`,
      );
      return { success: true };
    } catch (e: any) {
      return this.emitError(client, 'CONTROL_FAILED', e.message);
    }
  }

  // ── Game flow ──────────────────────────────────────────

  @SubscribeMessage(C2S.GAME_START)
  handleGameStart(@ConnectedSocket() client: Socket) {
    try {
      this.logger.debug(`Received game:start${formatLogMeta({ socketId: client.id })}`);
      const code = this.roomService.getRoomCodeBySocket(client.id);
      const playerId = this.roomService.getPlayerIdBySocket(client.id);
      if (!code || !playerId) {
        return this.emitError(client, 'NOT_IN_ROOM', 'Not in a room');
      }

      const internal = this.roomService.getInternal(code);
      if (!internal) return this.emitError(client, 'NOT_FOUND', 'Room not found');
      if (internal.room.hostId !== playerId) {
        return this.emitError(client, 'NOT_HOST', 'Only the host can start the game');
      }
      if (internal.room.players.filter((p) => p.connected).length < internal.room.config.minPlayers) {
        return this.emitError(
          client,
          'NOT_ENOUGH',
          `Need at least ${internal.room.config.minPlayers} players`,
        );
      }

      this.gameEngine.startGame(code);
      this.logger.log(`Started game${formatLogMeta({ code, playerId })}`);
      return { started: true };
    } catch (e: any) {
      return this.emitError(client, 'START_FAILED', e.message);
    }
  }

  @SubscribeMessage(C2S.NEXT_SKIP)
  handleSkip(@ConnectedSocket() client: Socket) {
    const code = this.roomService.getRoomCodeBySocket(client.id);
    const playerId = this.roomService.getPlayerIdBySocket(client.id);
    if (code && playerId) {
      this.logger.log(`Received next:skip${formatLogMeta({ code, playerId, socketId: client.id })}`);
      this.gameEngine.skipTransition(code, playerId);
    }
  }

  // ── Gameplay submissions ───────────────────────────────

  @SubscribeMessage(C2S.VOTE_SUBMIT)
  handleVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: VoteSubmitDto,
  ) {
    try {
      this.logger.debug(
        `Received vote:submit${formatLogMeta({ socketId: client.id, questionId: data.questionId, optionId: data.optionId, whyPreview: previewText(data.why) })}`,
      );
      if (this.isSubmissionRateLimited(client.id, C2S.VOTE_SUBMIT)) {
        return this.emitError(client, 'RATE_LIMITED', 'Voting too quickly');
      }
      const code = this.roomService.getRoomCodeBySocket(client.id);
      const playerId = this.roomService.getPlayerIdBySocket(client.id);
      if (!code || !playerId) {
        return this.emitError(client, 'NOT_IN_ROOM', 'Not in a room');
      }
      this.gameEngine.submitVote(code, playerId, data.questionId, data.optionId, data.why);
      this.logger.log(
        `Accepted vote${formatLogMeta({ code, playerId, questionId: data.questionId, optionId: data.optionId, whyLength: data.why.length })}`,
      );
      return { success: true };
    } catch (e: any) {
      return this.emitError(client, 'VOTE_FAILED', e.message);
    }
  }

  @SubscribeMessage(C2S.BEST_SUBMIT)
  handleBest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: BestSubmitDto,
  ) {
    try {
      this.logger.debug(
        `Received best:submit${formatLogMeta({ socketId: client.id, questionId: data.questionId, targetPlayerId: data.targetPlayerId })}`,
      );
      if (this.isSubmissionRateLimited(client.id, C2S.BEST_SUBMIT)) {
        return this.emitError(client, 'RATE_LIMITED', 'Submitting too quickly');
      }
      const code = this.roomService.getRoomCodeBySocket(client.id);
      const playerId = this.roomService.getPlayerIdBySocket(client.id);
      if (!code || !playerId) {
        return this.emitError(client, 'NOT_IN_ROOM', 'Not in a room');
      }
      this.gameEngine.submitBestAnswer(code, playerId, data.questionId, data.targetPlayerId);
      this.logger.log(
        `Accepted best-answer vote${formatLogMeta({ code, playerId, questionId: data.questionId, targetPlayerId: data.targetPlayerId })}`,
      );
      return { success: true };
    } catch (e: any) {
      return this.emitError(client, 'BEST_FAILED', e.message);
    }
  }

  @SubscribeMessage(C2S.CHAOS_TRIGGER)
  handleChaos(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChaosTriggerDto,
  ) {
    try {
      this.logger.debug(
        `Received chaos:trigger${formatLogMeta({ socketId: client.id, type: data.type })}`,
      );
      const code = this.roomService.getRoomCodeBySocket(client.id);
      const playerId = this.roomService.getPlayerIdBySocket(client.id);
      if (!code || !playerId) {
        return this.emitError(client, 'NOT_IN_ROOM', 'Not in a room');
      }

      this.gameEngine.triggerChaos(code, playerId, data.type);
      this.logger.log(`Triggered chaos${formatLogMeta({ code, playerId, type: data.type })}`);
      return { success: true };
    } catch (e: any) {
      return this.emitError(client, 'CHAOS_FAILED', e.message);
    }
  }

  // ── Helpers ────────────────────────────────────────────

  private isSubmissionRateLimited(
    socketId: string,
    eventName: string,
    windowMs = 500,
  ) {
    const key = `${socketId}:${eventName}`;
    const now = Date.now();
    const lastSeen = this.submissionThrottle.get(key) ?? 0;

    if (now - lastSeen < windowMs) {
      this.logger.warn(
        `Rate limited submission${formatLogMeta({ socketId, eventName, windowMs })}`,
      );
      return true;
    }

    this.submissionThrottle.set(key, now);
    return false;
  }

  private clearSubmissionThrottle(socketId: string) {
    for (const key of this.submissionThrottle.keys()) {
      if (key.startsWith(`${socketId}:`)) {
        this.submissionThrottle.delete(key);
      }
    }
  }

  private emitError(client: Socket, code: string, message: string) {
    const payload: ErrorPayload = { code, message };
    this.logger.warn(
      `Emitting socket error${formatLogMeta({ socketId: client.id, code, message })}`,
    );
    client.emit(S2C.ERROR, payload);
    return payload;
  }
}
