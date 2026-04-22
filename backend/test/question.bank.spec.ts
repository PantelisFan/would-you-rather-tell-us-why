import { QuestionBank } from '../src/questions/question.bank';

describe('QuestionBank', () => {
  let bank: QuestionBank;

  beforeEach(() => {
    bank = new QuestionBank();
  });

  it('picks the requested number of questions', () => {
    const questions = bank.pickQuestions(
      5,
      ['classic', 'deep', 'silly', 'moral', 'hypothetical'],
      ['easy', 'medium', 'hard', 'spicy'],
      new Set(),
    );
    expect(questions).toHaveLength(5);
  });

  it('filters by category', () => {
    const questions = bank.pickQuestions(
      50,
      ['silly'],
      ['easy', 'medium', 'hard', 'spicy'],
      new Set(),
    );
    for (const q of questions) {
      expect(q.category).toBe('silly');
    }
  });

  it('filters by difficulty', () => {
    const questions = bank.pickQuestions(
      50,
      ['classic', 'deep', 'silly', 'moral', 'hypothetical'],
      ['spicy'],
      new Set(),
    );
    for (const q of questions) {
      expect(q.difficulty).toBe('spicy');
    }
  });

  it('respects used question IDs', () => {
    const first = bank.pickQuestions(
      5,
      ['classic', 'deep', 'silly', 'moral', 'hypothetical'],
      ['easy', 'medium', 'hard', 'spicy'],
      new Set(),
    );
    const usedIds = new Set(first.map((q) => q.id));
    const second = bank.pickQuestions(
      5,
      ['classic', 'deep', 'silly', 'moral', 'hypothetical'],
      ['easy', 'medium', 'hard', 'spicy'],
      usedIds,
    );
    for (const q of second) {
      expect(usedIds.has(q.id)).toBe(false);
    }
  });

  it('returns fewer questions if pool is exhausted', () => {
    const questions = bank.pickQuestions(
      100,
      ['classic'],
      ['spicy'],
      new Set(),
    );
    // There aren't 100 classic+spicy questions
    expect(questions.length).toBeLessThan(100);
  });

  it('returns questions with valid structure', () => {
    const questions = bank.pickQuestions(
      3,
      ['classic', 'deep', 'silly', 'moral', 'hypothetical'],
      ['easy', 'medium', 'hard', 'spicy'],
      new Set(),
    );
    for (const q of questions) {
      expect(q.id).toBeDefined();
      expect(q.text).toBeTruthy();
      expect(q.options).toHaveLength(2);
      expect(q.options[0].id).toBeDefined();
      expect(q.options[0].label).toBeTruthy();
      expect(q.category).toBeDefined();
      expect(q.difficulty).toBeDefined();
    }
  });
});
