import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../socket/client';
import Timer from '../components/Timer';
import LiveControls from '../components/LiveControls';
import { C2S, Phase } from '@wyr/shared';

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
    socket.emit(C2S.VOTE_SUBMIT, {
      questionId: question.id,
      optionId: selectedOption,
      why: why.trim(),
    });
    setMyVote({ optionId: selectedOption, why: why.trim() });
  };

  if (myVote) {
    return (
      <>
        <Timer endsAt={endsAt} />
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Vote submitted!</h2>
          <p style={{ color: '#a5a5c0', marginTop: 8 }}>
            Waiting for everyone else...
          </p>
        </div>
        {isHost && <LiveControls currentPhase={Phase.VOTE} />}
      </>
    );
  }

  return (
    <>
      <Timer endsAt={endsAt} />
      <div className="card">
        <h1 style={{ fontSize: '1.25rem', marginBottom: 16, textAlign: 'center' }}>
          {question.text}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.options.map((opt) => (
            <button
              key={opt.id}
              className={selectedOption === opt.id ? 'primary' : 'secondary'}
              onClick={() => setSelectedOption(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <input
            placeholder="Why? (optional but encouraged)"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            maxLength={200}
            style={{ width: '100%' }}
          />
        </div>

        <button
          className="primary"
          style={{ marginTop: 12, width: '100%' }}
          onClick={handleSubmit}
          disabled={!selectedOption}
        >
          Submit Vote
        </button>
      </div>
      {isHost && <LiveControls currentPhase={Phase.VOTE} />}
    </>
  );
}
