import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../socket/client';
import Timer from '../components/Timer';
import LiveControls from '../components/LiveControls';
import { C2S, Phase } from '@wyr/shared';
import { clientLog } from '../utils/debug';

export default function BestAnswerPhase() {
  const endsAt = useGameStore((s) => s.endsAt);
  const candidates = useGameStore((s) => s.bestCandidates);
  const question = useGameStore((s) => s.currentQuestion);
  const room = useGameStore((s) => s.room);
  const isHost = useGameStore((s) => s.isHost);
  const [voted, setVoted] = useState(false);

  if (!question) return null;

  const handleVote = (targetPlayerId: string) => {
    clientLog('info', 'actions', 'Submitting best-answer vote', {
      questionId: question.id,
      targetPlayerId,
    });
    socket.emit(C2S.BEST_SUBMIT, {
      questionId: question.id,
      targetPlayerId,
    });
    setVoted(true);
  };

  return (
    <>
      <Timer endsAt={endsAt} />
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: 16 }}>
          Best answer?
        </h2>

        {voted ? (
          <p style={{ textAlign: 'center', color: '#a5a5c0' }}>
            Vote recorded! Waiting for others...
          </p>
        ) : (
          candidates.map((c) => {
            const name = room?.players.find((p) => p.id === c.playerId)?.name ?? 'Someone';
            return (
              <button
                key={c.playerId}
                className="secondary"
                style={{ width: '100%', marginBottom: 8, textAlign: 'left' }}
                onClick={() => handleVote(c.playerId)}
              >
                <strong>{name}:</strong> "{c.why}"
              </button>
            );
          })
        )}
      </div>
      {isHost && <LiveControls currentPhase={Phase.BEST_ANSWER} />}
    </>
  );
}
