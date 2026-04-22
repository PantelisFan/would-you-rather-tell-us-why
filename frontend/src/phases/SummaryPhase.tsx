import { useGameStore } from '../store/gameStore';

export default function SummaryPhase() {
  const summary = useGameStore((s) => s.summary);
  const room = useGameStore((s) => s.room);

  if (!summary) return <div className="card"><h2>Generating summary...</h2></div>;

  return (
    <div className="card">
      <h1 style={{ textAlign: 'center', marginBottom: 16 }}>Game Over!</h1>
      <p style={{ textAlign: 'center', color: '#a5a5c0', marginBottom: 16 }}>
        {summary.totalQuestions} questions &middot; {summary.totalPlayers} players
      </p>

      {summary.moments.map((m, i) => (
        <div
          key={i}
          style={{
            padding: 16,
            background: '#2a2a42',
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <h2 style={{ color: '#c4b5fd', marginBottom: 4 }}>{m.label}</h2>
          <p>{m.description}</p>
          <div style={{ fontSize: '0.8rem', color: '#a5a5c0', marginTop: 4 }}>
            {m.playerIds
              .map((id) => room?.players.find((p) => p.id === id)?.name)
              .filter(Boolean)
              .join(', ')}
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="primary" onClick={() => window.location.href = '/'}>
          Play Again
        </button>
      </div>
    </div>
  );
}
