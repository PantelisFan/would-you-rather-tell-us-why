import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../socket/client';
import Timer from '../components/Timer';
import LiveControls from '../components/LiveControls';
import { C2S, Phase } from '@wyr/shared';
import { clientLog } from '../utils/debug';

export default function VotePhase() {
  const endsAt = useGameStore((s) => s.endsAt);
  const question = useGameStore((s) => s.currentQuestion);
  const myVote = useGameStore((s) => s.myVote);
  const isHost = useGameStore((s) => s.isHost);
  const setMyVote = useGameStore((s) => s.setMyVote);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [why, setWhy] = useState('');

  if (!question) return null;

  const handleSubmit = () => {
    if (!selectedOption) return;
    clientLog('info', 'actions', 'Submitting vote', {
      questionId: question.id,
      optionId: selectedOption,
      whyLength: why.trim().length,
    });
    socket.emit(C2S.VOTE_SUBMIT, {
      questionId: question.id,
      optionId: selectedOption,
      why: why.trim(),
    });
    setMyVote({ optionId: selectedOption, why: why.trim() });
  };

  if (myVote) {
    return (
      <div className="phase-stack">
        <Timer endsAt={endsAt} />
        <div className="card centered-card">
          <span className="kicker">Locked in</span>
          <h2 className="phase-title">Vote submitted!</h2>
          <p className="phase-subtitle">
            Waiting for everyone else...
          </p>
        </div>
        {isHost && <LiveControls currentPhase={Phase.VOTE} />}
      </div>
    );
  }

  return (
    <div className="phase-stack">
      <Timer endsAt={endsAt} />
      <div className="card phase-card">
        <span className="kicker">Vote</span>
        <h1 className="phase-title" style={{ marginBottom: 16, textAlign: 'center' }}>
          {question.text}
        </h1>

        <div className="options-stack">
          {question.options.map((opt) => (
            <button
              key={opt.id}
              className={`${selectedOption === opt.id ? 'primary' : 'secondary'} option-button`}
              onClick={() => setSelectedOption(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="question-note">
          <input
            placeholder="Why? (optional but encouraged)"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            maxLength={200}
          />
        </div>

        <button
          className="primary full-width-button"
          style={{ marginTop: 12 }}
          onClick={handleSubmit}
          disabled={!selectedOption}
        >
          Submit Vote
        </button>
      </div>
      {isHost && <LiveControls currentPhase={Phase.VOTE} />}
    </div>
  );
}
