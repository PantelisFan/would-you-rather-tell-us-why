import { create } from 'zustand';
import type {
  Room,
  Player,
  Phase,
  Question,
  RoomConfig,
  RoundResults,
  Vote,
  SummaryData,
} from '@wyr/shared';

export interface GameStore {
  // Identity
  me: Player | null;
  playerId: string | null;

  // Room
  room: Room | null;
  phase: Phase | null;
  endsAt: number;
  isHost: boolean;

  // Current round
  currentQuestion: Question | null;
  myVote: { optionId: string; why: string } | null;
  results: RoundResults | null;
  bestCandidates: Vote[];
  hotTakePlayerIds: string[];
  storyPromptPlayerIds: string[];

  // Summary
  summary: SummaryData | null;
  nudgePlayerId: string | null;

  // Connection
  connected: boolean;
  error: string | null;

  // Actions
  setMe: (player: Player, playerId: string) => void;
  setRoom: (room: Room) => void;
  setPhase: (phase: Phase, endsAt: number) => void;
  setCurrentQuestion: (q: Question | null) => void;
  setMyVote: (v: { optionId: string; why: string } | null) => void;
  setResults: (r: RoundResults | null) => void;
  setBestCandidates: (c: Vote[]) => void;
  setHotTakePlayerIds: (ids: string[]) => void;
  setStoryPromptPlayerIds: (ids: string[]) => void;
  setSummary: (s: SummaryData | null) => void;
  setConnected: (c: boolean) => void;
  setError: (e: string | null) => void;
  setNudgePlayerId: (playerId: string | null) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updateConfig: (config: RoomConfig) => void;
  reset: () => void;
}

const initial = {
  me: null,
  playerId: null,
  room: null,
  phase: null,
  endsAt: 0,
  isHost: false,
  currentQuestion: null,
  myVote: null,
  results: null,
  bestCandidates: [],
  hotTakePlayerIds: [],
  storyPromptPlayerIds: [],
  summary: null,
  nudgePlayerId: null,
  connected: false,
  error: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initial,

  setMe: (player, playerId) =>
    set({ me: player, playerId, isHost: player.isHost }),

  setRoom: (room) =>
    set({
      room,
      phase: room.phase as Phase,
      isHost: room.hostId === get().playerId,
    }),

  setPhase: (phase, endsAt) => set({ phase, endsAt }),

  setCurrentQuestion: (q) => set({ currentQuestion: q, myVote: null }),

  setMyVote: (v) => set({ myVote: v }),

  setResults: (r) => set({ results: r }),

  setBestCandidates: (c) => set({ bestCandidates: c }),

  setHotTakePlayerIds: (ids) => set({ hotTakePlayerIds: ids }),

  setStoryPromptPlayerIds: (ids) => set({ storyPromptPlayerIds: ids }),

  setSummary: (s) => set({ summary: s }),

  setNudgePlayerId: (playerId) => set({ nudgePlayerId: playerId }),

  setConnected: (c) => set({ connected: c }),

  setError: (e) => set({ error: e }),

  addPlayer: (player) => {
    const room = get().room;
    if (!room) return;
    const exists = room.players.some((p) => p.id === player.id);
    const players = exists
      ? room.players.map((p) => (p.id === player.id ? player : p))
      : [...room.players, player];
    set({ room: { ...room, players } });
  },

  removePlayer: (playerId) => {
    const room = get().room;
    if (!room) return;
    set({
      room: {
        ...room,
        players: room.players.filter((p) => p.id !== playerId),
      },
    });
  },

  updateConfig: (config) => {
    const room = get().room;
    if (!room) return;
    set({ room: { ...room, config } });
  },

  reset: () => set(initial),
}));
