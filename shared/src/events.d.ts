export declare const C2S: {
    readonly ROOM_CREATE: "room:create";
    readonly ROOM_JOIN: "room:join";
    readonly ROOM_REJOIN: "room:rejoin";
    readonly ROOM_LEAVE: "room:leave";
    readonly ROOM_UPDATE_CONFIG: "room:update-config";
    readonly ROOM_LIVE_CONTROL: "room:live-control";
    readonly GAME_START: "game:start";
    readonly VOTE_SUBMIT: "vote:submit";
    readonly BEST_SUBMIT: "best:submit";
    readonly STORY_SUBMIT: "story:submit";
    readonly CHAOS_TRIGGER: "chaos:trigger";
    readonly NEXT_SKIP: "next:skip";
};
export declare const S2C: {
    readonly ROOM_STATE: "room:state";
    readonly ROOM_CONFIG_UPDATED: "room:config-updated";
    readonly PLAYER_JOINED: "player:joined";
    readonly PLAYER_LEFT: "player:left";
    readonly PHASE_CHANGE: "phase:change";
    readonly HOT_TAKES_ASSIGNED: "hot_takes:assigned";
    readonly RESULTS_REVEAL: "results:reveal";
    readonly BEST_CANDIDATES: "best:candidates";
    readonly STORY_PROMPT: "story:prompt";
    readonly SILENT_NUDGE: "silent:nudge";
    readonly SUMMARY_SHOW: "summary:show";
    readonly ERROR: "error";
};
import type { RoomConfig, LiveRoomControls, Room, Player } from './types';
export interface CreateRoomPayload {
    hostName: string;
    config?: Partial<RoomConfig>;
}
export interface JoinRoomPayload {
    code: string;
    name: string;
}
export interface RejoinRoomPayload {
    code: string;
    playerId: string;
}
export interface UpdateConfigPayload {
    config: Partial<RoomConfig>;
}
export interface LiveControlPayload {
    controls: Partial<LiveRoomControls>;
}
export interface VoteSubmitPayload {
    questionId: string;
    optionId: string;
    why: string;
}
export interface BestSubmitPayload {
    questionId: string;
    targetPlayerId: string;
}
export interface StorySubmitPayload {
    questionId: string;
    text: string;
}
export interface ChaosPayload {
    type: string;
}
export interface RoomStatePayload {
    room: Room;
    playerId: string;
}
export interface PlayerJoinedPayload {
    player: Player;
}
export interface PlayerLeftPayload {
    playerId: string;
}
export interface ErrorPayload {
    code: string;
    message: string;
}
