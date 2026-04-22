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

  return (
    <div className="card host-controls" style={{ marginTop: 12 }}>
      <h2>Host Controls</h2>

      <div className="host-controls-grid" style={{ marginTop: 12 }}>
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
        <h3 className="muted" style={{ marginBottom: 8 }}>
          Disable Upcoming Phases
        </h3>
        <div className="host-controls-grid">
          {OPTIONAL_PHASES.map((phase) => (
          <button
            key={phase}
            className="secondary"
            onClick={() => send({ disabledUpcomingPhases: [phase] })}
          >
            Disable {phase}
          </button>
          ))}
        </div>
      </div>
    </div>
  );
}
