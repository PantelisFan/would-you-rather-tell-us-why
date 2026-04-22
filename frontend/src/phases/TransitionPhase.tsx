import { useGameStore } from '../store/gameStore';
import { socket } from '../socket/client';
import Timer from '../components/Timer';
import { C2S } from '@wyr/shared';

export default function TransitionPhase() {
  const endsAt = useGameStore((s) => s.endsAt);
  const room = useGameStore((s) => s.room);
  const isHost = useGameStore((s) => s.isHost);

  const handleSkip = () => {
    socket.emit(C2S.NEXT_SKIP);
  };

  return (
    <div className="phase-stack">
      <Timer endsAt={endsAt} />
      <div className="card centered-card">
        <span className="kicker">Transition</span>
        <h2 className="phase-title">Next question coming up...</h2>
        <p className="phase-subtitle" style={{ marginTop: 8 }}>
          Question {(room?.currentQuestionIndex ?? 0)} of {room?.totalQuestions ?? '?'}
        </p>
        {isHost && (
          <button className="secondary" style={{ marginTop: 12 }} onClick={handleSkip}>
            Skip →
          </button>
        )}
      </div>
    </div>
  );
}
