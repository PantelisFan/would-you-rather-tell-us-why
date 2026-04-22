import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket/client';
import { hydrateRoomState, setupListeners, teardownListeners } from '../socket/listeners';
import { useGameStore } from '../store/gameStore';
import { C2S } from '@wyr/shared';

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const error = useGameStore((s) => s.error);

  useEffect(() => {
    setupListeners();
    socket.connect();
    return () => teardownListeners();
  }, []);

  const handleJoin = () => {
    if (!name.trim() || !code) return;
    socket.emit(
      C2S.ROOM_JOIN,
      { code: code.toUpperCase(), name: name.trim() },
      (res: any) => {
        if (res?.room) {
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
