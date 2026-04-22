import { Phase, DEFAULT_PHASE_DURATIONS, OPTIONAL_PHASES } from './phases';
import type { RoomConfig, LiveRoomControls, Category, Difficulty } from './types';

export const ALL_CATEGORIES: Category[] = [
  'classic',
  'deep',
  'silly',
  'moral',
  'hypothetical',
];

export const ALL_DIFFICULTIES: Difficulty[] = [
  'easy',
  'medium',
  'hard',
  'spicy',
];

export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  questionCount: 10,
  categories: [...ALL_CATEGORIES],
  difficulty: ['easy', 'medium', 'hard'],
  enabledOptionalPhases: [...OPTIONAL_PHASES],
  phaseDurations: { ...DEFAULT_PHASE_DURATIONS },
  minPlayers: 2,
  maxPlayers: 20,
  allowLateJoin: true,
  reconnectGraceSec: 60,
  profanityFilter: true,
};

export const DEFAULT_LIVE_CONTROLS: LiveRoomControls = {
  timerAdjustSec: 0,
  paused: false,
  skipCurrentPhase: false,
  disabledUpcomingPhases: [],
};

// ── Validation helpers ───────────────────────────────────

export function validateRoomConfig(
  partial: Partial<RoomConfig>,
): string | null {
  if (partial.questionCount !== undefined) {
    if (partial.questionCount < 1 || partial.questionCount > 50)
      return 'questionCount must be 1–50';
  }
  if (partial.minPlayers !== undefined) {
    if (partial.minPlayers < 2 || partial.minPlayers > 20)
      return 'minPlayers must be 2–20';
  }
  if (partial.maxPlayers !== undefined) {
    if (partial.maxPlayers < 2 || partial.maxPlayers > 50)
      return 'maxPlayers must be 2–50';
  }
  if (
    partial.minPlayers !== undefined &&
    partial.maxPlayers !== undefined &&
    partial.minPlayers > partial.maxPlayers
  ) {
    return 'minPlayers cannot exceed maxPlayers';
  }
  if (partial.categories !== undefined) {
    const valid = new Set<string>(ALL_CATEGORIES);
    for (const c of partial.categories) {
      if (!valid.has(c)) return `Unknown category: ${c}`;
    }
    if (partial.categories.length === 0)
      return 'At least one category is required';
  }
  if (partial.difficulty !== undefined) {
    const valid = new Set<string>(ALL_DIFFICULTIES);
    for (const d of partial.difficulty) {
      if (!valid.has(d)) return `Unknown difficulty: ${d}`;
    }
    if (partial.difficulty.length === 0)
      return 'At least one difficulty is required';
  }
  if (partial.enabledOptionalPhases !== undefined) {
    const valid = new Set<string>(OPTIONAL_PHASES);
    for (const p of partial.enabledOptionalPhases) {
      if (!valid.has(p)) return `Phase ${p} is not optional`;
    }
  }
  if (partial.phaseDurations !== undefined) {
    for (const [phase, dur] of Object.entries(partial.phaseDurations)) {
      if (dur < 0 || dur > 300)
        return `Duration for ${phase} must be 0–300s`;
    }
  }
  if (partial.reconnectGraceSec !== undefined) {
    if (partial.reconnectGraceSec < 0 || partial.reconnectGraceSec > 300)
      return 'reconnectGraceSec must be 0–300';
  }
  return null;
}

export function validateLiveControls(
  partial: Partial<LiveRoomControls>,
): string | null {
  if (partial.timerAdjustSec !== undefined) {
    if (
      partial.timerAdjustSec < -120 ||
      partial.timerAdjustSec > 120
    )
      return 'timerAdjustSec must be between -120 and 120';
  }
  if (partial.disabledUpcomingPhases !== undefined) {
    const valid = new Set<string>(OPTIONAL_PHASES);
    for (const p of partial.disabledUpcomingPhases) {
      if (!valid.has(p)) return `Phase ${p} is not optional`;
    }
  }
  return null;
}
