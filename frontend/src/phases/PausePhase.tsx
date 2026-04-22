import { useGameStore } from '../store/gameStore';
import Timer from '../components/Timer';
import LiveControls from '../components/LiveControls';
import { Phase } from '@wyr/shared';

export default function PausePhase() {
  const endsAt = useGameStore((s) => s.endsAt);
  const question = useGameStore((s) => s.currentQuestion);
  const hotTakePlayerIds = useGameStore((s) => s.hotTakePlayerIds);
  const me = useGameStore((s) => s.me);
  const myVote = useGameStore((s) => s.myVote);
  const isHost = useGameStore((s) => s.isHost);

  const isHotTake = me && hotTakePlayerIds.includes(me.id);
  const selectedLabel = question?.options.find((option) => option.id === myVote?.optionId)?.label;

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
        {isHotTake && (
          <div className="highlight-card" style={{ marginTop: 12 }}>
            You've been called out. Be ready to defend {selectedLabel ? <strong>{selectedLabel}</strong> : 'your choice'}.
          </div>
        )}
      </div>
      {isHost && <LiveControls currentPhase={Phase.PAUSE} />}
    </div>
  );
}
