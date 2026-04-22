import { RoomService } from '../src/rooms/room.service';
import {
  DEFAULT_ROOM_CONFIG,
  Phase,
  validateRoomConfig,
  validateLiveControls,
  OPTIONAL_PHASES,
} from '@wyr/shared';

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new RoomService();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ── Room creation ────────────────────────────────────

  it('creates a room with default config', () => {
    const { room, playerId } = service.createRoom('sock1', 'Alice');
    expect(room.code).toHaveLength(4);
    expect(room.hostId).toBe(playerId);
    expect(room.players).toHaveLength(1);
    expect(room.players[0].name).toBe('Alice');
    expect(room.players[0].isHost).toBe(true);
    expect(room.config).toEqual(DEFAULT_ROOM_CONFIG);
    expect(room.started).toBe(false);
    expect(room.phase).toBe(Phase.LOBBY);
  });

  it('creates a room with config overrides', () => {
    const { room } = service.createRoom('sock1', 'Alice', {
      questionCount: 5,
      maxPlayers: 8,
    });
    expect(room.config.questionCount).toBe(5);
    expect(room.config.maxPlayers).toBe(8);
    // Unchanged defaults preserved
    expect(room.config.minPlayers).toBe(DEFAULT_ROOM_CONFIG.minPlayers);
  });

  it('rejects invalid config on create', () => {
    expect(() =>
      service.createRoom('sock1', 'Alice', { questionCount: 100 }),
    ).toThrow('questionCount must be 1–50');
  });

  it('generates unique room codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const { room } = service.createRoom(`sock${i}`, `Player${i}`);
      codes.add(room.code);
    }
    expect(codes.size).toBe(50);
  });

  // ── Joining ──────────────────────────────────────────

  it('allows players to join an existing room', () => {
    const { room } = service.createRoom('sock1', 'Alice');
    const { room: updated, playerId } = service.joinRoom(
      'sock2',
      room.code,
      'Bob',
    );
    expect(updated.players).toHaveLength(2);
    expect(updated.players[1].name).toBe('Bob');
    expect(updated.players[1].isHost).toBe(false);
  });

  it('rejects join with invalid room code', () => {
    expect(() => service.joinRoom('sock2', 'ZZZZ', 'Bob')).toThrow(
      'Room not found',
    );
  });

  it('rejects join when room is full', () => {
    const { room } = service.createRoom('sock1', 'Alice', { maxPlayers: 2 });
    service.joinRoom('sock2', room.code, 'Bob');
    expect(() => service.joinRoom('sock3', room.code, 'Charlie')).toThrow(
      'Room is full',
    );
  });

  // ── Rejoin ───────────────────────────────────────────

  it('allows a disconnected player to rejoin', () => {
    const { room, playerId } = service.createRoom('sock1', 'Alice');
    service.handleDisconnect('sock1');
    const rejoined = service.rejoinRoom('sock3', room.code, playerId);
    expect(rejoined.players[0].connected).toBe(true);
  });

  it('rejects rejoin with wrong playerId', () => {
    const { room } = service.createRoom('sock1', 'Alice');
    expect(() => service.rejoinRoom('sock3', room.code, 'fake-id')).toThrow(
      'Player not found',
    );
  });

  // ── Disconnect ───────────────────────────────────────

  it('marks player as disconnected on socket disconnect', () => {
    const { room } = service.createRoom('sock1', 'Alice');
    const result = service.handleDisconnect('sock1');
    expect(result).not.toBeNull();
    expect(room.players[0].connected).toBe(false);
  });

  it('returns null for unknown socket disconnect', () => {
    expect(service.handleDisconnect('unknown')).toBeNull();
  });

  // ── Config updates (host-only, pre-start) ────────────

  it('allows host to update config before game start', () => {
    const { room, playerId } = service.createRoom('sock1', 'Alice');
    const config = service.updateConfig(room.code, playerId, {
      questionCount: 3,
    });
    expect(config.questionCount).toBe(3);
  });

  it('rejects config update from non-host', () => {
    const { room } = service.createRoom('sock1', 'Alice');
    const { playerId: bobId } = service.joinRoom('sock2', room.code, 'Bob');
    expect(() =>
      service.updateConfig(room.code, bobId, { questionCount: 3 }),
    ).toThrow('Only the host');
  });

  it('rejects config update after game start', () => {
    const { room, playerId } = service.createRoom('sock1', 'Alice');
    // Simulate game start
    room.started = true;
    expect(() =>
      service.updateConfig(room.code, playerId, { questionCount: 3 }),
    ).toThrow('Cannot change structural config after game start');
  });

  it('rejects invalid config values on update', () => {
    const { room, playerId } = service.createRoom('sock1', 'Alice');
    expect(() =>
      service.updateConfig(room.code, playerId, { minPlayers: 25 }),
    ).toThrow('minPlayers must be 2–20');
  });

  // ── Socket-to-room lookups ───────────────────────────

  it('resolves room code and player id from socket', () => {
    const { room, playerId } = service.createRoom('sock1', 'Alice');
    expect(service.getRoomCodeBySocket('sock1')).toBe(room.code);
    expect(service.getPlayerIdBySocket('sock1')).toBe(playerId);
  });

  it('returns undefined for unknown socket', () => {
    expect(service.getRoomCodeBySocket('unknown')).toBeUndefined();
    expect(service.getPlayerIdBySocket('unknown')).toBeUndefined();
  });
});

// ── Shared validation ────────────────────────────────────

describe('validateRoomConfig', () => {
  it('accepts valid partial config', () => {
    expect(validateRoomConfig({ questionCount: 10 })).toBeNull();
  });

  it('rejects out-of-range questionCount', () => {
    expect(validateRoomConfig({ questionCount: 0 })).toMatch(/questionCount/);
    expect(validateRoomConfig({ questionCount: 51 })).toMatch(/questionCount/);
  });

  it('rejects unknown category', () => {
    expect(validateRoomConfig({ categories: ['unknown' as any] })).toMatch(
      /Unknown category/,
    );
  });

  it('rejects empty categories', () => {
    expect(validateRoomConfig({ categories: [] })).toMatch(/At least one/);
  });

  it('rejects unknown difficulty', () => {
    expect(validateRoomConfig({ difficulty: ['extreme' as any] })).toMatch(
      /Unknown difficulty/,
    );
  });

  it('rejects non-optional phase in enabledOptionalPhases', () => {
    expect(
      validateRoomConfig({ enabledOptionalPhases: [Phase.VOTE] }),
    ).toMatch(/not optional/);
  });

  it('rejects negative phase duration', () => {
    expect(
      validateRoomConfig({
        phaseDurations: { ...DEFAULT_ROOM_CONFIG.phaseDurations, VOTE: -1 },
      }),
    ).toMatch(/Duration/);
  });

  it('rejects minPlayers > maxPlayers', () => {
    expect(
      validateRoomConfig({ minPlayers: 10, maxPlayers: 5 }),
    ).toMatch(/cannot exceed/);
  });
});

describe('validateLiveControls', () => {
  it('accepts valid controls', () => {
    expect(validateLiveControls({ timerAdjustSec: 30 })).toBeNull();
    expect(validateLiveControls({ paused: true })).toBeNull();
  });

  it('rejects excessive timer adjustment', () => {
    expect(validateLiveControls({ timerAdjustSec: 200 })).toMatch(
      /timerAdjustSec/,
    );
  });

  it('rejects non-optional phase in disabledUpcomingPhases', () => {
    expect(
      validateLiveControls({ disabledUpcomingPhases: [Phase.VOTE] }),
    ).toMatch(/not optional/);
  });
});
