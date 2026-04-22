import { useState, useEffect } from 'react';

export default function Timer({ endsAt }: { endsAt: number }) {
  const [remaining, setRemaining] = useState(0);

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

  return (
    <div className="timer">
      <span className="timer-label">Clock</span>
      <span className="timer-value">{remaining}s</span>
    </div>
  );
}
