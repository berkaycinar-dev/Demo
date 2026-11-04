import { useEffect, useState } from 'react'
import { DEFAULT_AVATAR } from '../avatars/options'
import { currentUser, logout } from './auth'
import AccountPage from './AccountPage'
import { LoginPage, RegisterPage } from './AuthPages'
import AvatarPage from './AvatarPage'
import { loadAvatar, saveAvatar } from './avatarStore'
import CreateRoomPage from './CreateRoomPage'
import HomePage from './HomePage'
import JoinRoomPage from './JoinRoomPage'
import LandingPage from './LandingPage'
import { LegalPage } from './LegalPages'
import MyRoomPage from './MyRoomPage'
import { forgetJoin, loadJoined, loadRooms, recordJoin, saveCreatedRoom } from './roomStore'
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
  { id: 'katil', label: 'Odaya katıl' },
  { id: 'olustur', label: 'Oda oluştur' },
]
// Oturum isteyen sayfalar (menüdekiler + girilen çok kişili oda) ve herkese açık sayfalar.
const APP_PAGES = new Set([...PAGES.map((p) => p.id), 'oda', 'hesap'])
const GUEST_PAGES = new Set(['giris', 'kayit'])
// Oturum olsun olmasın herkesin açabildiği sayfalar.
const PUBLIC_PAGES = new Set(['anasayfa', 'kosullar', 'gizlilik'])

const hashPage = () => window.location.hash.slice(1)

// İstenen sayfa oturuma göre düzeltilir: oturum yoksa uygulama sayfaları girişe, oturum varken
// giriş / kayıt sayfası Sayfam'a döner. Bilinmeyen adres varsayılan sayfaya gider.
function resolvePage(id, user) {
  if (APP_PAGES.has(id)) return user ? id : 'giris'
  if (PUBLIC_PAGES.has(id)) return id
  if (GUEST_PAGES.has(id)) return user ? 'sayfam' : id
  return user ? 'sayfam' : 'anasayfa'
}

export default function Site() {
  const [user, setUser] = useState(currentUser)
  const [requested, setRequested] = useState(hashPage)
  const [rooms, setRooms] = useState(loadRooms)
  const [joined, setJoined] = useState(() => (user ? loadJoined(user) : []))
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
  // Odaya giriş katılım geçmişine yazılır (kullanıcı başına).
  const enter = (room) => {
    if (user) setJoined(recordJoin(user, room.id))
    setCurrentId(room.id)
    go('oda')
  }
  const create = (room) => {
    saveCreatedRoom(room)
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
    setJoined(loadJoined(u))
    go('sayfam')
  }
  const signOut = () => {
    logout()
    setUser(null)
    setJoined([])
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
              go('katil')
            }}
            onBrowse={() => go('katil')}
          />
        )}
        {page === 'katil' && (
          <JoinRoomPage rooms={rooms} joined={joined} onEnter={enter} onForget={(id) => setJoined(forgetJoin(user, id))} onCreate={() => go('olustur')} />
        )}
        {page === 'olustur' && <CreateRoomPage onCreate={create} />}
        {page === 'avatar' && <AvatarPage avatar={avatar} onChange={changeAvatar} />}
        {page === 'hesap' && (
          <AccountPage
            user={user}
            onUserChange={(u) => {
              setUser(u)
              setJoined(loadJoined(u))
            }}
          />
        )}
        {(page === 'kosullar' || page === 'gizlilik') && <LegalPage kind={page} onGo={go} />}
      </main>

      {!focusMode && <SiteFooter user={user} pages={PAGES} onGo={go} isDark={isDark} />}
    </div>
  )
}
