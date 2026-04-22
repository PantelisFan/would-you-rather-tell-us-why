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

  it('plays through all custom questions and reaches summary', () => {
    const customQuestions = [
      { id: '', text: 'Custom Q1', options: [{ id: '', label: 'A1' }, { id: '', label: 'B1' }] as [any, any], category: 'classic' as const, difficulty: 'easy' as const },
      { id: '', text: 'Custom Q2', options: [{ id: '', label: 'A2' }, { id: '', label: 'B2' }] as [any, any], category: 'classic' as const, difficulty: 'easy' as const },
      { id: '', text: 'Custom Q3', options: [{ id: '', label: 'A3' }, { id: '', label: 'B3' }] as [any, any], category: 'classic' as const, difficulty: 'easy' as const },
    ];

    const { room, playerId } = roomService.createRoom('sock1', 'Alice', { customQuestions });
    const bob = roomService.joinRoom('sock2', room.code, 'Bob');

    expect(room.config.customQuestions.length).toBe(3);
    expect(room.config.customQuestions[0].id).toBe('custom-0');

    gameEngine.startGame(room.code);

    expect(room.totalQuestions).toBe(3);
    expect(room.phase).toBe(Phase.REVEAL);
    expect(room.currentQuestion?.text).toMatch(/^Custom Q/);

    // Play through all 3 questions
    for (let i = 0; i < 3; i++) {
      // REVEAL → VOTE
      jest.advanceTimersByTime(3000);
      expect(room.phase).toBe(Phase.VOTE);

      // Vote
      const qId = room.currentQuestion!.id;
      gameEngine.submitVote(room.code, playerId, qId, room.currentQuestion!.options[0].id, 'Reason');
      gameEngine.submitVote(room.code, bob.playerId, qId, room.currentQuestion!.options[1].id, 'Other');

      // VOTE (shortened to 3s) → PAUSE → RESULTS → BEST_ANSWER → TRANSITION
      jest.advanceTimersByTime(3000);  // vote auto-shortened
      jest.advanceTimersByTime(40000); // pause
      jest.advanceTimersByTime(10000); // results
      jest.advanceTimersByTime(15000); // best answer
      jest.advanceTimersByTime(3000);  // transition
    }

    expect(room.phase).toBe(Phase.SUMMARY);
    expect(room.currentQuestionIndex).toBe(3);

    roomService.deleteRoom(room.code);
  });

  it('rejects custom questions array with fewer than 3 entries', () => {
    const twoQuestions = [
      { id: '', text: 'Q1', options: [{ id: '', label: 'A' }, { id: '', label: 'B' }] as [any, any], category: 'classic' as const, difficulty: 'easy' as const },
      { id: '', text: 'Q2', options: [{ id: '', label: 'A' }, { id: '', label: 'B' }] as [any, any], category: 'classic' as const, difficulty: 'easy' as const },
    ];

    expect(() => roomService.createRoom('sock1', 'Alice', { customQuestions: twoQuestions }))
      .toThrow('Custom mode requires at least 3 questions');
  });
});