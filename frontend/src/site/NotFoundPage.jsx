import RoomShot from './RoomShot'

// Bilinmeyen adres (#yanlis-sayfa): boş bir sayfa ya da sessizce ana sayfaya dönmek yerine ne olduğunu
// söyler ve iki yol sunar. Görsel: kimsenin oturmadığı boş bir oda.
const NOT_FOUND_COPY = {
  title: 'Bu oda boş',
  text: (path) => `“${path}” adında bir sayfa yok. Bağlantı eski ya da yanlış yazılmış olabilir.`,
  home: 'Ana sayfaya dön',
  homeSignedIn: 'Sayfama dön',
  lobby: 'Lobiye git',
}

export default function NotFoundPage({ path, user, onGo }) {
  return (
    <section className="site-card not-found" aria-labelledby="notFoundTitle">
      <RoomShot theme="cabin" className="not-found__shot" />
      <div className="not-found__text">
        <h1 id="notFoundTitle">{NOT_FOUND_COPY.title}</h1>
        <p className="site-muted">{NOT_FOUND_COPY.text(path)}</p>
        <div className="site-actions">
          <button type="button" className="site-btn site-btn--primary" onClick={() => onGo(user ? 'sayfam' : 'anasayfa')}>
            {user ? NOT_FOUND_COPY.homeSignedIn : NOT_FOUND_COPY.home}
          </button>
          {user && (
            <button type="button" className="site-btn" onClick={() => onGo('lobi')}>
              {NOT_FOUND_COPY.lobby}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
