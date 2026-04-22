import { useGameStore } from '../store/gameStore';
import { socket } from '../socket/client';
import { C2S } from '@wyr/shared';
import PlayerList from '../components/PlayerList';
import SettingsPanel from '../components/SettingsPanel';

export default function LobbyPhase() {
  const room = useGameStore((s) => s.room);
  const isHost = useGameStore((s) => s.isHost);

  if (!room) return <div>Loading...</div>;

  const handleConfigChange = (patch: any) => {
    socket.emit(C2S.ROOM_UPDATE_CONFIG, { config: patch });
  };

  const handleStart = () => {
    socket.emit(C2S.GAME_START);
  };

  return (
    <>
      <h1>Room {room.code}</h1>
      <h2>
        {room.players.length} player{room.players.length !== 1 ? 's' : ''} in lobby
      </h2>

      <PlayerList players={room.players} />

      <SettingsPanel
        config={room.config}
        disabled={!isHost}
        onChange={handleConfigChange}
      />

      {isHost ? (
        <button
          className="primary"
          onClick={handleStart}
          disabled={room.players.filter((p) => p.connected).length < room.config.minPlayers}
        >
          Start Game
        </button>
      ) : (
        <h2>Waiting for host to start...</h2>
      )}

      {!isHost && (
        <div style={{ fontSize: '0.8rem', color: '#a5a5c0' }}>
          Share code: <strong>{room.code}</strong>
        </div>
      )}
    </>
  );
}
