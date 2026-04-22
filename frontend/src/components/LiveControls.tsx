import { socket } from '../socket/client';
import { C2S, OPTIONAL_PHASES, type Phase } from '@wyr/shared';
import { clientLog } from '../utils/debug';

interface Props {
  currentPhase: Phase;
}

export default function LiveControls({ currentPhase }: Props) {
  const send = (controls: Record<string, any>) => {
    clientLog('info', 'actions', 'Sending live control', { currentPhase, controls });
    socket.emit(C2S.ROOM_LIVE_CONTROL, { controls });
  };

  const triggerChaos = (type: string) => {
    clientLog('warn', 'actions', 'Triggering chaos action', { currentPhase, type });
    socket.emit(C2S.CHAOS_TRIGGER, { type });
  };

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h2>Host Controls</h2>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button className="secondary" onClick={() => send({ timerAdjustSec: 15 })}>
          +15s
        </button>
        <button className="secondary" onClick={() => send({ timerAdjustSec: -10 })}>
          −10s
        </button>
        <button className="secondary" onClick={() => send({ paused: true })}>
          Pause
        </button>
        <button className="secondary" onClick={() => send({ paused: false })}>
          Resume
        </button>
        <button className="danger" onClick={() => send({ skipCurrentPhase: true })}>
          Skip Phase
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: '0.875rem', color: '#a5a5c0', marginBottom: 8 }}>
          Disable Upcoming Phases
        </h3>
        {OPTIONAL_PHASES.map((phase) => (
          <button
            key={phase}
            className="secondary"
            style={{ marginRight: 8, marginBottom: 4 }}
            onClick={() => send({ disabledUpcomingPhases: [phase] })}
          >
            Disable {phase}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: '0.875rem', color: '#a5a5c0', marginBottom: 8 }}>
          Chaos
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="secondary" onClick={() => triggerChaos('extend')}>
            Chaos +15s
          </button>
          <button className="secondary" onClick={() => triggerChaos('skip')}>
            Chaos Skip
          </button>
          <button className="secondary" onClick={() => triggerChaos('callout')}>
            Call Someone Out
          </button>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#a5a5c0', marginTop: 8 }}>
          Current phase: {currentPhase}
        </div>
      </div>
    </div>
  );
}
