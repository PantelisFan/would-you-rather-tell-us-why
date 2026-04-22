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

  const handleCopy = async () => {
    try {
      clientLog('info', 'actions', 'Copying invite link', { roomCode, inviteUrl });

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
        setStatus('Invite link copied.');
        return;
      }

      window.prompt('Copy this invite link', inviteUrl);
      setStatus('Copy the invite link to share it.');
    } catch (error) {
      clientLog('warn', 'actions', 'Invite link copy failed', {
        roomCode,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setStatus('Could not copy invite link.');
    }
  };

  return (
    <div className="card invite-card">
      <div className="invite-head">
        <div>
          <div className="invite-eyebrow">Invite link</div>
          <div className="invite-title">Room {roomCode}</div>
        </div>
      </div>

      <button type="button" className="invite-url-button" onClick={handleCopy}>
        {inviteUrl}
      </button>

      <div className="invite-status">{status ?? 'Click the invite link to copy it.'}</div>
    </div>
  );
}