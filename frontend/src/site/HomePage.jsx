import AvatarPreview from '../avatars/AvatarPreview'
import { THEMES } from '../rooms/themes'
import { loadMyRoom } from './myRoom'
import { formatClock, formatMinutes } from './usePomodoro'

const dateText = () => new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

// Sayfam: giriş yapınca açılan ilk sayfa. Solda selam, bugünkü odak ve kısayollar; sağda avatar.
export default function HomePage({ user, avatar, timer, rooms, onGo, onEnter }) {
  const myTheme = loadMyRoom(user).theme
  const firstName = user.displayName.split(' ')[0]
  const quick = rooms.find((r) => r.access === 'public')

  return (
    <div className="home">
      <div className="home__main">
        <section className="site-card home__hero">
          <span className="site-muted home__date">{dateText()}</span>
          <h1>
            Merhaba <span className="accent">{firstName}</span>.
          </h1>
          <p className="home__lead">Bugün de birlikte odaklanalım. Odana geç, sayacını başlat; avatarın masanda seni bekliyor.</p>
          <div className="site-actions">
            <button type="button" className="site-btn site-btn--primary site-btn--lg" onClick={() => onGo('odam')}>
              Odama git
            </button>
            <button type="button" className="site-btn site-btn--lg" disabled={!quick} onClick={() => onEnter(quick)}>
              Hızlı odaya katıl
            </button>
          </div>
        </section>

        <div className="home__stats">
          <div className="site-card stat">
            <span className="site-muted">Bugünkü odak</span>
            <span className="stat__value">{formatMinutes(timer.stats.minutes)}</span>
            <span className="site-muted">{timer.stats.pomodoros} pomodoro tamamlandı</span>
          </div>
          <div className="site-card stat">
            <span className="site-muted">Sayaç</span>
            <span className="stat__value">{formatClock(timer.remaining)}</span>
            <span className="site-muted">
              {timer.running ? (timer.phase === 'focus' ? 'Odaktasın' : 'Moladasın') : timer.fresh ? 'Hazır' : 'Duraklatıldı'}
            </span>
          </div>
          <div className="site-card stat">
            <span className="site-muted">Senin odan</span>
            <span className="stat__value stat__value--text">{THEMES[myTheme]?.label ?? 'Kütüphane'}</span>
            <button type="button" className="link-btn" onClick={() => onGo('odam')}>
              Tasarımını değiştir
            </button>
          </div>
        </div>

        <section className="site-card home__rooms">
          <div className="section-head section-head--row">
            <div>
              <span className="eyebrow">Birlikte çalış</span>
              <h2>Odalar</h2>
            </div>
            <button type="button" className="site-btn" onClick={() => onGo('katil')}>
              Odaya katıl
            </button>
          </div>
          <p className="site-muted">
            Şu an {rooms.filter((r) => r.access === 'public').length} herkese açık oda var. Davet kodun varsa gizli odalara da Odaya katıl sayfasından girebilirsin.
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
          <button type="button" className="site-btn site-btn--primary" onClick={() => onGo('avatar')}>
            Avatarı düzenle
          </button>
        </div>
      </aside>
    </div>
  )
}
