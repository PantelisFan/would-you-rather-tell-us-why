import { S2C } from '@wyr/shared';
import { RoomGateway } from '../src/rooms/room.gateway';

describe('RoomGateway', () => {
  const createClient = () => ({
    id: 'socket-1',
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  });

  it('returns a room snapshot and emits room:state on create', () => {
    const room = {
      code: 'ABCD',
      hostId: 'player-1',
      players: [
        { id: 'player-1', name: 'Alice', connected: true, isHost: true },
      ],
      config: {} as never,
      phase: 'LOBBY' as never,
      currentQuestion: null,
      currentQuestionIndex: 0,
      totalQuestions: 10,
      started: false,
    };
    const snapshot = { room, playerId: 'player-1' };
    const roomService = {
      createRoom: jest.fn().mockReturnValue({ room, playerId: 'player-1' }),
    };
    const gameEngine = {
      setServer: jest.fn(),
      getRoomStatePayload: jest.fn().mockReturnValue(snapshot),
    };
    const gateway = new RoomGateway(roomService as never, gameEngine as never);
    const client = createClient();

    const result = gateway.handleCreate(client as never, { hostName: 'Alice' } as never);

    expect(client.join).toHaveBeenCalledWith('ABCD');
    expect(client.emit).toHaveBeenCalledWith(S2C.ROOM_STATE, snapshot);
    expect(result).toEqual(snapshot);
  });

  it('rate limits duplicate vote submissions from the same socket', () => {
    const roomService = {
      getRoomCodeBySocket: jest.fn().mockReturnValue('ABCD'),
      getPlayerIdBySocket: jest.fn().mockReturnValue('player-1'),
    };
    const gameEngine = {
      setServer: jest.fn(),
      submitVote: jest.fn(),
    };
    const gateway = new RoomGateway(roomService as never, gameEngine as never);
    const client = createClient();
    const payload = {
      questionId: 'q1',
      optionId: 'opt-1',
      why: 'Because.',
    };

    const first = gateway.handleVote(client as never, payload as never);
    const second = gateway.handleVote(client as never, payload as never);

    expect(first).toEqual({ success: true });
    expect(second).toEqual({ code: 'RATE_LIMITED', message: 'Voting too quickly' });
    expect(client.emit).toHaveBeenCalledWith(
      S2C.ERROR,
      expect.objectContaining({ code: 'RATE_LIMITED' }),
    );
  });

  it('returns room preview data for share-link joins', () => {
    const roomService = {
      getRoomPreview: jest.fn().mockReturnValue({
        roomCode: 'ABCD',
        started: true,
        allowLateJoin: true,
        canJoin: true,
        joinBlockedReason: null,
        playerCount: 4,
        connectedPlayerCount: 3,
        maxPlayers: 8,
        phase: 'VOTE',
      }),
    };
    const gameEngine = {
      setServer: jest.fn(),
    };
    const gateway = new RoomGateway(roomService as never, gameEngine as never);
    const client = createClient();

    const result = gateway.handlePreview(client as never, { code: 'ABCD' } as never);

    expect(roomService.getRoomPreview).toHaveBeenCalledWith('ABCD');
    expect(result).toEqual(
      expect.objectContaining({
        roomCode: 'ABCD',
        started: true,
        canJoin: true,
      }),
    );
  });
});