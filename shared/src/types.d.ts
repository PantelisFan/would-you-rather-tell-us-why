import type { Phase } from './phases';
export interface Player {
    id: string;
    name: string;
    connected: boolean;
    isHost: boolean;
}
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
}
export interface LiveRoomControls {
    timerAdjustSec: number;
    paused: boolean;
    skipCurrentPhase: boolean;
    disabledUpcomingPhases: Phase[];
}
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
export interface StoryEntry {
    playerId: string;
    questionId: string;
    text: string;
}
export type HighlightType = 'minority' | 'split' | 'unanimous';
export interface Highlight {
    type: HighlightType;
    copy: string;
}
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
export interface PhaseChangePayload {
    phase: Phase;
    endsAt: number;
    question?: Question;
    results?: RoundResults;
    bestCandidates?: Vote[];
    storyPromptPlayerIds?: string[];
    hotTakePlayerIds?: string[];
    summary?: SummaryData;
}
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
