import AvatarPreview from '../avatars/AvatarPreview'
import { THEMES } from '../rooms/themes'
import { loadMyRoom } from './myRoom'
import { formatClock, formatMinutes } from './usePomodoro'
import RoomShot from './RoomShot'
import RoomMates from './RoomMates'
import Dotted from './Dotted'

// Bugün henüz sayılan blok yokken: boş bir "0 dk" kartı yerine ilk adımı söyleyen tek satır.
const TODAY_COPY = {
  zero: (min) => `Bugün henüz blok yok. İlk blok ${min} dakika; bitince burada sayılır.`,
}

// Odalar kartı. Sayı ve ad ayrı değişken; çeviride sıra değişebilir.
const ROOMS_COPY = {
  first: 'İlk odanı seç',
  rooms: 'Odalar',
  lobby: 'Lobiye git',
  recent: 'Son girdiğin odalar',
  open: 'Lobide açık odalar',
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

// Sayfam: giriş yapınca açılan ilk sayfa. Tek birincil eylem "Odama gir" (odaya giren her eylem "gir"); yanında sayacın o anki
// durumu ve odanın adı yazar, böylece ilk gelen kişi masasının ve sayacının hazır olduğunu görür.
// Bugünkü odak kartı ancak sayılacak bir şey olunca çıkar (ilk gün "0 dk" gösterilmez).
// İlk kez gelen (henüz hiçbir ortak odaya girmemiş) kişide Odalar kartı ilk odayı seçmeye yönlendirir.
export default function HomePage({ user, avatar, timer, rooms, joined = [], onGo, onEnter }) {
  const roomLabel = THEMES[loadMyRoom(user).theme]?.label ?? 'Kütüphane'
  const firstName = user.displayName.split(' ')[0]
  const open = rooms.filter((r) => r.access === 'public')
  // geri dönen kişiye son girdiği odalar, ilk gelene lobideki açık odalar
  const byId = new Map(rooms.map((r) => [r.id, r]))
  const recent = joined.map((j) => byId.get(j.id)).filter(Boolean)
  const listed = (recent.length ? recent : open).slice(0, ROOMS_SHOWN)
  const { minutes, pomodoros } = timer.stats
  const hasToday = minutes > 0 || pomodoros > 0
  const firstRoom = joined.length === 0
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
              Odama gir
            </button>
            <span className="home__timer" role="status">
              {timerText}
            </span>
          </div>
          {/* bugün henüz blok yoksa: kartlar arasında yüzen satır değil, Odama gir'in altında bir not */}
          {!hasToday && <p className="home__zero">{TODAY_COPY.zero(timer.presetInfo.focus)}</p>}
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
            <h2>{firstRoom ? ROOMS_COPY.first : ROOMS_COPY.rooms}</h2>
            {/* ikincil yol: sessiz düğme; sayfadaki tek dolgulu eylem "Odama gir" kalır */}
            <button type="button" className="quiet-btn home__lobby" onClick={() => onGo('lobi')}>
              {ROOMS_COPY.lobby}
              <Arrow />
            </button>
          </div>
          {firstRoom && (
            <p className="home__first">
              Lobideki herkese açık odalardan birine otur; avatarın boş bir masaya geçer, sayacın seninle gelir. Davet kodun varsa gizli odaya da Lobi’den katılırsın.
            </p>
          )}
          {listed.length > 0 && (
            <>
              <h3 id="sayfamOdalar" className="home__rooms-label">
                {recent.length ? ROOMS_COPY.recent : ROOMS_COPY.open}
              </h3>
              <ul className="home__room-list" aria-labelledby="sayfamOdalar">
                {listed.map((room) => (
                  <li key={room.id} className="home__room">
                    {/* satırın tamamı tek düğme; "Gir" çerçevesiz bir işaret olarak sağda durur */}
                    <button type="button" className="home__room-go" onClick={() => onEnter(room)} aria-label={ROOMS_COPY.enterLabel(room.name)}>
                      <RoomShot theme={room.theme} className="home__room-img" />
                      <span className="home__room-text">
                        <strong title={room.name}>{room.name}</strong>
                        <span>
                          <Dotted parts={[THEMES[room.theme].label, ROOMS_COPY.capacity(room.capacity)]} keep />
                        </span>
                        <RoomMates room={room} className="room-mates--small" />
                      </span>
                      <span className="home__room-cue" aria-hidden="true">
                        {ROOMS_COPY.enter}
                        <Arrow />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
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
