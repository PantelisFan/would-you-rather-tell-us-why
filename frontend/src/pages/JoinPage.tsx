import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket/client';
import { hydrateRoomState, setupListeners, teardownListeners } from '../socket/listeners';
import { useGameStore } from '../store/gameStore';
import { C2S, RoomPreviewResponse } from '@wyr/shared';
import { clientLog } from '../utils/debug';
import { getStoredPlayerName, saveStoredPlayerName } from '../utils/playerIdentity';

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const normalizedCode = code?.toUpperCase() ?? '';
  const [name, setName] = useState(() => getStoredPlayerName());
  const [preview, setPreview] = useState<RoomPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const navigate = useNavigate();
  const error = useGameStore((s) => s.error);
  const room = useGameStore((s) => s.room);

  useEffect(() => {
    useGameStore.setState({ error: null });

    if (!normalizedCode) {
      setPreview(null);
      setPreviewError('Invalid invite link.');
      setLoadingPreview(false);
      return;
    }

    const storedRoomCode = sessionStorage.getItem('wyr:roomCode');
    if (storedRoomCode && storedRoomCode !== normalizedCode) {
      sessionStorage.removeItem('wyr:roomCode');
      sessionStorage.removeItem('wyr:playerId');
    }

    setupListeners();
    clientLog('debug', 'actions', 'Connecting socket from join page', { code: normalizedCode });
    socket.connect();

    setLoadingPreview(true);
    setPreview(null);
    setPreviewError(null);
    socket.emit(C2S.ROOM_PREVIEW, { code: normalizedCode }, (res?: RoomPreviewResponse & { message?: never } | { code: string; message: string }) => {
      if (!res) {
        setPreview(null);
        setPreviewError('Could not load room details.');
        setLoadingPreview(false);
        return;
      }

      if ('roomCode' in res) {
        setPreview(res);
        setPreviewError(null);
      } else {
        setPreview(null);
        setPreviewError(res.message);
      }

      setLoadingPreview(false);
    });

    return () => teardownListeners();
  }, [normalizedCode]);

  useEffect(() => {
    if (room?.code === normalizedCode) {
      navigate(`/room/${room.code}`, { replace: true });
    }
  }, [navigate, normalizedCode, room?.code]);

  const roomStatusMessage = previewError
    ? previewError
    : loadingPreview
      ? 'Checking room status...'
      : !preview
        ? null
        : preview.canJoin
          ? preview.started
            ? `Game in progress on ${preview.phase}. Pick a nickname to join live.`
            : `Lobby open with ${preview.playerCount}/${preview.maxPlayers} players.`
          : preview.joinBlockedReason === 'ROOM_FULL'
            ? 'This room is already full.'
            : 'This game has already started and late join is turned off.';

  const canJoin = Boolean(normalizedCode) && !loadingPreview && !previewError && preview?.canJoin !== false;

  const handleJoin = () => {
    setJoinError(null);

    if (!normalizedCode) {
      setJoinError('Invalid invite link.');
      return;
    }

    if (!name.trim()) {
      setJoinError('Choose a nickname before joining.');
      return;
    }

    if (preview && !preview.canJoin) {
      setJoinError(
        preview.joinBlockedReason === 'ROOM_FULL'
          ? 'This room is already full.'
          : 'This game has already started and late join is turned off.',
      );
      return;
    }

    saveStoredPlayerName(name);
    clientLog('info', 'actions', 'Joining room from join page', {
      roomCode: normalizedCode,
      name: name.trim(),
    });
    socket.emit(
      C2S.ROOM_JOIN,
      { code: normalizedCode, name: name.trim() },
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
      <div className="card phase-card centered-card">
        <span className="kicker">Invite landing</span>
        <h1 className="phase-title">Join room {normalizedCode || code}</h1>
        {roomStatusMessage && <p className="phase-subtitle">{roomStatusMessage}</p>}
        {preview && (
          <div className="join-meta">
            <span className="meta-pill">Phase: {preview.phase}</span>
            <span className="meta-pill">Players: {preview.playerCount}/{preview.maxPlayers}</span>
            <span className="meta-pill">Late join: {preview.allowLateJoin ? 'on' : 'off'}</span>
          </div>
        )}
        {(joinError || error) && <div className="error-banner">{joinError || error}</div>}

        <div className="form-stack">
          <input
            placeholder="Pick a nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
          <button className="primary full-width-button" onClick={handleJoin} disabled={!canJoin}>
            {loadingPreview ? 'Loading...' : preview?.started ? 'Join Live Game' : 'Join Room'}
          </button>
          <button className="secondary full-width-button" onClick={() => navigate('/')}>
            Back Home
          </button>
        </div>
      </div>
    </div>
  );
}
