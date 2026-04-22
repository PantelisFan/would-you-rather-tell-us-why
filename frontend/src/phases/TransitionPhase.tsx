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
    <>
      <Timer endsAt={endsAt} />
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Next question coming up...</h2>
        <p style={{ color: '#a5a5c0', marginTop: 8 }}>
          Question {(room?.currentQuestionIndex ?? 0)} of {room?.totalQuestions ?? '?'}
        </p>
        {isHost && (
          <button className="secondary" style={{ marginTop: 12 }} onClick={handleSkip}>
            Skip →
          </button>
        )}
      </div>
    </>
  );
}
