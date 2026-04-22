import { useGameStore } from '../store/gameStore';

export default function SummaryPhase() {
  const summary = useGameStore((s) => s.summary);
  const room = useGameStore((s) => s.room);

  if (!summary) {
    return (
      <div className="card centered-card">
        <span className="kicker">Summary</span>
        <h2 className="phase-title">Generating summary...</h2>
      </div>
    );
  }

  return (
    <div className="card phase-card centered-card">
      <span className="kicker">Session wrap</span>
      <h1 className="phase-title" style={{ marginBottom: 16 }}>Game Over!</h1>
      <p className="phase-subtitle" style={{ marginBottom: 16 }}>
        {summary.totalQuestions} questions &middot; {summary.totalPlayers} players
      </p>

      <div className="summary-grid">
        {summary.moments.map((m, i) => (
          <div key={i} className="summary-card">
            <h2>{m.label}</h2>
            <p>{m.description}</p>
            <div className="muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
              {m.playerIds
                .map((id) => room?.players.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join(', ')}
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="primary" onClick={() => window.location.href = '/'}>
          Play Again
        </button>
      </div>
    </div>
  );
}
