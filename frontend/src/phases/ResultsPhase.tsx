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
    <>
      <Timer endsAt={endsAt} />
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: 16 }}>{question.text}</h2>

        {results.distribution.map((opt) => (
          <div key={opt.optionId} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>
                {question.options.find((o) => o.id === opt.optionId)?.label}
              </span>
              <span>{opt.percentage}% ({opt.count})</span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: '#2a2a42',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${opt.percentage}%`,
                  background: '#7c3aed',
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#a5a5c0', marginTop: 2 }}>
              {opt.voterNames.join(', ')}
            </div>
          </div>
        ))}

        {results.highlights.map((h, i) => (
          <div
            key={i}
            style={{
              marginTop: 12,
              padding: 12,
              background: '#2a2a42',
              borderRadius: 8,
              textAlign: 'center',
              fontWeight: 600,
              color: '#c4b5fd',
            }}
          >
            {h.copy}
          </div>
        ))}

        {results.allWhys.filter((v) => v.why.trim()).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: '0.875rem', color: '#a5a5c0', marginBottom: 8 }}>
              What people said
            </h3>
            {results.allWhys
              .filter((v) => v.why.trim())
              .map((v, i) => (
                <div
                  key={i}
                  style={{
                    padding: 8,
                    background: '#1e1e30',
                    borderRadius: 6,
                    marginBottom: 6,
                    fontSize: '0.875rem',
                  }}
                >
                  "{v.why}"
                </div>
              ))}
          </div>
        )}
      </div>
      {isHost && <LiveControls currentPhase={Phase.RESULTS} />}
    </>
  );
}
