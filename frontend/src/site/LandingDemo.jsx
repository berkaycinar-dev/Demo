import { useEffect, useRef, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople from '../avatars/useRoomPeople'
import { THEMES } from '../rooms/themes'
import RoomShot from './RoomShot'
import { formatClock } from './usePomodoro'

// Tanıtım sayfasının oturum gösterimi: üç adım (oda seç, sayacı başlat, molaya kalk) ayrı kartlar
// yerine canlı bir odada sırayla oynar. Oda gerçek oda sahnesidir; tıklanır, döner. Gösterim
// hızlandırılmıştır ve bunu söyler. Oda arkadaşları simülasyondur; canlı kişi sayısı gösterilmez.
// Kendiliğinden oynar, Durdur ile durur (beş saniyeden uzun kendiliğinden ilerleyen içerik).
// "Hareketi azalt"ta kendiliğinden oynamaz; adımlar tıklanarak gezilir.

const THEME = 'teagarden'
const CAPACITY = 4
const STEP_MS = 6500
// gösterimde odak bloku bu kadar dakikadan geri sayar (hızlandırılmış)
const DEMO_FOCUS_MIN = 25
const DEMO_BREAK_MIN = 5

const DEMO_COPY = {
  title: 'Bir oturum, baştan sona',
  lead: 'Başkalarını çalışırken görmek seni de masada tutar; buna “body doubling” deniyor. Kimse seni izlemez, ama yalnız da değilsin. Bu oda bir oturumu hızlandırılmış oynatır.',
  steps: [
    { title: 'Bir oda seç', text: 'Odaya girersin; avatarın boş bir masaya oturur.' },
    { title: 'Sayacını başlat', text: '25, 50 ya da 90 dakikalık bloklar. Sen çalışırken masa lambaları biraz daha parlar.' },
    { title: 'Molaya kalk', text: 'Blok bitince mola köşesine yürürsün; odak dakikaların bugüne yazılır.' },
  ],
  stepsLabel: 'Oturumun adımları',
  play: 'Oynat',
  pause: 'Durdur',
  arrive: 'Odaya girdin',
  focus: 'Odak',
  break: 'Mola',
  gain: (min) => `+${min} dk bugüne`,
  sceneLabel: (name) => `${name} odası, oturum gösterimi`,
  tryTitle: 'Odada dene',
  trySteam: 'Semavere tıkla: buhar tüter',
  tryDrag: 'Odayı sürükle: döner',
  hint: 'Semavere tıkla · Sürükle: döndür',
  quoteLead: 'Odanın bugünkü sözü',
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Bölüm görünür olunca true; oda sahnesi ancak o zaman kurulur, gösterim yalnızca görünürken oynar.
function useInView(ref, margin) {
  const [state, setState] = useState({ near: false, visible: false })
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setState({ near: true, visible: true })
      return undefined
    }
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setState((s) => (s.near ? s : { ...s, near: true })), { rootMargin: margin })
    const vis = new IntersectionObserver(([e]) => setState((s) => ({ near: s.near || e.isIntersecting, visible: e.isIntersecting })), { threshold: 0.35 })
    near.observe(el)
    vis.observe(el)
    return () => {
      near.disconnect()
      vis.disconnect()
    }
  }, [ref, margin])
  return state
}

function DemoRoom({ step, avatar, arrive }) {
  const { Room } = THEMES[THEME]
  const { occupants } = useRoomPeople({ capacity: CAPACITY, seed: 23, me: avatar, forced: step === 2 ? 'break' : 'focus' })
  return (
    <Room capacity={CAPACITY} canvasStyle={{ width: '100%' }} arrive={arrive} lampBoost={step === 1} hint={DEMO_COPY.hint}>
      <AvatarCrowd occupants={occupants} theme={THEME} />
    </Room>
  )
}

export default function LandingDemo({ avatar, quote }) {
  const ref = useRef(null)
  const { near, visible } = useInView(ref, '300px')
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(() => !reducedMotion())
  // adımın başladığı an ve geçen süre (gösterim saatini ve ilerleme şeridini sürer)
  const [elapsed, setElapsed] = useState(0)
  const [round, setRound] = useState(0)
  const running = playing && visible

  useEffect(() => {
    if (!running) return undefined
    const started = performance.now() - elapsed
    const id = setInterval(() => {
      const e = performance.now() - started
      if (e < STEP_MS) {
        setElapsed(e)
        return
      }
      setElapsed(0)
      if (step === 2) setRound((r) => r + 1)
      setStep((step + 1) % 3)
    }, 200)
    return () => clearInterval(id)
    // elapsed yalnızca devam ederken başlangıç noktası için okunur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step])

  const go = (i) => {
    setStep(i)
    setElapsed(0)
    if (i === 0) setRound((r) => r + 1)
  }

  const progress = Math.min(1, elapsed / STEP_MS)
  const clock =
    step === 1
      ? { phase: DEMO_COPY.focus, secs: Math.round(DEMO_FOCUS_MIN * 60 * (1 - progress)) }
      : step === 2
        ? { phase: DEMO_COPY.break, secs: Math.round(DEMO_BREAK_MIN * 60 * (1 - progress)) }
        : null
  const [text, by] = quote

  return (
    <section id="nasil" ref={ref} className="lp-section lp-demo-wrap" aria-labelledby="nasilBaslik">
      <div className="lp-inner lp-demo">
        <div className="lp-demo__intro">
          <h2 id="nasilBaslik" className="lp-h2">
            {DEMO_COPY.title}
          </h2>
          <p className="lp-demo__lead">{DEMO_COPY.lead}</p>
        </div>

        <figure className="lp-demo__stage">
          <div className="lp-demo__scene" role="group" aria-label={DEMO_COPY.sceneLabel(THEMES[THEME].label)} data-step={step}>
            {/* sahne kurulana dek temanın görseli durur (boş kutu görünmesin) */}
            {near ? <DemoRoom step={step} avatar={avatar} arrive={!reducedMotion()} /> : <RoomShot theme={THEME} className="lp-demo__poster" />}
            {step === 0 && visible && (
              <div key={round} className="lp-demo__sign" aria-hidden="true">
                <span className="stage__arrival-lead">{DEMO_COPY.arrive}</span>
                <span className="stage__arrival-name">{THEMES[THEME].label}</span>
              </div>
            )}
            {clock && (
              <div className="lp-demo__clock" data-phase={step === 1 ? 'focus' : 'break'} aria-hidden="true">
                <span className="lp-demo__clock-phase">{clock.phase}</span>
                <span className="lp-demo__clock-time">{formatClock(clock.secs)}</span>
                {step === 2 && (
                  <span key={round} className="lp-demo__gain">
                    {DEMO_COPY.gain(DEMO_FOCUS_MIN)}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* söz odanın bir parçası: oturumun altında, odanın kendi satırı */}
          <figcaption className="lp-demo__line">
            <span className="lp-demo__line-lead">{DEMO_COPY.quoteLead}</span>
            <q>{text}</q> <span className="lp-demo__by">— {by}</span>
          </figcaption>
        </figure>

        <div className="lp-demo__side">
          <ol className="lp-demo__steps" aria-label={DEMO_COPY.stepsLabel}>
            {DEMO_COPY.steps.map((s, i) => (
              <li key={s.title}>
                <button type="button" aria-current={i === step ? 'step' : undefined} onClick={() => go(i)}>
                  <span className="lp-demo__no" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="lp-demo__step-text">
                    <span className="lp-demo__step-title">{s.title}</span>
                    <span className="lp-demo__step-body">{s.text}</span>
                  </span>
                  {i === step && <span className="lp-demo__fuse" style={{ transform: `scaleX(${playing ? progress : 0})` }} aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="site-btn lp-demo__play" onClick={() => setPlaying((p) => !p)}>
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 5l12 7-12 7z" />
              </svg>
            )}
            {playing ? DEMO_COPY.pause : DEMO_COPY.play}
          </button>

          <div className="lp-demo__try">
            <h3>{DEMO_COPY.tryTitle}</h3>
            <ul>
              <li>{DEMO_COPY.trySteam}</li>
              <li>{DEMO_COPY.tryDrag}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
