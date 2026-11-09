import { useEffect, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople from '../avatars/useRoomPeople'
import { LISTED_THEMES, THEMES } from '../rooms/themes'
import { loadMyRoom, saveMyRoom } from './myRoom'
import { SOUNDS, playAmbient, setAmbientVolume, stopAmbient } from './ambient'
import RoomStage, { FocusModeButton } from './RoomStage'
import TimerCard from './TimerCard'
import { swatchOf } from './themeLook'

// Odam: tek kişilik kişisel oda. Sağda sayaç ve oda ayarları (tasarım, ortam sesi).
export default function SoloRoomPage({ user, avatar, timer, focusMode, onFocusModeChange }) {
  const [settings, setSettings] = useState(() => loadMyRoom(user))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { label, Room } = THEMES[settings.theme]
  const { occupants, setMyStatus } = useRoomPeople({ capacity: 1, seed: 7, me: avatar, cheer: timer.completed })

  useEffect(() => saveMyRoom(user, settings), [settings, user])

  // Sayaç avatarı yönetir: odakta masada, molada mola yerinde.
  useEffect(() => {
    setMyStatus(timer.phase === 'break' && timer.running ? 'break' : 'focus')
  }, [timer.phase, timer.running, setMyStatus])

  // Ortam sesi bu sayfadayken çalar; sayfadan çıkınca susar.
  useEffect(() => {
    if (settings.sound) playAmbient(settings.sound, settings.volume)
    else stopAmbient()
    // ses düzeyi ayrı efektte; burada yalnızca ses değişince yeniden başlat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.sound])
  useEffect(() => setAmbientVolume(settings.volume), [settings.volume])
  useEffect(() => () => stopAmbient(), [])

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }))
  const playing = SOUNDS.find((s) => s.id === settings.sound)

  const timerCard = <TimerCard timer={timer} title="Odak sayacı" compact={focusMode} />

  const panel = (
    <>
      <div className="stage-card stage-card--head">
        <div>
          <h1 className="stage-card__title">{label}</h1>
          <p className="site-muted">Tek kişilik, yalnızca sana ait.</p>
        </div>
        <FocusModeButton onClick={() => onFocusModeChange(true)} />
      </div>

      <div className="stage-card">{timerCard}</div>

      {/* Ayarlar seyrek değişir: kapalı başlar, panel 1440×900'de kaydırmadan sığar. Özet satırı
          kapalıyken de seçili tasarımı ve sesi söyler. */}
      <section className="stage-card fold" aria-labelledby="ayarBaslik">
        <h2 id="ayarBaslik" className="fold__heading">
          <button type="button" className="fold__toggle" aria-expanded={settingsOpen} aria-controls="roomSettings" onClick={() => setSettingsOpen((v) => !v)}>
            <span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
              </svg>
              Oda ayarları
            </span>
            <span className="fold__summary">
              {label} · {playing ? playing.label : 'Sessiz'}
              <svg className="fold__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>
        </h2>
        <div id="roomSettings" className="fold__body" hidden={!settingsOpen}>

          <fieldset className="field">
            <legend className="field__label">Tasarım</legend>
            <div className="design-grid">
              {LISTED_THEMES.map(([key, t]) => (
                <button key={key} type="button" className="design-option" aria-pressed={settings.theme === key} onClick={() => update({ theme: key })}>
                  <span className="design-option__swatch" style={{ background: swatchOf(key) }} aria-hidden="true" />
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="field field--last">
            <legend className="field__label">Ortam sesi</legend>
            <div className="choice-row">
              {SOUNDS.map((s) => (
                <button key={s.id} type="button" aria-pressed={settings.sound === s.id} onClick={() => update({ sound: s.id })}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="volume">
              <label className="volume__label" htmlFor="ambientVolume">
                Ses düzeyi
              </label>
              <input
                id="ambientVolume"
                type="range"
                min="0"
                max="100"
                value={Math.round(settings.volume * 100)}
                onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
                style={{ '--fill': `${settings.volume * 100}%` }}
              />
              <span className="volume__value">{Math.round(settings.volume * 100)}</span>
            </div>
            <div className="volume__foot">
              <span className="site-muted" role="status">
                {playing ? `Çalıyor: ${playing.label}` : 'Ortam sesi kapalı'}
              </span>
              <button type="button" className="site-btn site-btn--small" disabled={!playing} onClick={() => update({ sound: null })}>
                Kapat
              </button>
            </div>
          </fieldset>
        </div>
      </section>
    </>
  )

  return (
    <RoomStage
      focusMode={focusMode}
      onFocusModeChange={onFocusModeChange}
      timer={timer}
      renderRoom={(canvasStyle, canvasProps) => (
        <Room capacity={1} canvasStyle={canvasStyle} {...canvasProps}>
          <AvatarCrowd occupants={occupants} theme={settings.theme} />
        </Room>
      )}
      panel={panel}
      focusPanel={<div className="stage-card">{timerCard}</div>}
    />
  )
}
