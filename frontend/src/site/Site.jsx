import { useEffect, useState } from 'react'
import { DEFAULT_AVATAR } from '../avatars/options'
import { currentUser, logout } from './auth'
import { LoginPage, RegisterPage } from './AuthPages'
import AvatarPage from './AvatarPage'
import { loadAvatar, saveAvatar } from './avatarStore'
import CreateRoomPage from './CreateRoomPage'
import HomePage from './HomePage'
import LandingPage from './LandingPage'
import MyRoomPage from './MyRoomPage'
import { SiteFooter, SiteHeader } from './SiteChrome'
import SoloRoomPage from './SoloRoomPage'
import useColorMode from './useColorMode'
import usePomodoro from './usePomodoro'
import './theme.css'
import './site.css'
import './pages.css'

// Sitenin kabuğu: sayfa akışı, oturum ve sitenin tasarım çerçevesi.
// Sayfa adres çubuğundaki #sayfam, #odam... ile seçilir.

// Giriş yapınca menüde görünen sayfalar.
const PAGES = [
  { id: 'sayfam', label: 'Sayfam' },
  { id: 'odam', label: 'Odam' },
  { id: 'avatar', label: 'Avatarım' },
  { id: 'olustur', label: 'Oda oluştur' },
]
// Oturum isteyen sayfalar (menüdekiler + girilen çok kişili oda) ve herkese açık sayfalar.
const APP_PAGES = new Set([...PAGES.map((p) => p.id), 'oda'])
const GUEST_PAGES = new Set(['anasayfa', 'giris', 'kayit'])

// Örnek odalar; oluşturulan odalar yalnızca bellekte tutulur. Gizli odalara davet koduyla girilir.
const SAMPLE_ROOMS = [
  { id: 'sample-1', name: 'Merkez Kütüphane · Okuma Salonu', theme: 'library', capacity: 7, access: 'public' },
  { id: 'sample-2', name: 'Kod Lab · Açık Ofis', theme: 'office', capacity: 7, access: 'public' },
  { id: 'sample-4', name: 'Şömine Başında Uzun Bloklar', theme: 'cabin', capacity: 5, access: 'public' },
  { id: 'sample-3', name: 'Ormanda Sessizlik', theme: 'treehouse', capacity: 4, access: 'invite', code: 'ORMAN-2741' },
]

const hashPage = () => window.location.hash.slice(1)

// İstenen sayfa oturuma göre düzeltilir: oturum yoksa uygulama sayfaları girişe, oturum varken
// giriş / kayıt sayfası Sayfam'a döner. Bilinmeyen adres varsayılan sayfaya gider.
function resolvePage(id, user) {
  if (APP_PAGES.has(id)) return user ? id : 'giris'
  if (GUEST_PAGES.has(id)) return user && id !== 'anasayfa' ? 'sayfam' : id
  return user ? 'sayfam' : 'anasayfa'
}

export default function Site() {
  const [user, setUser] = useState(currentUser)
  const [requested, setRequested] = useState(hashPage)
  const [rooms, setRooms] = useState(SAMPLE_ROOMS)
  const [currentId, setCurrentId] = useState(null)
  const [avatar, setAvatar] = useState(loadAvatar)
  const [focusMode, setFocusMode] = useState(false)
  const { isDark, toggle: toggleMode } = useColorMode()
  const timer = usePomodoro()
  const page = resolvePage(requested, user)
  const current = rooms.find((r) => r.id === currentId) ?? null

  // Geri / ileri düğmeleri ve elle değiştirilen adres.
  useEffect(() => {
    const sync = () => {
      setRequested(hashPage())
      setFocusMode(false)
    }
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  // Düzeltilen sayfa adres çubuğuna da yazılır (geçmişe yeni kayıt eklemeden).
  useEffect(() => {
    if (hashPage() !== page) window.history.replaceState(null, '', `#${page}`)
  }, [page])

  const go = (id) => {
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
    setRequested(id)
    setFocusMode(false)
    window.scrollTo(0, 0)
  }
  const enter = (room) => {
    setCurrentId(room.id)
    go('oda')
  }
  const create = (room) => {
    setRooms((list) => [room, ...list])
    enter(room)
  }
  const changeAvatar = (next) => {
    setAvatar(next)
    saveAvatar(next)
  }
  const signedIn = (u, isNew) => {
    // Yeni hesapta avatar hâlâ varsayılan adı taşıyorsa görünen adı alır.
    if (isNew && avatar.name === DEFAULT_AVATAR.name) changeAvatar({ ...avatar, name: u.displayName })
    setUser(u)
    go('sayfam')
  }
  const signOut = () => {
    logout()
    setUser(null)
    setCurrentId(null)
    go('anasayfa')
  }

  const roomPage = page === 'odam' || (page === 'oda' && current)
  const mainClass = roomPage ? 'site-stage-main' : page === 'anasayfa' ? 'site-landing-main' : page === 'giris' || page === 'kayit' ? 'site-main site-main--auth' : 'site-main'

  return (
    <div className={`site${focusMode ? ' site--focus' : ''}`}>
      {!focusMode && <SiteHeader user={user} pages={PAGES} page={page} onGo={go} onLogout={signOut} isDark={isDark} onToggleMode={toggleMode} />}

      <main className={mainClass}>
        {page === 'anasayfa' && <LandingPage user={user} onGo={go} />}
        {page === 'giris' && <LoginPage onDone={(u) => signedIn(u, false)} onGo={go} />}
        {page === 'kayit' && <RegisterPage onDone={(u) => signedIn(u, true)} onGo={go} />}
        {page === 'sayfam' && <HomePage user={user} avatar={avatar} timer={timer} rooms={rooms} onGo={go} onEnter={enter} />}
        {page === 'odam' && <SoloRoomPage user={user} avatar={avatar} timer={timer} focusMode={focusMode} onFocusModeChange={setFocusMode} />}
        {page === 'oda' && (
          <MyRoomPage
            room={current}
            avatar={avatar}
            timer={timer}
            focusMode={focusMode}
            onFocusModeChange={setFocusMode}
            onLeave={() => {
              setCurrentId(null)
              go('olustur')
            }}
            onBrowse={() => go('olustur')}
          />
        )}
        {page === 'olustur' && <CreateRoomPage rooms={rooms} onCreate={create} onEnter={enter} />}
        {page === 'avatar' && <AvatarPage avatar={avatar} onChange={changeAvatar} />}
      </main>

      {!focusMode && <SiteFooter user={user} pages={PAGES} onGo={go} isDark={isDark} />}
    </div>
  )
}
