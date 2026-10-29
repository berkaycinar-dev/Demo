import { THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'

// Lobi: karşılama, hızlı katılma ve aktif odalar. Kartlarda 3D sahne yok; sayfada aynı anda tek
// WebGL bağlamı (Odam ya da oda oluşturma önizlemesi) çalışsın.
export default function LobbyPage({ rooms, onEnter, onCreate }) {
  const quick = rooms.find((r) => r.access === 'public')

  return (
    <>
      <section className="site-card site-welcome">
        <h1>Bugün de birlikte odaklanalım.</h1>
        <div className="site-actions">
          <button type="button" className="site-btn site-btn--primary" disabled={!quick} onClick={() => onEnter(quick)}>
            Hızlı odaya katıl
          </button>
          <button type="button" className="site-btn" onClick={onCreate}>
            Oda oluştur
          </button>
        </div>
      </section>

      <h2>Aktif odalar</h2>
      {rooms.length === 0 ? (
        <p className="site-muted">Henüz oda yok.</p>
      ) : (
        <ul className="site-rooms">
          {rooms.map((room) => (
            <li key={room.id} className="site-card site-room">
              <span className="site-muted">{THEMES[room.theme].label}</span>
              <h3>{room.name}</h3>
              <p className="site-muted">
                {room.capacity} kişilik · {ACCESS_LABELS[room.access]}
              </p>
              <button type="button" className="site-btn" onClick={() => onEnter(room)}>
                Gir
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
