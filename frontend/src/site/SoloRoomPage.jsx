import { useEffect, useMemo, useRef, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople from '../avatars/useRoomPeople'
import { LISTED_THEMES, THEMES } from '../rooms/themes'
import { loadMyRoom, saveMyRoom } from './myRoom'
import { SOUNDS, playAmbient, setAmbientVolume, stopAmbient } from './ambient'
import RoomStage, { FocusModeButton, FocusModeNote, ShortcutHelp } from './RoomStage'
import TimerCard from './TimerCard'
import { swatchOf } from './themeLook'
import Dotted from './Dotted'
import ThemeLabel from './ThemeLabel'
import useFirstVisit from './useFirstVisit'
import { revealEl } from './scroll'

// Odam: tek kişilik kişisel oda. Sağda sayaç ve oda ayarları (tasarım, ortam sesi).
// Varış levhasının metni (bkz. RoomStage).
const ARRIVE_LEAD = 'Odana girdin'

export default function SoloRoomPage({ user, avatar, timer, focusMode, onFocusModeChange, arriving }) {
  const [settings, setSettings] = useState(() => loadMyRoom(user))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { label, Room } = THEMES[settings.theme]
  const { occupants, setMyStatus } = useRoomPeople({ capacity: 1, seed: 7, me: avatar, cheer: timer.completed })
  // Sayaç durmuşken (odak aşamasında) ad etiketi "Masada" okur; avatar yine masada oturur.
  const idle = timer.phase === 'focus' && !timer.running
  const crowd = useMemo(() => occupants.map((o) => (o.me && idle ? { ...o, shown: 'idle' } : o)), [occupants, idle])

  useEffect(() => saveMyRoom(user, settings), [settings, user])

  // Sayaç avatarı yönetir: odakta masada, molada mola yerinde.
  useEffect(() => {
    setMyStatus(timer.phase === 'break' ? 'break' : 'focus')
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
  const settingsRef = useRef(null)
  // "Tasarımı değiştir": ayarlar açılır, bölüm görünür alana kayar, odak seçili tasarıma gider
  const openDesign = () => {
    setSettingsOpen(true)
    requestAnimationFrame(() => {
      const box = settingsRef.current
      revealEl(box, 'nearest')
      box?.querySelector('.design-option[aria-pressed="true"]')?.focus({ preventScroll: true })
    })
  }
  const playing = SOUNDS.find((s) => s.id === settings.sound)

  // Yardım satırları (Atla, odak modu, sahne ipucu) yalnızca ilk ziyarette görünür.
  const hints = useFirstVisit('odam')
  const timerCard = <TimerCard timer={timer} title="Odak sayacı" compact={focusMode} hints={hints} />

  // Çok kişili odadakiyle aynı masa: ad ince ceviz levhada, sayaç ve tam genişlik Başlat, altta odak
  // modu. Durum çipi yok (tek kişilik odada durum sayaçtan gelir). Masanın altında oda ayarları.
  const panel = (
    <>
      <div className="stage-card desk">
        <div className="desk__sign material-sign">
          <h1 className="stage-card__title">
            <ThemeLabel theme={settings.theme} markOnly />
            {label}
          </h1>
        </div>
        <div className="desk__info">
          <p className="site-muted">
            Tek kişilik, yalnızca sana ait.{' '}
            {/* tasarım değişikliği masadan bulunur: ayarlar açılır ve görünür alana gelir */}
            <button type="button" className="link-btn" aria-controls="roomSettings" onClick={openDesign}>
              Tasarımı değiştir
            </button>
          </p>
        </div>
        {timerCard}
        <div className="desk__foot">
          <div className="desk__foot-row">
            <FocusModeButton onClick={() => onFocusModeChange(true)} hints={hints} />
            <ShortcutHelp />
          </div>
          <FocusModeNote hints={hints} />
        </div>
      </div>

      {/* Ayarlar seyrek değişir: kapalı başlar, panel 1440×900'de kaydırmadan sığar. Özet satırı
          kapalıyken de seçili tasarımı ve sesi söyler. */}
      <section ref={settingsRef} className="stage-card fold" aria-labelledby="ayarBaslik">
        <h2 id="ayarBaslik" className="fold__heading">
          <button type="button" className="fold__toggle" aria-expanded={settingsOpen} aria-controls="roomSettings" onClick={() => setSettingsOpen((v) => !v)}>
            <span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
              </svg>
              Oda ayarları
            </span>
            <span className="fold__summary">
              <Dotted parts={[label, playing ? playing.label : 'Sessiz']} keep />
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
      arrival={arriving ? { lead: ARRIVE_LEAD, name: label } : null}
      renderRoom={(canvasStyle) => (
        <Room capacity={1} canvasStyle={canvasStyle} arrive={arriving} lampBoost={timer.running && timer.phase === 'focus'} hint={hints ? undefined : false}>
          <AvatarCrowd occupants={crowd} theme={settings.theme} />
        </Room>
      )}
      panel={panel}
      focusPanel={<div className="stage-card">{timerCard}</div>}
    />
  )
}
