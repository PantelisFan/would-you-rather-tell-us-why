import type { RoomConfig, LiveRoomControls, Category, Difficulty } from './types';
export declare const ALL_CATEGORIES: Category[];
export declare const ALL_DIFFICULTIES: Difficulty[];
export declare const DEFAULT_ROOM_CONFIG: RoomConfig;
export declare const DEFAULT_LIVE_CONTROLS: LiveRoomControls;
export declare function validateRoomConfig(partial: Partial<RoomConfig>): string | null;
export declare function validateLiveControls(partial: Partial<LiveRoomControls>): string | null;
