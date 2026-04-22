import { useGameStore } from '../store/gameStore';
import { socket } from '../socket/client';
import { C2S } from '@wyr/shared';
import PlayerList from '../components/PlayerList';
import SettingsPanel from '../components/SettingsPanel';
import { clientLog } from '../utils/debug';

export default function LobbyPhase() {
  const room = useGameStore((s) => s.room);
  const isHost = useGameStore((s) => s.isHost);

  if (!room) return <div>Loading...</div>;

  const handleConfigChange = (patch: any) => {
    clientLog('info', 'actions', 'Updating room config from lobby', {
      roomCode: room.code,
      changedKeys: Object.keys(patch),
    });
    socket.emit(C2S.ROOM_UPDATE_CONFIG, { config: patch });
  };

  const handleStart = () => {
    clientLog('info', 'actions', 'Starting game from lobby', {
      roomCode: room.code,
      playerCount: room.players.length,
    });
    socket.emit(C2S.GAME_START);
  };

  return (
    <div className="phase-stack">
      <div className="card room-overview">
        <div className="room-heading">
          <div className="room-title-block">
            <span className="room-code-pill">Room {room.code}</span>
            <h1 className="phase-title">Lobby is open.</h1>
            <p className="phase-subtitle">
              {room.players.length} player{room.players.length !== 1 ? 's' : ''} in the room.
            </p>
          </div>

          {!isHost && <div className="room-code-note">Waiting for the host to start the game.</div>}
        </div>

        <div className="section-card">
          <div className="section-header">
            <h3>Players</h3>
          </div>
          <PlayerList players={room.players} />
        </div>
      </div>

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
        <div className="status-banner">The host is tuning the room and will launch the first question soon.</div>
      )}
    </div>
  );
}
