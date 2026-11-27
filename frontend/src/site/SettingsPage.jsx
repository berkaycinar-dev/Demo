import { useState } from 'react'
import { GoalDialog } from './GoalPanel'
import { ModeChoice } from './SiteChrome'
import { PRESETS, formatMinutes } from './usePomodoro'

// Ayarlar: header'daki hesap menüsünden açılır. Siteyle ilgili tercihler tek yerde: görünüm, dil, sayaç ve
// çalışma hedefleri. Hesapla ilgili olanlar (ad, şifre) Hesap ayarları'nda kalır.
// Dil: site şimdilik yalnızca Türkçe; İngilizce seçeneği görünür ama kapalı ("Yakında").
const SETTINGS_COPY = {
  title: 'Ayarlar',
  look: 'Görünüm',
  theme: 'Tema',
  language: 'Dil',
  languageGroup: 'Site dili',
  soon: 'Yakında',
  timer: 'Sayaç',
  mode: 'Sayaç türü',
  modeGroup: 'Sayaç türü',
  preset: 'Pomodoro süresi',
  presetLocked: 'Sayaç başladı; süreyi değiştirmek için önce sayacı sıfırla.',
  presetGroup: 'Pomodoro süresi',
  goals: 'Çalışma hedefleri',
  daily: 'Günlük hedef',
  weekly: 'Haftalık hedef',
  edit: 'Hedefleri değiştir',
}

const LANGUAGES = [
  { id: 'tr', label: 'Türkçe', ready: true },
  { id: 'en', label: 'English', ready: false },
]

const TIMER_MODES = [
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'stopwatch', label: 'Kronometre' },
]

function Row({ label, hint, children }) {
  return (
    <div className="account__row">
      <div className="account__row-text">
        <span className="account__row-label">{label}</span>
        {hint && <span className="site-muted">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage({ modePref, onModeChange, timer, timerMode, onTimerModeChange, goals, onGoalsChange }) {
  const [goalsOpen, setGoalsOpen] = useState(false)
  // pomodoro süresi yalnızca sayaç baştayken değişir (usePomodoro.setPreset)
  const presetLocked = !timer.fresh

  return (
    <div className="account settings">
      <div className="page-head">
        <h1>{SETTINGS_COPY.title}</h1>
      </div>
      <div className="account__grid">
        <section className="site-card account__card" aria-labelledby="ayarGorunum">
          <h2 id="ayarGorunum">{SETTINGS_COPY.look}</h2>
          <div className="account__rows">
            <Row label={SETTINGS_COPY.theme}>
              <ModeChoice pref={modePref} onChange={onModeChange} />
            </Row>
            <Row label={SETTINGS_COPY.language}>
              <div className="mode-choice" role="group" aria-label={SETTINGS_COPY.languageGroup}>
                {LANGUAGES.map((l) => (
                  <button key={l.id} type="button" lang={l.id} aria-pressed={l.id === 'tr'} disabled={!l.ready} title={l.ready ? undefined : SETTINGS_COPY.soon}>
                    {l.label}
                    {!l.ready && <span className="settings__soon">{SETTINGS_COPY.soon}</span>}
                  </button>
                ))}
              </div>
            </Row>
          </div>
        </section>

        <section className="site-card account__card" aria-labelledby="ayarSayac">
          <h2 id="ayarSayac">{SETTINGS_COPY.timer}</h2>
          <div className="account__rows">
            <Row label={SETTINGS_COPY.mode}>
              <div className="mode-choice" role="group" aria-label={SETTINGS_COPY.modeGroup}>
                {TIMER_MODES.map((m) => (
                  <button key={m.id} type="button" aria-pressed={timerMode === m.id} onClick={() => onTimerModeChange(m.id)}>
                    {m.label}
                  </button>
                ))}
              </div>
            </Row>
            <Row label={SETTINGS_COPY.preset} hint={presetLocked ? SETTINGS_COPY.presetLocked : null}>
              <div className="mode-choice" role="group" aria-label={SETTINGS_COPY.presetGroup}>
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" aria-pressed={timer.preset === p.id} disabled={presetLocked && timer.preset !== p.id} onClick={() => timer.setPreset(p.id)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </Row>
          </div>
        </section>

        <section className="site-card account__card account__session" aria-labelledby="ayarHedef">
          <h2 id="ayarHedef">{SETTINGS_COPY.goals}</h2>
          <div className="account__rows">
            <Row label={SETTINGS_COPY.daily}>
              <span className="settings__value">{formatMinutes(goals.daily)}</span>
            </Row>
            <Row label={SETTINGS_COPY.weekly}>
              <span className="settings__value">{formatMinutes(goals.weekly)}</span>
            </Row>
          </div>
          <div className="account__actions">
            <button type="button" className="site-btn" onClick={() => setGoalsOpen(true)}>
              {SETTINGS_COPY.edit}
            </button>
          </div>
        </section>
      </div>
      <GoalDialog open={goalsOpen} goals={goals} onSave={onGoalsChange} onClose={() => setGoalsOpen(false)} />
    </div>
  )
}
