import AvatarPreview from '../avatars/AvatarPreview'
import { THEMES } from '../rooms/themes'
import { loadMyRoom } from './myRoom'
import { formatClock, formatMinutes } from './usePomodoro'
import { GOAL_DEFAULTS, goalPercent } from './goals'
import { weekOf } from './weekStats'
import { QUOTES, quoteForDay } from './quotes'
import RoomShot from './RoomShot'
import Dotted from './Dotted'
import { membersLabel } from './access'

const COPY = {
  quote: 'Günün sözü',
  today: 'Bugün',
  todayZero: 'Henüz blok yok',
  todayMeta: (goal, n) => `Hedef ${goal} · ${n} pomodoro`,
  goalLabel: (pct) => `Günlük hedefin yüzde ${pct}'i`,
  week: 'Bu hafta',
  weekZero: 'Bu hafta henüz blok yok',
  weekGoal: (goal, pct) => `Hedef ${goal} · %${pct}`,
  weekGoalLabel: (pct) => `Haftalık hedefin yüzde ${pct}'i`,
  more: (d) => `Geçen haftanın aynı günlerinden ${d} fazla`,
  less: (d) => `Geçen haftanın aynı günlerinden ${d} az`,
  same: 'Geçen haftanın aynı günleriyle aynı',
  chart: 'Haftalık çalışma',
  todayBar: 'Bugün',
  noFocus: 'çalışma yok',
}

// Odalar kartı. Sayı ve ad ayrı değişken; çeviride sıra değişebilir.
const ROOMS_COPY = {
  first: 'İlk odanı seç',
  recent: 'Son girdiğin odalar',
  open: 'Lobide açık odalar',
  lobby: 'Lobiye git',
  capacity: (n) => `${n} kişilik`,
  enter: 'Gir',
  enterLabel: (name) => `${name} odasına gir`,
}
// Kartta gösterilen en çok oda
const ROOMS_SHOWN = 3

// Gir / Lobiye git yanındaki ok (yazının rengini alır)
const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const dateText = () => new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

function greeting(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return 'Günaydın'
  if (hour >= 12 && hour < 18) return 'İyi günler'
  if (hour >= 18 && hour < 22) return 'İyi akşamlar'
  return 'İyi geceler'
}

// Dar sütunda "2:30", genişte "2 sa 30 dk"
const shortTime = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

// Bugünün hedef halkası: çizgi hedefe ulaşınca dolar, yüzde metni 100'ü geçebilir.
function GoalRing({ minutes, goal }) {
  const pct = goalPercent(minutes, goal)
  const r = 50
  const len = 2 * Math.PI * r
  const filled = Math.min(1, minutes / goal) * len
  return (
    <svg className="home__ring" width="112" height="112" viewBox="0 0 120 120" role="img" aria-label={COPY.goalLabel(pct)}>
      <circle className="home__ring-track" cx="60" cy="60" r={r} />
      {filled > 0 && <circle className="home__ring-fill" cx="60" cy="60" r={r} strokeDasharray={`${filled} ${len}`} transform="rotate(-90 60 60)" />}
      <text x="60" y="67" textAnchor="middle">
        %{pct}
      </text>
    </svg>
  )
}

// Sayfam: giriş yapınca açılan ilk sayfa. Solda avatar, selamlama ve tek birincil eylem "Odama gir" (yanında sayacın
// o anki durumu); altında günün sözü. Sağda bugünkü ve bu haftaki odak süresi ile gün gün haftalık grafik. En altta
// son girilen odalar (ilk gelene lobideki açık odalar), her biri kendi "Gir" düğmesiyle.
export default function HomePage({ user, avatar, timer, goals = GOAL_DEFAULTS, rooms, joined = [], onGo, onEnter }) {
  const roomLabel = THEMES[loadMyRoom(user).theme]?.label ?? 'Kütüphane'
  const firstName = user.displayName.split(' ')[0]
  const open = rooms.filter((r) => r.access === 'public')
  // geri dönen kişiye son girdiği odalar, ilk gelene lobideki açık odalar
  const byId = new Map(rooms.map((r) => [r.id, r]))
  const recent = joined.map((j) => byId.get(j.id)).filter(Boolean)
  const listed = (recent.length ? recent : open).slice(0, ROOMS_SHOWN)
  const firstRoom = joined.length === 0
  const { minutes, pomodoros } = timer.stats
  const hasToday = minutes > 0 || pomodoros > 0
  const week = weekOf(timer.history ?? {})
  const scale = Math.max(goals.daily, ...week.days.map((d) => d.minutes))
  const weekPct = goalPercent(week.total, goals.weekly)
  const diff = week.total - week.lastSpan
  const [quote, by] = QUOTES[quoteForDay()]
  const timerText = timer.running
    ? `${timer.phase === 'focus' ? 'Odaktasın' : 'Moladasın'} · ${formatClock(timer.remaining)}`
    : timer.fresh
      ? `Sayaç hazır · ${formatClock(timer.remaining)}`
      : `Duraklatıldı · ${formatClock(timer.remaining)}`

  return (
    <div className="home">
      <aside className="home__side">
        <section className="site-card home__me" aria-label="Avatarın">
          <div className="home__avatar-stage">
            <AvatarPreview avatar={avatar} mode="break" />
          </div>
          <div className="home__me-body">
            <div>
              <span className="site-muted home__date">{dateText()}</span>
              <h1>
                {greeting()}, <span className="accent">{firstName}</span>
              </h1>
            </div>
            <button type="button" className="site-btn site-btn--primary site-btn--lg site-btn--wide" onClick={() => onGo('odam')}>
              Odama gir
            </button>
            <span className="home__timer" role="status">
              {roomLabel} · {timerText}
            </span>
          </div>
        </section>

        <figure className="site-card home__quote">
          <span className="home__quote-label">{COPY.quote}</span>
          <blockquote>“{quote}”</blockquote>
          <figcaption className="site-muted">{by}</figcaption>
        </figure>
      </aside>

      <div className="home__main">
        <div className="home__stats">
          <section className="site-card home__stat home__stat--today" aria-label={COPY.today}>
            <GoalRing minutes={minutes} goal={goals.daily} />
            <div className="home__stat-text">
              <span className="site-muted">{COPY.today}</span>
              {hasToday ? (
                <>
                  <span className="stat__value">{formatMinutes(minutes)}</span>
                  <span className="site-muted">{COPY.todayMeta(formatMinutes(goals.daily), pomodoros)}</span>
                </>
              ) : (
                <>
                  <span className="stat__value stat__value--zero">{COPY.todayZero}</span>
                </>
              )}
            </div>
          </section>

          <section className="site-card home__stat" aria-label={COPY.week}>
            <div className="home__stat-text">
              <span className="site-muted">{COPY.week}</span>
              {week.total > 0 ? (
                <>
                  <span className="stat__value">{formatMinutes(week.total)}</span>
                  <span className="home__week-goal">
                    <span className="home__week-bar" role="img" aria-label={COPY.weekGoalLabel(weekPct)}>
                      <span style={{ width: `${Math.min(100, weekPct)}%` }} />
                    </span>
                    <span className="site-muted">{COPY.weekGoal(formatMinutes(goals.weekly), weekPct)}</span>
                  </span>
                  {week.lastSpan > 0 ? (
                    <span className={diff > 0 ? 'home__trend home__trend--up' : 'site-muted'}>
                      {diff > 0 ? COPY.more(formatMinutes(diff)) : diff < 0 ? COPY.less(formatMinutes(-diff)) : COPY.same}
                    </span>
                  ) : (
                    <span className="site-muted">{week.pomodoros} pomodoro</span>
                  )}
                </>
              ) : (
                <>
                  <span className="stat__value stat__value--zero">{COPY.weekZero}</span>
                  <span className="site-muted">{COPY.weekGoal(formatMinutes(goals.weekly), 0)}</span>
                </>
              )}
            </div>
          </section>
        </div>

        <section className="site-card home__chart" aria-labelledby="sayfamHafta">
          <div className="section-head section-head--row">
            <h2 id="sayfamHafta">{COPY.chart}</h2>
            <span className="site-muted">{week.range}</span>
          </div>
          <ol className="home__bars">
            {week.days.map((d) => (
              <li key={d.key} className="home__bar" data-today={d.today || undefined} data-future={d.future || undefined}>
                <span className="visually-hidden">
                  {d.long}: {d.minutes > 0 ? formatMinutes(d.minutes) : COPY.noFocus}
                </span>
                <span className="home__bar-value" aria-hidden="true">
                  {d.minutes > 0 ? (
                    <>
                      <span className="home__bar-long">{formatMinutes(d.minutes)}</span>
                      <span className="home__bar-short">{shortTime(d.minutes)}</span>
                    </>
                  ) : d.future ? (
                    ''
                  ) : (
                    '—'
                  )}
                </span>
                <span className="home__bar-track" aria-hidden="true">
                  <span className="home__bar-fill" style={{ height: d.minutes > 0 ? `${Math.max(3, (d.minutes / scale) * 100)}%` : undefined }} />
                </span>
                <span className="home__bar-day" aria-hidden="true">
                  {d.today ? COPY.todayBar : d.short}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="site-card home__rooms" aria-labelledby="sayfamOdalar">
        <div className="section-head section-head--row">
          <h2 id="sayfamOdalar">{firstRoom ? ROOMS_COPY.first : recent.length ? ROOMS_COPY.recent : ROOMS_COPY.open}</h2>
          <button type="button" className="quiet-btn home__lobby" onClick={() => onGo('lobi')}>
            {ROOMS_COPY.lobby}
            <Arrow />
          </button>
        </div>
        {firstRoom && (
          <p className="home__first">
            Lobideki herkese açık odalardan birine otur; avatarın boş bir masaya geçer, sayacın seninle gelir. Davet kodun varsa davetli odaya da Lobi’den katılırsın.
          </p>
        )}
        {listed.length > 0 && (
          <ul className="home__room-grid">
            {listed.map((room) => (
              <li key={room.id} className="home__room-card">
                <span className="home__room-shot">
                  <RoomShot theme={room.theme} className="home__room-img" />
                  <span className="home__room-theme">{THEMES[room.theme]?.label}</span>
                </span>
                <span className="home__room-row">
                  <span className="home__room-text">
                    <strong title={room.name}>{room.name}</strong>
                    <span>
                      <Dotted parts={[ROOMS_COPY.capacity(room.capacity), membersLabel(room)].filter(Boolean)} keep />
                    </span>
                  </span>
                  <button type="button" className="site-btn site-btn--primary home__room-enter" onClick={() => onEnter(room)} aria-label={ROOMS_COPY.enterLabel(room.name)}>
                    {ROOMS_COPY.enter}
                    <Arrow />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
