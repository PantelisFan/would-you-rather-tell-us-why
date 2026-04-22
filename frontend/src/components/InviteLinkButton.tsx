import { useMemo, useState } from 'react';
import { clientLog } from '../utils/debug';

interface Props {
  roomCode: string;
}

export default function InviteLinkButton({ roomCode }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return `/join/${roomCode}`;
    }

    return `${window.location.origin}/join/${roomCode}`;
  }, [roomCode]);

  const handleShare = async () => {
    try {
      clientLog('info', 'actions', 'Sharing invite link', { roomCode, inviteUrl });

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: `Join room ${roomCode}`,
          text: `Join my Would You Rather room ${roomCode}`,
          url: inviteUrl,
        });
        setStatus('Invite link shared.');
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
        setStatus('Invite link copied.');
        return;
      }

      window.prompt('Copy this invite link', inviteUrl);
      setStatus('Copy the invite link to share it.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      clientLog('warn', 'actions', 'Invite link share failed', {
        roomCode,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setStatus('Could not share invite link.');
    }
  };

  return (
    <div
      className="card"
      style={{
        width: '100%',
        maxWidth: 520,
        marginBottom: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#a5a5c0', textTransform: 'uppercase' }}>
            Invite link
          </div>
          <div style={{ fontWeight: 700 }}>Room {roomCode}</div>
        </div>
        <button className="secondary" onClick={handleShare}>
          Share Link
        </button>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#a5a5c0', wordBreak: 'break-all' }}>
        {status ?? inviteUrl}
      </div>
    </div>
  );
}