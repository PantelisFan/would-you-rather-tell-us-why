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
      <div className="landing-shell">
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="kicker">Party room prompt game</span>
            <h1>Would you rather pick fast, or explain yourself beautifully?</h1>
            <h2>Every room becomes a tiny live debate with just enough chaos to stay honest.</h2>
            <p>
              Create a room, pull friends in with one link, and let the server run the beats.
              You bring the hot takes.
            </p>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>Server-driven</strong>
                <span>Phases and timers stay in sync.</span>
              </div>
              <div className="hero-stat">
                <strong>Host-tunable</strong>
                <span>Questions, pacing, difficulty, and room rules.</span>
              </div>
              <div className="hero-stat">
                <strong>One-link join</strong>
                <span>Invite people even after the round has started.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-panel">
          {error && <div className="error-banner">{error}</div>}

          <div className="card panel-card">
            <span className="kicker">Start here</span>
            <h2 className="panel-title">Host a room or slide into one.</h2>
            <p className="panel-subtitle muted">
              Your nickname sticks around for the next round, so you only have to set it once.
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
