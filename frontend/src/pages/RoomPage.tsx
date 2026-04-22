import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket/client';
import { hydrateRoomState, setupListeners, teardownListeners } from '../socket/listeners';
import { useGameStore } from '../store/gameStore';
import { C2S, Phase } from '@wyr/shared';
import { clientLog } from '../utils/debug';

import LobbyPhase from '../phases/LobbyPhase';
import RevealPhase from '../phases/RevealPhase';
import PausePhase from '../phases/PausePhase';
import VotePhase from '../phases/VotePhase';
import ResultsPhase from '../phases/ResultsPhase';
import BestAnswerPhase from '../phases/BestAnswerPhase';
import StoryPhase from '../phases/StoryPhase';
import TransitionPhase from '../phases/TransitionPhase';
import SummaryPhase from '../phases/SummaryPhase';

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const phase = useGameStore((s) => s.phase);
  const error = useGameStore((s) => s.error);
  const me = useGameStore((s) => s.me);
  const room = useGameStore((s) => s.room);
  const nudgePlayerId = useGameStore((s) => s.nudgePlayerId);

  useEffect(() => {
    setupListeners();
    const storedPlayerId = sessionStorage.getItem('wyr:playerId');
    const roomLoaded = useGameStore.getState().room;

    if (!socket.connected) {
      clientLog('debug', 'actions', 'Connecting socket from room page', { code, storedPlayerId });
      socket.connect();
    } else if (!roomLoaded && storedPlayerId && code) {
      clientLog('info', 'actions', 'Attempting room-page rejoin hydration', {
        code,
        playerId: storedPlayerId,
      });
      socket.emit(C2S.ROOM_REJOIN, { code, playerId: storedPlayerId }, (data: any) => {
        if (data?.room) {
          clientLog('info', 'actions', 'Room-page rejoin acknowledged', {
            roomCode: data.room.code,
            playerId: data.playerId,
          });
          hydrateRoomState(data);
        }
      });
    }

    return () => teardownListeners();
  }, [code]);

  const nudgedPlayerName = room?.players.find((player) => player.id === nudgePlayerId)?.name;
  const nudgeMessage = !nudgePlayerId
    ? null
    : nudgePlayerId === me?.id
      ? 'The host called on you. Tell us more.'
      : nudgedPlayerName
        ? `${nudgedPlayerName} just got called out.`
        : 'Someone just got called out.';

  return (
    <div className="page">
      {error && <div style={{ color: '#f87171', marginBottom: 8 }}>{error}</div>}
      {nudgeMessage && (
        <div
          className="card"
          style={{
            width: '100%',
            maxWidth: 480,
            marginBottom: 8,
            textAlign: 'center',
            borderColor: '#f59e0b',
          }}
        >
          <strong style={{ color: '#f59e0b' }}>{nudgeMessage}</strong>
        </div>
      )}

      {(!phase || phase === Phase.LOBBY) && <LobbyPhase />}
      {phase === Phase.REVEAL && <RevealPhase />}
      {phase === Phase.PAUSE && <PausePhase />}
      {phase === Phase.VOTE && <VotePhase />}
      {phase === Phase.RESULTS && <ResultsPhase />}
      {phase === Phase.BEST_ANSWER && <BestAnswerPhase />}
      {phase === Phase.STORY && <StoryPhase />}
      {phase === Phase.TRANSITION && <TransitionPhase />}
      {phase === Phase.SUMMARY && <SummaryPhase />}
    </div>
  );
}
