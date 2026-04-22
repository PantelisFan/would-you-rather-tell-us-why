import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket/client';
import { hydrateRoomState, setupListeners, teardownListeners } from '../socket/listeners';
import { useGameStore } from '../store/gameStore';
import { C2S } from '@wyr/shared';
import { clientLog } from '../utils/debug';

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const error = useGameStore((s) => s.error);

  useEffect(() => {
    setupListeners();
    clientLog('debug', 'actions', 'Connecting socket from join page', { code });
    socket.connect();
    return () => teardownListeners();
  }, []);

  const handleJoin = () => {
    if (!name.trim() || !code) return;
    clientLog('info', 'actions', 'Joining room from join page', {
      roomCode: code.toUpperCase(),
      name: name.trim(),
    });
    socket.emit(
      C2S.ROOM_JOIN,
      { code: code.toUpperCase(), name: name.trim() },
      (res: any) => {
        if (res?.room) {
          clientLog('info', 'actions', 'Join page acknowledged room state', {
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
      <h1>Join Room {code}</h1>
      {error && <div style={{ color: '#f87171' }}>{error}</div>}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />
        <button className="primary" onClick={handleJoin}>
          Join
        </button>
      </div>
    </div>
  );
}
