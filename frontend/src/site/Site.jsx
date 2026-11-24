import { useEffect, useRef, useState } from 'react'
import { DEFAULT_AVATAR } from '../avatars/options'
import { currentUser, logout } from './auth'
import AccountPage from './AccountPage'
import { LoginPage, RegisterPage } from './AuthPages'
import AvatarPage from './AvatarPage'
import { loadAvatar, saveAvatar } from './avatarStore'
import CreateRoomPage from './CreateRoomPage'
import HomePage from './HomePage'
import LandingPage from './LandingPage'
import LobbyPage from './LobbyPage'
import { LegalPage } from './LegalPages'
import MyRoomPage from './MyRoomPage'
import NotFoundPage from './NotFoundPage'
import { forgetJoin, loadJoined, loadRooms, recordJoin, saveCreatedRoom } from './roomStore'
import { SiteFooter, SiteHeader } from './SiteChrome'
import SoloRoomPage from './SoloRoomPage'
import useColorMode from './useColorMode'
import useDaypart from './useDaypart'
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
  { id: 'lobi', label: 'Lobi' },
]
// Oturum isteyen sayfalar: menüdekiler, Lobi'nin alt sayfaları (oda oluştur, girilen oda) ve hesap.
const APP_PAGES = new Set([...PAGES.map((p) => p.id), 'olustur', 'oda', 'hesap'])
// Menüde hangi sekmenin seçili görüneceği: oda oluşturma Lobi'nin alt sayfası. Girilen ortak oda (#oda)
// menüdeki hiçbir sekme değildir; orada hiçbiri seçili görünmez ("Lobi" ya da "Odam" sanılmasın).
const NAV_OF = { olustur: 'lobi' }
// Eski adresler: Odaya katıl sayfası Lobi'ye taşındı.
const MOVED = { katil: 'lobi' }
const GUEST_PAGES = new Set(['giris', 'kayit'])
// Oturum olsun olmasın herkesin açabildiği sayfalar.
const PUBLIC_PAGES = new Set(['anasayfa', 'kosullar', 'gizlilik'])

const hashPage = () => window.location.hash.slice(1)

// Sayfa değişince sekme başlığı ve ekran okuyucu duyurusu sayfanın başlığından (h1) gelir. Çeviride
// sıra değişebilsin diye kalıp tek yerde.
const NAV_COPY = {
  docTitle: (heading) => `${heading} · Odakhane`,
  brand: 'Odakhane',
}

// Yeni sayfada odaklanacak öğe: önce sayfanın kendi seçtiği (data-autofocus, ör. odadan çıkış fişi),
// yoksa sayfa başlığı. Başlık klavyeyle gezilecek bir öğe değildir; yalnızca programla odak alır.
function focusPageStart(main) {
  const target = main?.querySelector('[data-autofocus]') ?? main?.querySelector('h1')
  if (!target) return null
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  return main.querySelector('h1')?.textContent.trim() || null
}

// Girilen oda yenilemede kaybolmasın: kimliği saklanır, açılışta oda listesinde varsa ona dönülür.
const ROOM_KEY = 'odakhane.current-room'
function loadCurrentId() {
  try {
    const id = JSON.parse(localStorage.getItem(ROOM_KEY) ?? 'null')?.id
    return typeof id === 'string' && id ? id : null
  } catch {
    return null
  }
}

// İstenen sayfa oturuma göre düzeltilir: oturum yoksa uygulama sayfaları girişe, oturum varken
// giriş / kayıt sayfası Sayfam'a döner. Boş adres varsayılan sayfaya, bilinmeyen adres "bulunamadı"
// sayfasına gider (sessizce yönlendirilmez; adres çubuğunda yazılan kalır).
const NOT_FOUND = 'bulunamadi'
function resolvePage(requestedId, user) {
  const id = MOVED[requestedId] ?? requestedId
  if (APP_PAGES.has(id)) return user ? id : 'giris'
  if (PUBLIC_PAGES.has(id)) return id
  if (GUEST_PAGES.has(id)) return user ? 'sayfam' : id
  if (id) return NOT_FOUND
  return user ? 'sayfam' : 'anasayfa'
}

export default function Site() {
  const [user, setUser] = useState(currentUser)
  const [requested, setRequested] = useState(hashPage)
  const [rooms, setRooms] = useState(loadRooms)
  const [joined, setJoined] = useState(() => (user ? loadJoined(user) : []))
  const [currentId, setCurrentId] = useState(() => (user ? loadCurrentId() : null))
  const [avatar, setAvatar] = useState(loadAvatar)
  const [focusMode, setFocusMode] = useState(false)
  // Kullanıcının gezinerek geldiği sayfa. Açılışta (yenileme) null: sayfa geçiş hareketi, varış
  // levhası ve odak taşıma yalnızca bir gezinmeden sonra olur.
  const [navTarget, setNavTarget] = useState(null)
  // Odadan çıkış fişi: { room, blocks, minutes, stay } | null. Lobi'de görünür; başka sayfaya gidince kalkar.
  const [receipt, setReceipt] = useState(null)
  const [announce, setAnnounce] = useState('')
  const mainRef = useRef(null)
  const { isDark, toggle: toggleMode } = useColorMode()
  useDaypart()
  const timer = usePomodoro()
  const page = resolvePage(requested, user)
  // Eski kayıtta avatar hâlâ varsayılan adı ("Sen") taşıyorsa sayfalarda hesabın görünen adı görünür:
  // Sayfam, Avatarım ve odalarda aynı ad.
  const myAvatar = user && avatar.name === DEFAULT_AVATAR.name ? { ...avatar, name: user.displayName } : avatar
  const current = rooms.find((r) => r.id === currentId) ?? null

  // Geri / ileri düğmeleri ve elle değiştirilen adres.
  useEffect(() => {
    const sync = () => {
      setRequested(hashPage())
      setNavTarget(hashPage())
      setReceipt(null)
      setFocusMode(false)
    }
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  useEffect(() => {
    try {
      if (currentId) localStorage.setItem(ROOM_KEY, JSON.stringify({ id: currentId }))
      else localStorage.removeItem(ROOM_KEY)
    } catch {
      /* yok say: oda yalnızca bu oturumda hatırlanır */
    }
  }, [currentId])

  // Düzeltilen sayfa adres çubuğuna da yazılır (geçmişe yeni kayıt eklemeden).
  useEffect(() => {
    if (page !== NOT_FOUND && hashPage() !== page) window.history.replaceState(null, '', `#${page}`)
  }, [page])

  // Gezinmeden sonra: odak yeni sayfanın başına taşınır, sekme başlığı ve canlı bölge sayfanın adını
  // söyler. Açılışta yalnızca sekme başlığı yazılır (odak tarayıcıda kalır).
  useEffect(() => {
    const heading = navTarget ? focusPageStart(mainRef.current) : mainRef.current?.querySelector('h1')?.textContent.trim()
    document.title = heading ? NAV_COPY.docTitle(heading) : NAV_COPY.brand
    if (navTarget && heading) setAnnounce(heading)
  }, [page, navTarget, currentId])

  const go = (id) => {
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
    setRequested(id)
    setNavTarget(id)
    setReceipt(null)
    setAnnounce('')
    setFocusMode(false)
    window.scrollTo(0, 0)
  }
  // Odaya giriş katılım geçmişine yazılır (kullanıcı başına).
  const enter = (room) => {
    if (user) setJoined(recordJoin(user, room.id))
    setCurrentId(room.id)
    go('oda')
  }
  // Oda kaydedilemezse girilmez; neden oluşturma sayfasına döner ('full' | 'blocked' | 'failed').
  // keepForSession: kullanıcı yine de girmek isterse oda yalnızca bu oturumda (sekme kapanınca kaybolur).
  const create = (room, { keepForSession = false } = {}) => {
    try {
      const failed = keepForSession ? null : saveCreatedRoom(room)
      if (failed) return failed
      setRooms((list) => [room, ...list.filter((r) => r.id !== room.id)])
      enter(room)
      return null
    } catch {
      return 'failed'
    }
  }
  const changeAvatar = (next) => {
    setAvatar(next)
    return saveAvatar(next)
  }
  const signedIn = (u) => {
    // Avatar hâlâ varsayılan adı taşıyorsa görünen adı alır (kalıcı yazılır).
    if (avatar.name === DEFAULT_AVATAR.name) changeAvatar({ ...avatar, name: u.displayName })
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
  const baseClass = roomPage ? 'site-stage-main' : page === 'anasayfa' ? 'site-landing-main' : page === 'giris' || page === 'kayit' ? 'site-main site-main--auth' : 'site-main'
  const mainClass = navTarget ? `${baseClass} site-enter` : baseClass
  // Odaya bir gezinmeyle gelindiyse varış anı oynar (yenilemede oynamaz).
  const arriving = navTarget === page

  return (
    <div className={`site${focusMode ? ' site--focus' : ''}`}>
      {!focusMode && <SiteHeader user={user} pages={PAGES} page={page} navPage={NAV_OF[page] ?? page} onGo={go} onLogout={signOut} isDark={isDark} onToggleMode={toggleMode} wide={Boolean(roomPage)} />}

      {/* Sayfa adı gezinmeden sonra burada duyurulur; aynı ad tekrar gelirse önce boşaltılır (go). */}
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <main key={page} ref={mainRef} className={mainClass}>
        {page === 'anasayfa' && <LandingPage user={user} avatar={myAvatar} rooms={rooms} onGo={go} onEnter={enter} isDark={isDark} onToggleMode={toggleMode} />}
        {page === 'giris' && <LoginPage onDone={signedIn} onGo={go} />}
        {page === 'kayit' && <RegisterPage onDone={signedIn} onGo={go} />}
        {page === 'sayfam' && <HomePage user={user} avatar={myAvatar} timer={timer} rooms={rooms} joined={joined} onGo={go} onEnter={enter} />}
        {page === 'odam' && <SoloRoomPage user={user} avatar={myAvatar} timer={timer} focusMode={focusMode} onFocusModeChange={setFocusMode} arriving={arriving} />}
        {page === 'oda' && (
          <MyRoomPage
            room={current}
            avatar={myAvatar}
            timer={timer}
            focusMode={focusMode}
            onFocusModeChange={setFocusMode}
            arriving={arriving}
            onLeave={(session) => {
              setCurrentId(null)
              go('lobi')
              setReceipt({ room: current, ...session })
            }}
            onBrowse={() => go('lobi')}
          />
        )}
        {page === 'lobi' && (
          <LobbyPage
            rooms={rooms}
            joined={joined}
            receipt={receipt}
            onCloseReceipt={() => setReceipt(null)}
            onEnter={enter}
            onForget={(id) => setJoined(forgetJoin(user, id))}
            onCreate={() => go('olustur')}
          />
        )}
        {page === 'olustur' && <CreateRoomPage onCreate={create} onBack={() => go('lobi')} isDark={isDark} />}
        {page === 'avatar' && <AvatarPage avatar={myAvatar} onChange={changeAvatar} onEnterRoom={() => go('odam')} fallbackName={user?.displayName} />}
        {page === 'hesap' && (
          <AccountPage
            user={user}
            isDark={isDark}
            onToggleMode={toggleMode}
            onLogout={signOut}
            onUserChange={(u) => {
              setUser(u)
              setJoined(loadJoined(u))
            }}
          />
        )}
        {(page === 'kosullar' || page === 'gizlilik') && <LegalPage kind={page} onGo={go} />}
        {page === NOT_FOUND && <NotFoundPage path={requested} user={user} onGo={go} />}
      </main>

      {/* Oda sayfalarında alt bilgi yok: oda header'ın altındaki alanın tamamını kaplar, sayfa kaymaz
          (oda geri planda durur). Yasal bağlantılar diğer bütün sayfaların altında. */}
      {!focusMode && !roomPage && <SiteFooter onGo={go} />}
    </div>
  )
}
