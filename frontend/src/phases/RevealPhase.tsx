import { useGameStore } from '../store/gameStore';
import Timer from '../components/Timer';

export default function RevealPhase() {
  const question = useGameStore((s) => s.currentQuestion);
  const endsAt = useGameStore((s) => s.endsAt);
  const room = useGameStore((s) => s.room);

  return (
    <>
      <Timer endsAt={endsAt} />
      <h2>
        Question {room?.currentQuestionIndex ?? '?'} of {room?.totalQuestions ?? '?'}
      </h2>
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', lineHeight: 1.4 }}>
          {question?.text ?? 'Loading question...'}
        </h1>
      </div>
    </>
  );
}
