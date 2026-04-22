export declare const Phase: {
    readonly LOBBY: "LOBBY";
    readonly REVEAL: "REVEAL";
    readonly PAUSE: "PAUSE";
    readonly VOTE: "VOTE";
    readonly RESULTS: "RESULTS";
    readonly BEST_ANSWER: "BEST_ANSWER";
    readonly STORY: "STORY";
    readonly TRANSITION: "TRANSITION";
    readonly SUMMARY: "SUMMARY";
};
export type Phase = (typeof Phase)[keyof typeof Phase];
export declare const OPTIONAL_PHASES: Phase[];
export declare const PHASE_ORDER: Phase[];
export declare const DEFAULT_PHASE_DURATIONS: Record<Phase, number>;
