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
    <div className="page">
      <h1>Would You Rather</h1>
      <h2>...tell us why?</h2>

      {error && <div style={{ color: '#f87171' }}>{error}</div>}

      {mode === 'pick' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="primary" onClick={() => setMode('create')}>
            Create Room
          </button>
          <button className="secondary" onClick={() => setMode('join')}>
            Join Room
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
          <button className="primary" onClick={handleCreate}>
            Create
          </button>
          <button className="secondary" onClick={() => setMode('pick')}>
            Back
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Your name"
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
          <button className="primary" onClick={handleJoin}>
            Join
          </button>
          <button className="secondary" onClick={() => setMode('pick')}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
