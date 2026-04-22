// ── Client → Server ──────────────────────────────────────
export const C2S = {
    ROOM_CREATE: 'room:create',
    ROOM_JOIN: 'room:join',
    ROOM_REJOIN: 'room:rejoin',
    ROOM_LEAVE: 'room:leave',
    ROOM_UPDATE_CONFIG: 'room:update-config',
    ROOM_LIVE_CONTROL: 'room:live-control',
    GAME_START: 'game:start',
    VOTE_SUBMIT: 'vote:submit',
    BEST_SUBMIT: 'best:submit',
    STORY_SUBMIT: 'story:submit',
    CHAOS_TRIGGER: 'chaos:trigger',
    NEXT_SKIP: 'next:skip',
};
// ── Server → Client ──────────────────────────────────────
export const S2C = {
    ROOM_STATE: 'room:state',
    ROOM_CONFIG_UPDATED: 'room:config-updated',
    PLAYER_JOINED: 'player:joined',
    PLAYER_LEFT: 'player:left',
    PHASE_CHANGE: 'phase:change',
    HOT_TAKES_ASSIGNED: 'hot_takes:assigned',
    RESULTS_REVEAL: 'results:reveal',
    BEST_CANDIDATES: 'best:candidates',
    STORY_PROMPT: 'story:prompt',
    SILENT_NUDGE: 'silent:nudge',
    SUMMARY_SHOW: 'summary:show',
    ERROR: 'error',
};
