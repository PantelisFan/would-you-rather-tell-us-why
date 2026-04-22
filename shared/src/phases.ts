export const Phase = {
  LOBBY: 'LOBBY',
  REVEAL: 'REVEAL',
  PAUSE: 'PAUSE',
  VOTE: 'VOTE',
  RESULTS: 'RESULTS',
  BEST_ANSWER: 'BEST_ANSWER',
  TRANSITION: 'TRANSITION',
  SUMMARY: 'SUMMARY',
} as const;

export type Phase = (typeof Phase)[keyof typeof Phase];

/** Phases the host can optionally disable. */
export const OPTIONAL_PHASES: Phase[] = [
  Phase.PAUSE,
  Phase.BEST_ANSWER,
];

/** Default phase order for a single question round. */
export const PHASE_ORDER: Phase[] = [
  Phase.REVEAL,
  Phase.VOTE,
  Phase.PAUSE,
  Phase.RESULTS,
  Phase.BEST_ANSWER,
  Phase.TRANSITION,
];

/** Default durations in seconds, keyed by phase. */
export const DEFAULT_PHASE_DURATIONS: Record<Phase, number> = {
  [Phase.LOBBY]: 0, // no timer
  [Phase.REVEAL]: 3,
  [Phase.PAUSE]: 40,
  [Phase.VOTE]: 15,
  [Phase.RESULTS]: 10,
  [Phase.BEST_ANSWER]: 15,
  [Phase.TRANSITION]: 3,
  [Phase.SUMMARY]: 0, // no timer
};
