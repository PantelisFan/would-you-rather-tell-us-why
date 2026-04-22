import type { Player } from '@wyr/shared';

export default function PlayerList({ players }: { players: Player[] }) {
  return (
    <div className="player-list">
      {players.map((p) => (
        <span
          key={p.id}
          className={`player-chip${p.isHost ? ' host' : ''}${!p.connected ? ' disconnected' : ''}`}
        >
          {p.name}
          {p.isHost && ' (host)'}
          {!p.connected && ' (away)'}
        </span>
      ))}
    </div>
  );
}
