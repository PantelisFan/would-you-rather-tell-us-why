import { useGameStore } from '../store/gameStore';
import Timer from '../components/Timer';
import LiveControls from '../components/LiveControls';
import { Phase } from '@wyr/shared';

export default function PausePhase() {
  const endsAt = useGameStore((s) => s.endsAt);
  const question = useGameStore((s) => s.currentQuestion);
  const hotTakePlayerIds = useGameStore((s) => s.hotTakePlayerIds);
  const room = useGameStore((s) => s.room);
  const me = useGameStore((s) => s.me);
  const myVote = useGameStore((s) => s.myVote);
  const isHost = useGameStore((s) => s.isHost);

  const isHotTake = me && hotTakePlayerIds.includes(me.id);
  const selectedLabel = question?.options.find((option) => option.id === myVote?.optionId)?.label;

  const calledOutPlayers = hotTakePlayerIds
    .map((id) => room?.players.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div className="phase-stack">
      <Timer endsAt={endsAt} />
      <div className="card centered-card">
        <span className="kicker">Pause beat</span>
        <h1 className="phase-title">
          {question?.text}
        </h1>
        <p className="phase-subtitle">
          Votes are in. Take a breath before the room sees the split.
        </p>
        {myVote && selectedLabel && (
          <div className="status-banner" style={{ marginTop: 12 }}>
            You picked <strong>{selectedLabel}</strong>.
          </div>
        )}

        {calledOutPlayers.length > 0 && (
          <div className="callout-section">
            <span className="callout-label">Called out to defend their pick</span>
            <div className="callout-list">
              {calledOutPlayers.map((player, i) => (
                <div
                  key={player!.id}
                  className={`callout-chip${player!.id === me?.id ? ' callout-chip--me' : ''}`}
                  style={{ animationDelay: `${i * 0.25}s` }}
                >
                  <span className="callout-icon" aria-hidden>🎤</span>
                  <span className="callout-name">{player!.id === me?.id ? 'You' : player!.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isHotTake && (
          <div className="highlight-card" style={{ marginTop: 12 }}>
            You've been called out! Defend {selectedLabel ? <strong>{selectedLabel}</strong> : 'your choice'}.
          </div>
        )}
      </div>
      {isHost && <LiveControls currentPhase={Phase.PAUSE} />}
    </div>
  );
}
