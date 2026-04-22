import type { Player } from '@wyr/shared';

export default function PlayerList({ players }: { players: Player[] }) {
  return (
    <div className="player-list">
      {players.map((p) => (
        <span
          key={p.id}
          className={`player-chip${p.isHost ? ' host' : ''}${!p.connected ? ' disconnected' : ''}`}
        >
          <span className="player-chip-name">{p.name}</span>
          <span className="player-chip-meta">
            {p.isHost ? 'host' : !p.connected ? 'away' : 'live'}
          </span>
        </span>
      ))}
    </div>
  );
}
