import { useState, useEffect, useCallback } from 'react';
import type { RoomConfig, Phase, Question } from '@wyr/shared';
import {
  ALL_CATEGORIES,
  ALL_DIFFICULTIES,
  OPTIONAL_PHASES,
  DEFAULT_PHASE_DURATIONS,
} from '@wyr/shared';

interface Props {
  config: RoomConfig;
  disabled: boolean;
  onChange: (patch: Partial<RoomConfig>) => void;
}

const EMPTY_QUESTION: () => Question = () => ({
  id: '',
  text: '',
  options: [
    { id: '', label: '' },
    { id: '', label: '' },
  ],
  category: 'classic',
  difficulty: 'easy',
});

function isQuestionComplete(q: Question): boolean {
  return (
    q.options[0].label.trim().length > 0 &&
    q.options[1].label.trim().length > 0
  );
}

export default function SettingsPanel({ config, disabled, onChange }: Props) {
  const customMode = config.customQuestions.length > 0;
  const [showCustom, setShowCustom] = useState(customMode);

  // Local draft state — only complete questions get synced to the server
  const [drafts, setDrafts] = useState<Question[]>(() =>
    customMode ? config.customQuestions : [],
  );

  const syncToServer = useCallback(
    (questions: Question[]) => {
      const complete = questions
        .filter(isQuestionComplete)
        .map((q) => ({
          ...q,
          text: `Would you rather ${q.options[0].label.trim()} or ${q.options[1].label.trim()}?`,
        }));
      // Only send when we have >= 3 complete questions, or send [] to clear
      if (complete.length >= 3) {
        onChange({ customQuestions: complete });
      } else if (config.customQuestions.length > 0) {
        // Had valid questions before but now below threshold — clear server
        onChange({ customQuestions: [] });
      }
    },
    [onChange, config.customQuestions.length],
  );

  const toggleCustomMode = () => {
    if (showCustom) {
      setDrafts([]);
      onChange({ customQuestions: [] });
      setShowCustom(false);
    } else {
      setDrafts([EMPTY_QUESTION(), EMPTY_QUESTION(), EMPTY_QUESTION()]);
      setShowCustom(true);
    }
  };

  const updateDraft = (index: number, patch: Partial<Question>) => {
    setDrafts((prev) => {
      const next = prev.map((q, i) => (i === index ? { ...q, ...patch } : q));
      syncToServer(next);
      return next;
    });
  };

  const updateOptionLabel = (qIndex: number, optIndex: 0 | 1, label: string) => {
    setDrafts((prev) => {
      const q = prev[qIndex];
      const nextOptions: [Question['options'][0], Question['options'][1]] = [
        { ...q.options[0] },
        { ...q.options[1] },
      ];
      nextOptions[optIndex] = { ...nextOptions[optIndex], label };
      const next = prev.map((item, i) =>
        i === qIndex ? { ...item, options: nextOptions } : item,
      );
      syncToServer(next);
      return next;
    });
  };

  const addQuestion = () => {
    if (drafts.length >= 50) return;
    setDrafts((prev) => [...prev, EMPTY_QUESTION()]);
  };

  const removeQuestion = (index: number) => {
    setDrafts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        onChange({ customQuestions: [] });
        setShowCustom(false);
      } else {
        syncToServer(next);
      }
      return next;
    });
  };

  const completeCount = drafts.filter(isQuestionComplete).length;

  return (
    <div className="card settings-panel">
      <div className="section-header">
        <span className="kicker">Host setup</span>
        <h2 className="phase-title">Room settings</h2>
        <p className="muted">Tune the room before the first question lands.</p>
      </div>

      {/* ── Question source toggle ── */}
      <div className="toggle-row" style={{ marginTop: '1rem' }}>
        <span>Use custom questions</span>
        <input
          type="checkbox"
          checked={showCustom}
          disabled={disabled}
          onChange={toggleCustomMode}
        />
      </div>

      {showCustom ? (
        /* ── Custom question editor ── */
        <div className="section-card custom-questions-section">
          <div className="section-header">
            <h3>Your questions</h3>
            <p className="muted">
              {completeCount} of {drafts.length} ready{completeCount < 3 ? ' — need at least 3' : ''}
            </p>
          </div>

          <div className="custom-question-list">
            {drafts.map((q, qi) => (
              <div key={qi} className="custom-question-row">
                <div className="custom-question-head">
                  <span className="custom-question-number">{qi + 1}</span>
                  <button
                    className="custom-question-remove"
                    disabled={disabled}
                    onClick={() => removeQuestion(qi)}
                    aria-label={`Remove question ${qi + 1}`}
                  >
                    ×
                  </button>
                </div>
                <div className="custom-question-prompt">Would you rather…</div>
                <div className="custom-option-pair">
                  <input
                    placeholder="Option A"
                    value={q.options[0].label}
                    disabled={disabled}
                    maxLength={100}
                    onChange={(e) => updateOptionLabel(qi, 0, e.target.value)}
                  />
                  <span className="custom-option-or">or</span>
                  <input
                    placeholder="Option B"
                    value={q.options[1].label}
                    disabled={disabled}
                    maxLength={100}
                    onChange={(e) => updateOptionLabel(qi, 1, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {drafts.length < 50 && (
            <button
              className="secondary full-width-button"
              disabled={disabled}
              onClick={addQuestion}
              style={{ marginTop: '0.75rem' }}
            >
              + Add question
            </button>
          )}
        </div>
      ) : (
        /* ── Bank mode settings ── */
        <>
          <div className="settings-grid" style={{ marginTop: '1rem' }}>
            <label>
              Questions
              <input
                type="number"
                min={1}
                max={50}
                value={config.questionCount}
                disabled={disabled}
                onChange={(e) => onChange({ questionCount: +e.target.value })}
              />
            </label>

            <label>
              Min Players
              <input
                type="number"
                min={2}
                max={20}
                value={config.minPlayers}
                disabled={disabled}
                onChange={(e) => onChange({ minPlayers: +e.target.value })}
              />
            </label>

            <label>
              Max Players
              <input
                type="number"
                min={2}
                max={50}
                value={config.maxPlayers}
                disabled={disabled}
                onChange={(e) => onChange({ maxPlayers: +e.target.value })}
              />
            </label>
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3>Categories</h3>
            </div>
            <div className="choice-cloud">
              {ALL_CATEGORIES.map((cat) => (
                <label key={cat} className="choice-chip">
                <input
                  type="checkbox"
                  checked={config.categories.includes(cat)}
                  disabled={disabled}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...config.categories, cat]
                      : config.categories.filter((c) => c !== cat);
                    onChange({ categories: next as any });
                  }}
                />
                {cat}
              </label>
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3>Difficulty</h3>
            </div>
            <div className="choice-cloud">
              {ALL_DIFFICULTIES.map((d) => (
                <label key={d} className="choice-chip">
                <input
                  type="checkbox"
                  checked={config.difficulty.includes(d)}
                  disabled={disabled}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...config.difficulty, d]
                      : config.difficulty.filter((x) => x !== d);
                    onChange({ difficulty: next as any });
                  }}
                />
                {d}
              </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="section-card">
        <div className="section-header">
          <h3>Optional phases</h3>
        </div>
        <div className="choice-cloud">
          {OPTIONAL_PHASES.map((phase) => (
            <label key={phase} className="choice-chip">
            <input
              type="checkbox"
              checked={config.enabledOptionalPhases.includes(phase)}
              disabled={disabled}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...config.enabledOptionalPhases, phase]
                  : config.enabledOptionalPhases.filter((p) => p !== phase);
                onChange({ enabledOptionalPhases: next });
              }}
            />
            {phase}
          </label>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h3>Phase durations</h3>
          <p className="muted">Keep the round quick and conversational.</p>
        </div>
        <div className="settings-grid">
          {(Object.keys(DEFAULT_PHASE_DURATIONS) as Phase[])
            .filter((p) => DEFAULT_PHASE_DURATIONS[p] > 0)
            .map((phase) => (
              <label key={phase}>
                {phase}
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={config.phaseDurations[phase]}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange({
                      phaseDurations: {
                        ...config.phaseDurations,
                        [phase]: +e.target.value,
                      },
                    })
                  }
                />
              </label>
            ))}
        </div>
      </div>

      <div className="toggle-row" style={{ marginTop: '0.25rem' }}>
        <span>Allow late join</span>
        <input
          type="checkbox"
          checked={config.allowLateJoin}
          disabled={disabled}
          onChange={(e) => onChange({ allowLateJoin: e.target.checked })}
        />
      </div>

      <div className="toggle-row">
        <span>Profanity filter</span>
        <input
          type="checkbox"
          checked={config.profanityFilter}
          disabled={disabled}
          onChange={(e) => onChange({ profanityFilter: e.target.checked })}
        />
      </div>
    </div>
  );
}
