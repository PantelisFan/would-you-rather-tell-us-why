import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket/client';
import { hydrateRoomState, setupListeners, teardownListeners } from '../socket/listeners';
import { useGameStore } from '../store/gameStore';
import { C2S } from '@wyr/shared';
import { clientLog } from '../utils/debug';
import { getStoredPlayerName, saveStoredPlayerName } from '../utils/playerIdentity';

export default function Home() {
  const [name, setName] = useState(() => getStoredPlayerName());
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'pick' | 'create' | 'join'>('pick');
  const navigate = useNavigate();
  const error = useGameStore((s) => s.error);

  useEffect(() => {
    setupListeners();
    clientLog('debug', 'actions', 'Connecting socket from home page');
    socket.connect();
    return () => {
      teardownListeners();
    };
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return;
    saveStoredPlayerName(name);
    clientLog('info', 'actions', 'Creating room', { hostName: name.trim() });
    socket.emit(C2S.ROOM_CREATE, { hostName: name.trim() }, (res: any) => {
      if (res?.room) {
        clientLog('info', 'actions', 'Create room acknowledged', {
          roomCode: res.room.code,
          playerId: res.playerId,
        });
        hydrateRoomState(res);
        navigate(`/room/${res.room.code}`);
      }
    });
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    saveStoredPlayerName(name);
    clientLog('info', 'actions', 'Joining room from home page', {
      roomCode: joinCode.trim().toUpperCase(),
      name: name.trim(),
    });
    socket.emit(
      C2S.ROOM_JOIN,
      { code: joinCode.trim().toUpperCase(), name: name.trim() },
      (res: any) => {
        if (res?.room) {
          clientLog('info', 'actions', 'Join room acknowledged', {
            roomCode: res.room.code,
            playerId: res.playerId,
          });
          hydrateRoomState(res);
          navigate(`/room/${res.room.code}`);
        }
      },
    );
  };

  return (
    <div className="page landing-page">
      <div className="landing-shell home-shell">
        <section className="landing-hero home-hero">
          <div className="landing-copy home-copy">
            <span className="kicker">Would you rather... tell us why?</span>
            <h1>Pick a side. Then explain yourself.</h1>
            <h2>Create a room or join one with a code.</h2>
            <p>
              Same question, same room, very different reasoning.
            </p>

            <div className="home-steps">
              <div className="home-step">
                <span className="home-step-number">01</span>
                <div>
                  <strong>Choose</strong>
                  <span>Everyone answers the same prompt.</span>
                </div>
              </div>
              <div className="home-step">
                <span className="home-step-number">02</span>
                <div>
                  <strong>Explain</strong>
                  <span>Add a reason if you want. The good answers usually do.</span>
                </div>
              </div>
              <div className="home-step">
                <span className="home-step-number">03</span>
                <div>
                  <strong>Compare</strong>
                  <span>See how the room split and which answer stuck.</span>
                </div>
              </div>
            </div>

            <div className="home-note">Nicknames stay saved on this device for the next room.</div>
          </div>
        </section>

        <section className="landing-panel">
          {error && <div className="error-banner">{error}</div>}

          <div className="card panel-card">
            <span className="kicker">Get in</span>
            <h2 className="panel-title">Start a room or join one.</h2>
            <p className="panel-subtitle muted">
              Set a nickname once and come back to it next time.
            </p>

            {mode === 'pick' && (
              <div className="mode-switch">
                <button className="primary" onClick={() => setMode('create')}>
                  Create Room
                </button>
                <button className="secondary" onClick={() => setMode('join')}>
                  Join Room
                </button>
              </div>
            )}

            {mode === 'create' && (
              <div className="form-stack">
                <input
                  placeholder="Your nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                />
                <button className="primary full-width-button" onClick={handleCreate}>
                  Open Room
                </button>
                <button className="secondary full-width-button" onClick={() => setMode('pick')}>
                  Back
                </button>
              </div>
            )}

            {mode === 'join' && (
              <div className="form-stack">
                <input
                  placeholder="Your nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                />
                <input
                  placeholder="Room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={4}
                />
                <button className="primary full-width-button" onClick={handleJoin}>
                  Join Room
                </button>
                <button className="secondary full-width-button" onClick={() => setMode('pick')}>
                  Back
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
