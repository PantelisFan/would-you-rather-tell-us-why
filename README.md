# Would You Rather — Tell Us Why

A real-time multiplayer "Would You Rather" party game where everyone explains *why*. Pick a side, defend your choice, and find out how the room voted.

Built with **NestJS + Socket.IO** (backend), **React + Zustand** (frontend), and a **shared TypeScript contract layer**.

---

## Quick Start

```bash
# Install dependencies
cd shared && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Run both services concurrently from the root
npm run dev
```

Or run them individually:

```bash
# Backend — http://localhost:3001
cd backend && npm run start:dev

# Frontend — http://localhost:5173 (proxies socket to backend)
cd frontend && npm run dev
```

Open `http://localhost:5173` in two or more browser tabs to test locally.

---

## How It Works

1. **Create or join a room** — one player hosts and shares a 4-letter room code.
2. **Reveal** — a "Would you rather…" prompt appears for everyone simultaneously.
3. **Vote** — each player picks an option and optionally adds a short reason.
4. **Pause** — votes lock. 1–2 players are randomly called out to defend their pick before results drop.
5. **Results** — see the full room split, highlights, and everyone's "why".
6. **Best Answer** — vote for the strongest or funniest explanation.
7. **Transition** — a brief reset before the next question.
8. After all questions, a **Summary** screen recaps standout moments.

The host can skip phases, adjust the timer, or pause the game at any point using live controls.

---

## Project Structure

```
would-you-rather-tell-us-why/
├── shared/                  @wyr/shared — types, events, phases, config, validation
│   └── src/
│       ├── phases.ts        Phase constants, PHASE_ORDER, default durations
│       ├── types.ts         Room, Player, Question, Vote, PhaseChangePayload, …
│       ├── events.ts        C2S / S2C event name constants + payload interfaces
│       └── config-defaults.ts
│
├── backend/                 NestJS app
│   └── src/
│       ├── rooms/           RoomService (in-memory state), RoomGateway (WebSocket)
│       ├── game/            GameEngine (phase transitions, timers, live controls)
│       ├── questions/       QuestionBank (filtering by category + difficulty)
│       └── main.ts
│
└── frontend/                Vite + React app
    └── src/
        ├── pages/           Home, RoomPage
        ├── phases/          One component per phase (Reveal, Vote, Pause, Results, …)
        ├── components/      Timer, PlayerList, LiveControls, PhaseStatusBanner, …
        ├── store/           Zustand store (gameStore.ts)
        ├── socket/          socket.io-client setup + event listeners
        └── utils/           Debug logging, player identity helpers
```

---

## Architecture

### Phase State Machine (server-driven)

```
LOBBY → REVEAL → VOTE → PAUSE → RESULTS → BEST_ANSWER → TRANSITION → (repeat or SUMMARY)
```

The server owns all phase transitions and timers. Clients never advance phases locally — they receive a `phase:change` event with `{ phase, endsAt }` and render accordingly. `endsAt` is an epoch timestamp used to drive the countdown UI.

### Room Configuration Model

Settings are split into two layers:

**Structural config** — editable in the lobby, **locks at game start**:
- Question count, categories, difficulty
- Optional phases (Pause, Best Answer)
- Per-phase durations
- Min/max players, late join policy, reconnect grace window

**Live controls** — available to the host **mid-game only**:
- Timer adjust (+/− seconds), pause/resume
- Skip current phase
- Disable optional phases for remaining rounds

### Socket Events

| Direction | Event | Purpose |
|-----------|-------|---------|
| C→S | `room:create` | Create room with optional config overrides |
| C→S | `room:join` | Join by room code |
| C→S | `room:preview` | Check if a room is joinable before joining |
| C→S | `room:rejoin` | Reconnect after disconnect |
| C→S | `room:update-config` | Host edits config (lobby only) |
| C→S | `room:live-control` | Host runtime controls (game only) |
| C→S | `game:start` | Host starts game |
| C→S | `vote:submit` | Submit vote + optional "why" |
| C→S | `best:submit` | Vote for best answer |
| C→S | `chaos:trigger` | Host chaos actions (skip, extend, pause, callout) |
| C→S | `next:skip` | Host skips the transition phase |
| S→C | `phase:change` | Phase transition with full payload |
| S→C | `room:state` | Full room snapshot (on join / reconnect) |
| S→C | `room:config-updated` | Config changed in lobby |
| S→C | `player:joined` / `player:left` | Player roster updates |
| S→C | `results:reveal` | Vote results + highlights |
| S→C | `best:candidates` | Best-answer candidates for the round |
| S→C | `hot_takes:assigned` | Which players are called out in Pause |
| S→C | `summary:show` | End-of-game summary data |
| S→C | `silent:nudge` | Chaos callout target notification |
| S→C | `error` | Error message |

---

## Running Tests

```bash
cd backend && npm test
```

46 tests across 4 suites covering room lifecycle, config validation, host-only guards, game-start locking, phase advancement, auto-timer shortening, live controls, and question bank filtering.

---

## Design Decisions

- **No database** — all state is in-memory. A server restart ends active games. Fine for local play; add Redis if scaling horizontally.
- **No scores** — the game deliberately avoids points or rankings. The goal is conversation and fun.
- **Host owns the room** — only the host can start the game, modify settings, and use live controls. Other players see a read-only lobby.
- **Config snapshot at start** — structural settings freeze at game start. Live controls can only affect timers and phase flow, not the question set or room rules.
- **Shared contract layer** — `@wyr/shared` is a local package imported by both backend and frontend. All event names, payload types, and phase constants live here to prevent drift.
- **Auto-shorten voting** — when every connected player has voted during VOTE or BEST_ANSWER, the timer cuts to 3 seconds and the room is notified, keeping the game moving.
