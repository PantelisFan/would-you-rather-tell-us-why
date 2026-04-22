import { useGameStore } from '../store/gameStore';
import Timer from '../components/Timer';
import LiveControls from '../components/LiveControls';
import { Phase } from '@wyr/shared';

export default function PausePhase() {
  const endsAt = useGameStore((s) => s.endsAt);
  const question = useGameStore((s) => s.currentQuestion);
  const hotTakePlayerIds = useGameStore((s) => s.hotTakePlayerIds);
  const me = useGameStore((s) => s.me);
  const isHost = useGameStore((s) => s.isHost);

  const isHotTake = me && hotTakePlayerIds.includes(me.id);

  return (
    <div className="phase-stack">
      <Timer endsAt={endsAt} />
      <div className="card centered-card">
        <span className="kicker">Pause beat</span>
        <h1 className="phase-title">
          {question?.text}
        </h1>
        <p className="phase-subtitle">Think about it before anyone has to commit.</p>
        {isHotTake && (
          <div className="highlight-card" style={{ marginTop: 12 }}>
            You've been assigned a hot take! Be ready to defend your choice.
          </div>
        )}
      </div>
      {isHost && <LiveControls currentPhase={Phase.PAUSE} />}
    </div>
  );
}
