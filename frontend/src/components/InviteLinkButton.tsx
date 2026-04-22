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
    <div className="card invite-card">
      <div className="invite-head">
        <div>
          <div className="invite-eyebrow">Invite link</div>
          <div className="invite-title">Room {roomCode}</div>
        </div>
        <button className="secondary" onClick={handleShare}>
          Share Link
        </button>
      </div>

      <div className="invite-url">{status ?? inviteUrl}</div>
    </div>
  );
}