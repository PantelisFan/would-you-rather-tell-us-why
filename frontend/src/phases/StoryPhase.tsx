import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../socket/client';
import Timer from '../components/Timer';
import LiveControls from '../components/LiveControls';
import { C2S, Phase } from '@wyr/shared';

export default function StoryPhase() {
  const endsAt = useGameStore((s) => s.endsAt);
  const question = useGameStore((s) => s.currentQuestion);
  const storyPromptPlayerIds = useGameStore((s) => s.storyPromptPlayerIds);
  const me = useGameStore((s) => s.me);
  const room = useGameStore((s) => s.room);
  const isHost = useGameStore((s) => s.isHost);

  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isPrompted = me && storyPromptPlayerIds.includes(me.id);
  const promptedNames = storyPromptPlayerIds
    .map((id) => room?.players.find((p) => p.id === id)?.name)
    .filter(Boolean);

  const handleSubmit = () => {
    if (!question || !text.trim()) return;
    socket.emit(C2S.STORY_SUBMIT, {
      questionId: question.id,
      text: text.trim(),
    });
    setSubmitted(true);
  };

  return (
    <>
      <Timer endsAt={endsAt} />
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Story Time</h2>
        {promptedNames.length > 0 && (
          <p style={{ color: '#a5a5c0', marginTop: 8 }}>
            {promptedNames.join(' & ')} — tell us more!
          </p>
        )}

        {isPrompted && !submitted && (
          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Tell us more about your choice..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              rows={4}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '1px solid #3b3b5c',
                background: '#1e1e30',
                color: '#e8e8f0',
                resize: 'vertical',
              }}
            />
            <button className="primary" style={{ marginTop: 8 }} onClick={handleSubmit}>
              Share Story
            </button>
          </div>
        )}

        {isPrompted && submitted && (
          <p style={{ color: '#a5a5c0', marginTop: 12 }}>Story shared!</p>
        )}

        {!isPrompted && (
          <p style={{ color: '#a5a5c0', marginTop: 12 }}>
            Listening to stories...
          </p>
        )}
      </div>
      {isHost && <LiveControls currentPhase={Phase.STORY} />}
    </>
  );
}
