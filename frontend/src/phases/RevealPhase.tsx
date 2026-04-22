import { useGameStore } from '../store/gameStore';
import Timer from '../components/Timer';

export default function RevealPhase() {
  const question = useGameStore((s) => s.currentQuestion);
  const endsAt = useGameStore((s) => s.endsAt);
  const room = useGameStore((s) => s.room);

  return (
    <div className="phase-stack">
      <Timer endsAt={endsAt} />
      <div className="status-banner">
        Question {room?.currentQuestionIndex ?? '?'} of {room?.totalQuestions ?? '?'}
      </div>
      <div className="card centered-card">
        <span className="kicker">Reveal</span>
        <h1 className="phase-title">
          {question?.text ?? 'Loading question...'}
        </h1>
      </div>
    </div>
  );
}
