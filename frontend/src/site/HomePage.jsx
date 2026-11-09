import AvatarPreview from '../avatars/AvatarPreview'
import { THEMES } from '../rooms/themes'
import { loadMyRoom } from './myRoom'
import { formatClock, formatMinutes } from './usePomodoro'

const dateText = () => new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

// Sayfam: giriş yapınca açılan ilk sayfa. Tek birincil eylem "Odama git"; yanında sayacın o anki
// durumu ve odanın adı yazar, böylece ilk gelen kişi masasının ve sayacının hazır olduğunu görür.
// Bugünkü odak kartı ancak sayılacak bir şey olunca çıkar (ilk gün "0 dk" gösterilmez).
export default function HomePage({ user, avatar, timer, rooms, onGo, onEnter }) {
  const roomLabel = THEMES[loadMyRoom(user).theme]?.label ?? 'Kütüphane'
  const firstName = user.displayName.split(' ')[0]
  const open = rooms.filter((r) => r.access === 'public')
  const quick = open[0]
  const { minutes, pomodoros } = timer.stats
  const hasToday = minutes > 0 || pomodoros > 0
  const timerText = timer.running
    ? `${timer.phase === 'focus' ? 'Odaktasın' : 'Moladasın'} · ${formatClock(timer.remaining)}`
    : timer.fresh
      ? `Sayaç hazır · ${formatClock(timer.remaining)}`
      : `Duraklatıldı · ${formatClock(timer.remaining)}`

  return (
    <div className="home">
      <div className="home__main">
        <section className="site-card home__hero">
          <span className="site-muted home__date">{dateText()}</span>
          <h1>
            Merhaba <span className="accent">{firstName}</span>.
          </h1>
          <p className="home__lead">Avatarın {roomLabel} odasında, masanda seni bekliyor.</p>
          <div className="home__go">
            <button type="button" className="site-btn site-btn--primary site-btn--lg" onClick={() => onGo('odam')}>
              Odama git
            </button>
            <span className="home__timer" role="status">
              {timerText}
            </span>
          </div>
        </section>

        {hasToday && (
          <section className="site-card home__today" aria-label="Bugünkü odak">
            <span className="site-muted">Bugünkü odak</span>
            <span className="stat__value">{formatMinutes(minutes)}</span>
            <span className="site-muted">{pomodoros} pomodoro tamamlandı</span>
          </section>
        )}

        <section className="site-card home__rooms">
          <div className="section-head section-head--row">
            <h2>Odalar</h2>
            <button type="button" className="site-btn" onClick={() => onGo('lobi')}>
              Lobiye git
            </button>
          </div>
          <p className="site-muted">
            Şu an {open.length} herkese açık oda var.{' '}
            {quick && (
              <button type="button" className="link-btn" onClick={() => onEnter(quick)}>
                Birine hemen katıl
              </button>
            )}
          </p>
        </section>
      </div>

      <aside className="site-card home__avatar" aria-label="Avatarın">
        <div className="home__avatar-stage">
          <AvatarPreview avatar={avatar} mode="break" />
        </div>
        <div className="home__avatar-foot">
          <div>
            <span className="home__avatar-name">{avatar.name}</span>
            <span className="site-muted">@{user.username}</span>
          </div>
          <button type="button" className="site-btn" onClick={() => onGo('avatar')}>
            Avatarı düzenle
          </button>
        </div>
      </aside>
    </div>
  )
}
