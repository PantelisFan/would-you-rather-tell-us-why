# Would You Rather — Tell Us Why

A real-time multiplayer "Would You Rather" party game where everyone explains *why*. Built with NestJS + Socket.IO (backend), React + Zustand (frontend), and a shared TypeScript contract layer.

## Quick Start

```bash
# 1. Install all dependencies
cd shared && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Run backend (port 3001)
cd backend && npm run start:dev

# 3. Run frontend (port 5173, proxies socket to backend)
cd frontend && npm run dev

OR start concurrently both services from root
-> npm run dev
```

Open `http://localhost:5173` in two browser tabs to test.

## Project Structure

```
shared/          @wyr/shared — TypeScript types, events, phases, config, validation
backend/         NestJS app — RoomService, RoomGateway, GameEngine, QuestionBank
frontend/        Vite + React — pages, phase components, Zustand store, socket client
```

## Architecture

### Phase State Machine (server-driven)

```
LOBBY → REVEAL → PAUSE → VOTE → RESULTS → BEST_ANSWER → STORY → TRANSITION → (next question or SUMMARY)
```

The server owns all phase transitions and timers. The client renders the current phase and uses `endsAt` (epoch ms) for countdown display, it never advances phases locally.

### Room Configuration Model

Room settings are split into two layers:

**Structural config** — set at room creation, editable in the lobby, **locks at game start**:
- Question count, categories, difficulty levels
- Enabled optional phases (Pause, Best Answer, Story)
- Min/max players, late join policy, reconnect grace window
- Per-phase durations, profanity filter

**Live controls** — available to the host **during gameplay**:
- Timer adjust (+/−seconds), pause/resume
- Skip current phase
- Disable upcoming optional phases

### Socket Events

| Direction | Event | Purpose |
|-----------|-------|---------|
| C→S | `room:create` | Create room with optional config overrides |
| C→S | `room:join` | Join by room code |
| C→S | `room:rejoin` | Reconnect after disconnect |
| C→S | `room:update-config` | Host edits config (lobby only) |
| C→S | `room:live-control` | Host runtime controls (game only) |
| C→S | `game:start` | Host starts game |
| C→S | `vote:submit` | Submit vote + "why" |
| C→S | `best:submit` | Vote for best answer |
| C→S | `story:submit` | Share a story |
| C→S | `next:skip` | Host skips transition |
| S→C | `phase:change` | Phase transition + payload |
| S→C | `room:config-updated` | Config changed in lobby |
| S→C | `player:joined` / `player:left` | Player updates |
| S→C | `results:reveal` | Vote results + highlights |
| S→C | `error` | Error messages |

## Running Tests

```bash
cd backend && npx jest --verbose
```

34 tests covering room creation, config validation, host-only guards, game-start lock, live control validation, and question bank filtering.

## Design Decisions

- **No database** — all state is in-memory. A server restart ends active games. Fine for MVP; add Redis when scaling horizontally.
- **No scores** — the game deliberately avoids scoring.
- **Host controls everything** — only the host can start the game, change settings, and use live controls. Other players see read-only settings in the lobby.
- **Config snapshot at start** — structural settings are frozen when the game begins. Live controls can only affect timers and phase flow, preventing mid-game destabilization.
