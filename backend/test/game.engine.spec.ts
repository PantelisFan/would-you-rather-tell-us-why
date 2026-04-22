import { Phase, S2C } from '@wyr/shared';
import { GameEngine } from '../src/game/game.engine';
import { QuestionBank } from '../src/questions/question.bank';
import { RoomService } from '../src/rooms/room.service';

describe('GameEngine', () => {
  let roomService: RoomService;
  let questionBank: QuestionBank;
  let gameEngine: GameEngine;
  let emit: jest.Mock;
  let server: { to: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers();
    roomService = new RoomService();
    questionBank = new QuestionBank();
    gameEngine = new GameEngine(roomService, questionBank);
    emit = jest.fn();
    server = {
      to: jest.fn().mockReturnValue({ emit }),
    };
    gameEngine.setServer(server as never);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns a room snapshot with the current phase payload', () => {
    const { room, playerId } = roomService.createRoom('sock1', 'Alice');
    roomService.joinRoom('sock2', room.code, 'Bob');

    gameEngine.startGame(room.code);

    const snapshot = gameEngine.getRoomStatePayload(room.code, playerId);

    expect(snapshot?.room.code).toBe(room.code);
    expect(snapshot?.playerId).toBe(playerId);
    expect(snapshot?.phaseState?.phase).toBe(Phase.REVEAL);
    expect(snapshot?.phaseState?.question?.text).toBeTruthy();

    roomService.deleteRoom(room.code);
  });

  it('assigns hot takes when entering the PAUSE phase', () => {
    const { room, playerId } = roomService.createRoom('sock1', 'Alice');
    roomService.joinRoom('sock2', room.code, 'Bob');

    gameEngine.startGame(room.code);
    jest.advanceTimersByTime(3000);

    const snapshot = gameEngine.getRoomStatePayload(room.code, playerId);

    expect(snapshot?.phaseState?.phase).toBe(Phase.PAUSE);
    expect(snapshot?.phaseState?.hotTakePlayerIds?.length).toBeGreaterThan(0);

    roomService.deleteRoom(room.code);
  });

  it('emits a silent nudge when chaos callout is triggered', () => {
    const { room, playerId } = roomService.createRoom('sock1', 'Alice');
    roomService.joinRoom('sock2', room.code, 'Bob');

    gameEngine.startGame(room.code);
    emit.mockClear();
    server.to.mockClear();

    gameEngine.triggerChaos(room.code, playerId, 'callout');

    expect(server.to).toHaveBeenCalledWith(room.code);
    expect(emit).toHaveBeenCalledWith(
      S2C.SILENT_NUDGE,
      expect.objectContaining({ playerId: expect.any(String) }),
    );

    roomService.deleteRoom(room.code);
  });
});