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
    <div className="card">
      <h2>Room Settings</h2>

      <div className="settings-grid" style={{ marginTop: 12 }}>
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

      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '0.875rem', color: '#a5a5c0', marginBottom: 8 }}>
          Categories
        </h3>
        {ALL_CATEGORIES.map((cat) => (
          <label key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
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

      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: '0.875rem', color: '#a5a5c0', marginBottom: 8 }}>
          Difficulty
        </h3>
        {ALL_DIFFICULTIES.map((d) => (
          <label key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
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

      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: '0.875rem', color: '#a5a5c0', marginBottom: 8 }}>
          Optional Phases
        </h3>
        {OPTIONAL_PHASES.map((phase) => (
          <label key={phase} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
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

      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: '0.875rem', color: '#a5a5c0', marginBottom: 8 }}>
          Phase Durations (seconds)
        </h3>
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

      <div className="toggle-row" style={{ marginTop: 12 }}>
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
