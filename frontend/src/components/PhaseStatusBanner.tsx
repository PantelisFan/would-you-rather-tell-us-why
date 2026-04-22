import { OPTIONAL_PHASES, PHASE_ORDER, Phase } from '@wyr/shared';
import { useGameStore } from '../store/gameStore';

const PHASE_META: Record<Phase, { label: string; title: string; description: string }> = {
  [Phase.LOBBY]: {
    label: 'Lobby',
    title: 'Waiting in the lobby',
    description: 'Players are joining and the host can still tune the room.',
  },
  [Phase.REVEAL]: {
    label: 'Reveal',
    title: 'Question reveal',
    description: 'A new prompt is on screen so everyone starts from the same place.',
  },
  [Phase.PAUSE]: {
    label: 'Pause',
    title: 'Defend your pick',
    description: 'Votes are locked. A few players may be called on to explain their choice.',
  },
  [Phase.VOTE]: {
    label: 'Vote',
    title: 'Voting is open',
    description: 'Pick your side and add a reason if you want to defend it.',
  },
  [Phase.RESULTS]: {
    label: 'Results',
    title: 'The room is looking at the split',
    description: 'See how everyone voted and read the best explanations.',
  },
  [Phase.BEST_ANSWER]: {
    label: 'Best Answer',
    title: 'Choosing the best explanation',
    description: 'Vote for the strongest or funniest reason from the round.',
  },
  [Phase.TRANSITION]: {
    label: 'Transition',
    title: 'Between questions',
    description: 'A quick reset before the next prompt comes in.',
  },
  [Phase.SUMMARY]: {
    label: 'Summary',
    title: 'Session wrap-up',
    description: 'The game is over and the room is looking back at standout moments.',
  },
};

function getVisibleTrack(activePhase: Phase, enabledOptionalPhases: Phase[]) {
  if (activePhase === Phase.LOBBY || activePhase === Phase.SUMMARY) {
    return [];
  }

  return PHASE_ORDER.filter(
    (phase) => !OPTIONAL_PHASES.includes(phase) || enabledOptionalPhases.includes(phase),
  );
}

export default function PhaseStatusBanner() {
  const room = useGameStore((s) => s.room);
  const currentQuestion = useGameStore((s) => s.currentQuestion);
  const activePhase = useGameStore((s) => s.phase) ?? Phase.LOBBY;

  if (!room) return null;

  const meta = PHASE_META[activePhase];
  const phaseTrack = getVisibleTrack(activePhase, room.config.enabledOptionalPhases);
  const showTrack = phaseTrack.length > 0;
  const hasQuestionProgress = showTrack && room.totalQuestions > 0;
  const questionNumber = room.currentQuestionIndex > 0 ? room.currentQuestionIndex : 1;

  return (
    <div className="room-banner phase-banner">
      <div className="phase-banner-copy">
        <span className="kicker">Current phase</span>
        <strong className="phase-banner-title">{meta.title}</strong>
        <p className="phase-banner-description">{meta.description}</p>
      </div>

      <div className="phase-banner-side">
        {hasQuestionProgress && (
          <div className="phase-banner-progress">
            Question {questionNumber} of {room.totalQuestions}
          </div>
        )}

        {currentQuestion && activePhase !== Phase.LOBBY && activePhase !== Phase.SUMMARY && (
          <div className="phase-banner-question">{currentQuestion.text}</div>
        )}

        {showTrack && (
          <div className="phase-track" aria-label="Round phase progress">
            {phaseTrack.map((phase) => (
              <span
                key={phase}
                className={`phase-chip${phase === activePhase ? ' active' : ''}`}
                aria-current={phase === activePhase ? 'step' : undefined}
              >
                {PHASE_META[phase].label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}