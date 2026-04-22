import type { Phase } from './phases';

// ── Players ──────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
}

// ── Questions ────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard' | 'spicy';
export type Category = 'classic' | 'deep' | 'silly' | 'moral' | 'hypothetical';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  options: [QuestionOption, QuestionOption];
  category: Category;
  difficulty: Difficulty;
}

// ── Room Config (structural — locks at game start) ───────

export interface RoomConfig {
  questionCount: number;
  categories: Category[];
  difficulty: Difficulty[];
  enabledOptionalPhases: Phase[];
  phaseDurations: Record<Phase, number>;
  minPlayers: number;
  maxPlayers: number;
  allowLateJoin: boolean;
  reconnectGraceSec: number;
  profanityFilter: boolean;
  /** When non-empty, the game uses these instead of the built-in bank. */
  customQuestions: Question[];
}

// ── Live Room Controls (operational — editable mid-game) ─

export interface LiveRoomControls {
  /** Positive = extend, negative = shorten (seconds). Applied once. */
  timerAdjustSec: number;
  paused: boolean;
  /** Skip the current phase immediately. */
  skipCurrentPhase: boolean;
  /** Phases to disable for all remaining rounds. */
  disabledUpcomingPhases: Phase[];
}

// ── Votes & Answers ──────────────────────────────────────

export interface Vote {
  playerId: string;
  questionId: string;
  optionId: string;
  why: string;
}

export interface BestAnswerVote {
  voterId: string;
  questionId: string;
  targetPlayerId: string;
}

// ── Highlight ────────────────────────────────────────────

export type HighlightType = 'minority' | 'split' | 'unanimous';

export interface Highlight {
  type: HighlightType;
  copy: string;
}

// ── Distribution ─────────────────────────────────────────

export interface OptionResult {
  optionId: string;
  count: number;
  percentage: number;
  voterNames: string[];
}

export interface RoundResults {
  questionId: string;
  distribution: OptionResult[];
  highlights: Highlight[];
  allWhys: Vote[];
}

// ── Room ─────────────────────────────────────────────────

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  config: RoomConfig;
  phase: Phase;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  started: boolean;
}

// ── Phase Change Payload ─────────────────────────────────

export interface PhaseChangePayload {
  phase: Phase;
  endsAt: number; // epoch ms
  notice?: string;
  currentQuestionIndex?: number;
  question?: Question;
  results?: RoundResults;
  bestCandidates?: Vote[];
  hotTakePlayerIds?: string[];
  summary?: SummaryData;
}

// ── Summary ──────────────────────────────────────────────

export interface SummaryMoment {
  label: string;
  description: string;
  playerIds: string[];
}

export interface SummaryData {
  moments: SummaryMoment[];
  totalQuestions: number;
  totalPlayers: number;
}
