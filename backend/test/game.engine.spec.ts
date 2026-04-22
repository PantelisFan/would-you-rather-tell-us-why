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

  it('assigns hot takes after voting and only from players who voted', () => {
    const { room, playerId } = roomService.createRoom('sock1', 'Alice');
    const bob = roomService.joinRoom('sock2', room.code, 'Bob');

    gameEngine.startGame(room.code);
    jest.advanceTimersByTime(3000);

    expect(gameEngine.getRoomStatePayload(room.code, playerId)?.phaseState?.phase).toBe(Phase.VOTE);

    const questionId = room.currentQuestion?.id;
    expect(questionId).toBeTruthy();

    gameEngine.submitVote(room.code, playerId, questionId!, room.currentQuestion!.options[0].id, 'Easy choice');
    gameEngine.submitVote(room.code, bob.playerId, questionId!, room.currentQuestion!.options[1].id, 'Absolutely this');

    jest.advanceTimersByTime(3000);

    const snapshot = gameEngine.getRoomStatePayload(room.code, playerId);
    const hotTakePlayerIds = snapshot?.phaseState?.hotTakePlayerIds ?? [];

    expect(snapshot?.phaseState?.phase).toBe(Phase.PAUSE);
    expect(hotTakePlayerIds.length).toBeGreaterThan(0);
    expect(hotTakePlayerIds.every((id) => [playerId, bob.playerId].includes(id))).toBe(true);

    roomService.deleteRoom(room.code);
  });

  it('shortens the vote timer to 3 seconds and notifies the room when everyone has voted', () => {
    const { room, playerId } = roomService.createRoom('sock1', 'Alice');
    const bob = roomService.joinRoom('sock2', room.code, 'Bob');

    gameEngine.startGame(room.code);
    jest.advanceTimersByTime(3000);

    emit.mockClear();
    server.to.mockClear();

    const questionId = room.currentQuestion?.id;
    expect(questionId).toBeTruthy();

    gameEngine.submitVote(room.code, playerId, questionId!, room.currentQuestion!.options[0].id, 'Easy choice');
    gameEngine.submitVote(room.code, bob.playerId, questionId!, room.currentQuestion!.options[1].id, 'Absolutely this');

    const snapshot = gameEngine.getRoomStatePayload(room.code, playerId);
    const remainingMs = (snapshot?.phaseState?.endsAt ?? 0) - Date.now();

    expect(snapshot?.phaseState?.phase).toBe(Phase.VOTE);
    expect(snapshot?.phaseState?.notice).toBe('Everyone has voted. Moving on in 3 seconds.');
    expect(remainingMs).toBeLessThanOrEqual(3000);
    expect(remainingMs).toBeGreaterThan(0);
    expect(server.to).toHaveBeenCalledWith(room.code);
    expect(emit).toHaveBeenCalledWith(
      S2C.PHASE_CHANGE,
      expect.objectContaining({
        phase: Phase.VOTE,
        notice: 'Everyone has voted. Moving on in 3 seconds.',
      }),
    );

    roomService.deleteRoom(room.code);
  });

  it('shortens the best-answer timer to 3 seconds and notifies the room when everyone has voted', () => {
    const { room, playerId } = roomService.createRoom('sock1', 'Alice');
    const bob = roomService.joinRoom('sock2', room.code, 'Bob');

    gameEngine.startGame(room.code);
    jest.advanceTimersByTime(3000);

    const questionId = room.currentQuestion?.id;
    expect(questionId).toBeTruthy();

    gameEngine.submitVote(room.code, playerId, questionId!, room.currentQuestion!.options[0].id, 'Easy choice');
    gameEngine.submitVote(room.code, bob.playerId, questionId!, room.currentQuestion!.options[1].id, 'Absolutely this');
    jest.advanceTimersByTime(3000);
    jest.advanceTimersByTime(40000);
    jest.advanceTimersByTime(10000);

    emit.mockClear();
    server.to.mockClear();

    const candidates = gameEngine.getRoomStatePayload(room.code, playerId)?.phaseState?.bestCandidates ?? [];
    expect(gameEngine.getRoomStatePayload(room.code, playerId)?.phaseState?.phase).toBe(Phase.BEST_ANSWER);
    expect(candidates.length).toBeGreaterThan(0);

    gameEngine.submitBestAnswer(room.code, playerId, questionId!, candidates[0].playerId);
    gameEngine.submitBestAnswer(room.code, bob.playerId, questionId!, candidates[0].playerId);

    const snapshot = gameEngine.getRoomStatePayload(room.code, playerId);
    const remainingMs = (snapshot?.phaseState?.endsAt ?? 0) - Date.now();

    expect(snapshot?.phaseState?.phase).toBe(Phase.BEST_ANSWER);
    expect(snapshot?.phaseState?.notice).toBe('Everyone has voted. Moving on in 3 seconds.');
    expect(remainingMs).toBeLessThanOrEqual(3000);
    expect(remainingMs).toBeGreaterThan(0);
    expect(server.to).toHaveBeenCalledWith(room.code);
    expect(emit).toHaveBeenCalledWith(
      S2C.PHASE_CHANGE,
      expect.objectContaining({
        phase: Phase.BEST_ANSWER,
        notice: 'Everyone has voted. Moving on in 3 seconds.',
      }),
    );

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