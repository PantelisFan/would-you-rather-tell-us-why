import { useState, useEffect } from 'react';

export default function Timer({ endsAt }: { endsAt: number }) {
  const [remaining, setRemaining] = useState(0);
  const [initialRemaining, setInitialRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) {
      setInitialRemaining(0);
      return;
    }
    setInitialRemaining(Math.max(1, Math.ceil((endsAt - Date.now()) / 1000)));
  }, [endsAt]);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const r = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(r);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return null;

  const total = Math.max(initialRemaining, 1);
  const progress = Math.max(0, Math.min(1, remaining / total));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  const urgency = remaining <= 5 ? 'critical' : remaining <= 10 ? 'warning' : 'calm';
  const hint = remaining <= 5 ? 'Wrap it up' : remaining <= 10 ? 'Final seconds' : 'Time left';

  return (
    <div className={`timer timer-${urgency}`} aria-label={`${remaining} seconds remaining`}>
      <div className="timer-ring">
        <svg className="timer-svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="timer-track" cx="50" cy="50" r={radius} />
          <circle
            className="timer-progress"
            cx="50"
            cy="50"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="timer-center">
          <span className="timer-digits">{minutes}:{seconds}</span>
          <span className="timer-hint">{hint}</span>
        </div>
      </div>
    </div>
  );
}
