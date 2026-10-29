import { useEffect, useState } from 'react'
import CreateRoomPage from './CreateRoomPage'
import LobbyPage from './LobbyPage'
import MyRoomPage from './MyRoomPage'
import './site.css'

// Odaların sitede nasıl duracağını denemek için sade test arayüzü. Görsel tasarım ayrıca yapılacak;
// burada yalnızca sayfa akışı var. Sayfa adres çubuğundaki #lobi, #olustur... ile seçilir.
const PAGES = [
  { id: 'lobi', label: 'Lobi' },
  { id: 'odam', label: 'Odam' },
  { id: 'avatar', label: 'Avatarım' },
  { id: 'olustur', label: 'Oda oluştur' },
  { id: 'siralama', label: 'Sıralama' },
]

// Lobi boş görünmesin diye örnek odalar. Oluşturulan odalar yalnızca bellekte tutulur.
const SAMPLE_ROOMS = [
  { id: 'sample-1', name: 'Merkez Kütüphane · Okuma Salonu', theme: 'library', capacity: 7, access: 'public' },
  { id: 'sample-2', name: 'Kod Lab · Açık Ofis', theme: 'office', capacity: 7, access: 'public' },
  { id: 'sample-3', name: 'Ormanda Sessizlik', theme: 'treehouse', capacity: 4, access: 'invite' },
]

const pageFromHash = () => {
  const id = window.location.hash.slice(1)
  return PAGES.some((p) => p.id === id) ? id : 'lobi'
}

export default function Site() {
  const [page, setPage] = useState(pageFromHash)
  const [rooms, setRooms] = useState(SAMPLE_ROOMS)
  const [currentId, setCurrentId] = useState(null)
  const current = rooms.find((r) => r.id === currentId) ?? null

  // Geri / ileri düğmeleri ve elle değiştirilen adres.
  useEffect(() => {
    const sync = () => setPage(pageFromHash())
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const go = (id) => {
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
    setPage(id)
  }
  const enter = (room) => {
    setCurrentId(room.id)
    go('odam')
  }
  const create = (room) => {
    setRooms((list) => [room, ...list])
    enter(room)
  }

  return (
    <div className="site">
      <header className="site-header">
        <strong className="site-brand">Odakhane</strong>
        <nav className="site-nav" aria-label="Ana menü">
          {PAGES.map((p) => (
            <button key={p.id} type="button" aria-current={page === p.id ? 'page' : undefined} onClick={() => go(p.id)}>
              {p.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="site-main">
        {page === 'lobi' && <LobbyPage rooms={rooms} onEnter={enter} onCreate={() => go('olustur')} />}
        {page === 'odam' && (
          <MyRoomPage
            room={current}
            onLeave={() => {
              setCurrentId(null)
              go('lobi')
            }}
            onBrowse={() => go('lobi')}
          />
        )}
        {page === 'olustur' && <CreateRoomPage onCreate={create} />}
        {page === 'avatar' && <Placeholder title="Avatarım" />}
        {page === 'siralama' && <Placeholder title="Sıralama" />}
      </main>
    </div>
  )
}

function Placeholder({ title }) {
  return (
    <section>
      <h1>{title}</h1>
      <p className="site-muted">Bu bölüm henüz hazır değil.</p>
    </section>
  )
}
