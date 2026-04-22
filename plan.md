Great — that simplifies things a lot. Here's your implementation plan.

# Implementation Plan

## Stack overview

**Backend (`/backend`)** — NestJS with `@nestjs/websockets` + `socket.io` adapter. In-memory state via a `RoomService` singleton. No DB, no auth — players identified by socket ID + a display name they pick on join.

**Frontend (`/frontend`)** — Vite + React. Zustand for client state (room, phase, self identity). `socket.io-client` for the WS connection. React Router for `/` (home), `/join/:code`, `/room/:code`.

**Shared (`/shared`)** — TypeScript types for events and payloads, imported by both sides via a path alias or a small local package. This is the single most important thing to set up first; skip it and you'll drift.

---

## Project structure

```
project/
├── shared/
│   └── src/
│       ├── events.ts          // event name constants
│       ├── phases.ts          // phase state machine
│       └── types.ts           // Room, Player, Question, Vote, etc.
├── backend/
│   ├── src/
│   │   ├── rooms/             // RoomService, RoomGateway, room.types
│   │   ├── game/              // GameEngine (phase transitions, timers)
│   │   ├── questions/         // question bank + picker
│   │   └── main.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/             // Home, Join, Room
    │   ├── phases/            // one component per phase (Reveal, Pause, Vote, Results, BestAnswer, Story, Transition)
    │   ├── components/        // shared UI (Timer, PlayerList, ChaosButton)
    │   ├── store/             // zustand store
    │   ├── socket/            // socket client + typed hooks
    │   └── App.tsx
    └── package.json
```

---

## The phase state machine

This is the backbone. Every phase transition is server-driven — the client only reacts. Define it once in `shared/phases.ts`:

`LOBBY → REVEAL → PAUSE → VOTE → RESULTS → BEST_ANSWER → STORY → TRANSITION → (next question or SUMMARY)`

The server owns the clock. Each phase has a duration, and the server emits `phase:change` with `{ phase, endsAt, payload }`. The client renders whatever component matches the current phase and uses `endsAt` to drive its countdown UI — never trust the client to advance phases.

Phase durations (tune later):
- REVEAL: 3s (just shows the question dramatically)
- PAUSE: 25s (the forced wait; "hot takes" assigned here)
- VOTE: 30s (tap option + 1-line "why")
- RESULTS: 15s (distribution + highlight callouts)
- BEST_ANSWER: 20s (vote on 3-4 surfaced "why"s)
- STORY: 30s (1-2 players prompted to elaborate)
- TRANSITION: 5s hard cut with skip button

---

## WebSocket event contract

Keep events flat and namespaced. Define them as constants in `shared/events.ts` so typos don't cost you an afternoon.

**Client → Server**
- `room:create` → `{ hostName }` → returns `{ code, playerId }`
- `room:join` → `{ code, name }` → returns `{ playerId, room }`
- `room:leave`
- `game:start` (host only)
- `vote:submit` → `{ questionId, optionId, why }`
- `best:submit` → `{ questionId, targetPlayerId, category }`
- `story:submit` → `{ questionId, text }`
- `chaos:trigger` (host only) → `{ type }`
- `next:skip` (host only, during TRANSITION)

**Server → Client**
- `room:state` (full snapshot on join/reconnect)
- `player:joined` / `player:left`
- `phase:change` → `{ phase, endsAt, payload }`
- `hot_takes:assigned` → `{ playerIds: string[] }` (during PAUSE)
- `results:reveal` → `{ distribution, highlights, allWhys }`
- `best:candidates` → `{ candidates: Why[] }` (3-4 surfaced)
- `story:prompt` → `{ playerIds, prompt }`
- `silent:nudge` → `{ playerId }`
- `summary:show` → aggregated session highlights
- `error` → `{ code, message }`

---

## Backend: the critical services

**`RoomService`** — `Map<code, Room>`. Handles create, join, leave, and socket-to-player mapping. Generate 4-letter codes, collision-check against the map. On socket disconnect, mark player `connected: false` but keep them for ~60s so they can reconnect without losing their spot.

**`GameEngine`** — one instance per room. Holds current phase, current question, votes, whys, best-answer votes, stories. Exposes `advance()` which transitions to the next phase and schedules the next `advance()` via `setTimeout`. Store the timer handle so `chaos:trigger` and `next:skip` can cancel and reschedule.

**`QuestionBank`** — start with a hardcoded JSON array of ~50 questions. Each has `{ id, text, options: [{id, label}] }`. Pick randomly, don't repeat within a session.

**`RoomGateway`** — the `@WebSocketGateway()`. Thin layer: validates payloads, calls into services, broadcasts results. Use Nest's `class-validator` DTOs on every incoming event.

**Highlight detection** (the thing that makes step 4 not boring) — after VOTE ends, compute:
- `minority`: any option with ≤20% of votes when >4 players
- `split`: top two options within 15% of each other
- `unanimous`: one option got everyone (rare, worth calling out)

Pick the most interesting one and send it as `highlights.type` + `highlights.copy`. The copy lives server-side so you can tune tone without a frontend deploy.

---

## Frontend: phase-driven rendering

Your `Room` page is essentially a switch on `phase`:

```
{phase === 'REVEAL' && <RevealPhase question={...} />}
{phase === 'PAUSE' && <PausePhase endsAt={...} hotTakes={...} />}
{phase === 'VOTE' && <VotePhase question={...} endsAt={...} />}
// etc.
```

Each phase component is self-contained and handles its own UI and input. The `Timer` component takes `endsAt` and ticks locally — no server roundtrip per second.

**Zustand store shape:**
```
{ me: Player, room: Room, phase: Phase, endsAt: number,
  currentQuestion, myVote, results, bestCandidates, storyPrompt,
  hotTakePlayerIds, summary }
```

Wire socket events directly to store setters in one place (`socket/listeners.ts`) and keep components pure.

**Reconnect handling** — on connect, if you have a `playerId` in sessionStorage, emit `room:rejoin` with it. Server looks up the disconnected player and re-associates the new socket. Crucial for mobile users whose connection flaps.

---

## Build order (do it in this sequence)

1. **Shared types + events.** Get the contract right before writing either side.
2. **Backend skeleton**: NestJS app, gateway, `RoomService` with create/join only. Test with two browser tabs.
3. **Frontend skeleton**: home page, create/join flow, lobby that shows connected players live.
4. **GameEngine with just REVEAL → VOTE → RESULTS.** No pause, no best-answer, no story. Get the loop working end-to-end with dumb UI.
5. **Add PAUSE phase + hot-take assignment.** Tune timing.
6. **Add BEST_ANSWER phase + candidate surfacing.**
7. **Add STORY phase + silent-player detection.**
8. **Add TRANSITION + skip button.**
9. **Summary screen** — grouped by "moments" not data, per your spec.
10. **Chaos button + call-someone-out.** These are polish; don't let them block the core loop.

---

## Things worth flagging now

- **Don't persist to disk.** In-memory means a server restart nukes active games — that's fine for MVP, but run a single instance. The moment you scale horizontally you'll need Redis for the socket.io adapter and shared room state.
- **Validate every inbound event.** Malicious or buggy clients will send garbage; Nest's `ValidationPipe` on WS messages is your friend.
- **Rate-limit `vote:submit` and `best:submit`** per socket. One player spamming breaks the fun.
- **Don't over-engineer the question bank.** A JSON file beats a CMS for MVP. Move it to a DB only when you have enough questions that editing JSON hurts.
- **The "avoid" list in your spec is load-bearing.** Every feature request you get post-MVP should be checked against it — especially "can we add scores?" No, you cannot.

Want me to scaffold the shared types file and the event contract as actual code so you can drop it in and start building?