import { useGameStore } from '../store/gameStore';
import Timer from '../components/Timer';
import LiveControls from '../components/LiveControls';
import { Phase } from '@wyr/shared';

export default function ResultsPhase() {
  const endsAt = useGameStore((s) => s.endsAt);
  const results = useGameStore((s) => s.results);
  const question = useGameStore((s) => s.currentQuestion);
  const isHost = useGameStore((s) => s.isHost);

  if (!results || !question) return null;

  return (
    <div className="phase-stack">
      <Timer endsAt={endsAt} />
      <div className="card phase-card">
        <span className="kicker">Results</span>
        <h2 className="phase-title" style={{ textAlign: 'center', marginBottom: 16 }}>{question.text}</h2>

        <div className="results-stack">
          {results.distribution.map((opt) => (
            <div key={opt.optionId} className="result-row">
              <div className="result-head">
                <span style={{ fontWeight: 600 }}>
                {question.options.find((o) => o.id === opt.optionId)?.label}
                </span>
                <span>{opt.percentage}% ({opt.count})</span>
              </div>
              <div className="result-track">
                <div
                  className="result-fill"
                  style={{ width: `${opt.percentage}%` }}
                />
              </div>
              <div className="muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
                {opt.voterNames.join(', ')}
              </div>
            </div>
          ))}
        </div>

        {results.highlights.map((h, i) => (
          <div key={i} className="highlight-card" style={{ marginTop: 12 }}>
            {h.copy}
          </div>
        ))}

        {results.allWhys.filter((v) => v.why.trim()).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3 className="muted" style={{ marginBottom: 8 }}>
              What people said
            </h3>
            <div className="quote-list">
              {results.allWhys
                .filter((v) => v.why.trim())
                .map((v, i) => (
                  <div key={i} className="quote-card">
                    "{v.why}"
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
      {isHost && <LiveControls currentPhase={Phase.RESULTS} />}
    </div>
  );
}
