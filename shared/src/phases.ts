export const Phase = {
  LOBBY: 'LOBBY',
  REVEAL: 'REVEAL',
  PAUSE: 'PAUSE',
  VOTE: 'VOTE',
  RESULTS: 'RESULTS',
  BEST_ANSWER: 'BEST_ANSWER',
  STORY: 'STORY',
  TRANSITION: 'TRANSITION',
  SUMMARY: 'SUMMARY',
} as const;

export type Phase = (typeof Phase)[keyof typeof Phase];

/** Phases the host can optionally disable. */
export const OPTIONAL_PHASES: Phase[] = [
  Phase.PAUSE,
  Phase.BEST_ANSWER,
  Phase.STORY,
];

/** Default phase order for a single question round. */
export const PHASE_ORDER: Phase[] = [
  Phase.REVEAL,
  Phase.PAUSE,
  Phase.VOTE,
  Phase.RESULTS,
  Phase.BEST_ANSWER,
  Phase.STORY,
  Phase.TRANSITION,
];

/** Default durations in seconds, keyed by phase. */
export const DEFAULT_PHASE_DURATIONS: Record<Phase, number> = {
  [Phase.LOBBY]: 0, // no timer
  [Phase.REVEAL]: 3,
  [Phase.PAUSE]: 25,
  [Phase.VOTE]: 30,
  [Phase.RESULTS]: 15,
  [Phase.BEST_ANSWER]: 20,
  [Phase.STORY]: 30,
  [Phase.TRANSITION]: 5,
  [Phase.SUMMARY]: 0, // no timer
};
