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
  const room = useGameStore((s) => s.room);

  const isHotTake = me && hotTakePlayerIds.includes(me.id);
  const hotTakeNames = hotTakePlayerIds
    .map((id) => room?.players.find((p) => p.id === id)?.name)
    .filter(Boolean);

  return (
    <>
      <Timer endsAt={endsAt} />
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', lineHeight: 1.4, marginBottom: 12 }}>
          {question?.text}
        </h1>
        <h2>Think about it...</h2>
        {isHotTake && (
          <div style={{ marginTop: 12, color: '#f59e0b', fontWeight: 700 }}>
            You've been assigned a hot take! Be ready to defend your choice.
          </div>
        )}
        {hotTakeNames.length > 0 && (
          <div style={{ marginTop: 8, fontSize: '0.875rem', color: '#a5a5c0' }}>
            Hot takes from: {hotTakeNames.join(', ')}
          </div>
        )}
      </div>
      {isHost && <LiveControls currentPhase={Phase.PAUSE} />}
    </>
  );
}
