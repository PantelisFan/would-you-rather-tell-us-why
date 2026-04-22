import type { RoomConfig, Phase } from '@wyr/shared';
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

export default function SettingsPanel({ config, disabled, onChange }: Props) {
  return (
    <div className="card settings-panel">
      <div className="section-header">
        <span className="kicker">Host setup</span>
        <h2 className="phase-title">Room settings</h2>
        <p className="muted">Tune the room before the first question lands.</p>
      </div>

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
