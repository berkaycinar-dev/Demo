import { useEffect, useRef, useState } from 'react'
import { SIGNED_OUT_EVENT, errorText } from './api'
import { currentUser, logout } from './auth'
import AccountPage from './AccountPage'
import { ForgotPasswordPage, LoginPage, RegisterPage } from './AuthPages'
import AvatarPage from './AvatarPage'
import Icon from './AvatarIcons'
import { loadAvatar, saveAvatar } from './avatarStore'
import CreateRoomPage from './CreateRoomPage'
import HomePage from './HomePage'
import LandingPage from './LandingPage'
import LobbyPage from './LobbyPage'
import { LegalPage } from './LegalPages'
import MyRoomPage from './MyRoomPage'
import NotFoundPage from './NotFoundPage'
import { HEARTBEAT_MS, createRoom, enterRoom, exitRoom, fetchRooms, forgetJoin, heartbeat, joinRoom, loadJoined, recordJoin } from './roomStore'
import { SiteFooter, SiteHeader } from './SiteChrome'
import SoloRoomPage from './SoloRoomPage'
import useColorMode from './useColorMode'
import useDaypart from './useDaypart'
import usePomodoro from './usePomodoro'
import useStopwatch from './useStopwatch'
import { useGoals } from './goals'
import './theme.css'
import './site.css'
import './pages.css'

const DELETED_KEY = 'samedesk.account-deleted'
const DELETED_COPY = { note: 'Hesabın ve bu tarayıcıdaki kayıtların silindi.', close: 'Kapat' }

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
const GUEST_PAGES = new Set(['giris', 'kayit', 'sifremi-unuttum'])
// Oturum olsun olmasın herkesin açabildiği sayfalar.
const PUBLIC_PAGES = new Set(['anasayfa', 'kosullar', 'gizlilik'])

const hashPage = () => window.location.hash.slice(1)

// Sayfa değişince sekme başlığı ve ekran okuyucu duyurusu sayfanın başlığından (h1) gelir. Çeviride
// sıra değişebilsin diye kalıp tek yerde.
const NAV_COPY = {
  docTitle: (heading) => `${heading} · SameDesk`,
  brand: 'SameDesk',
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
const ROOM_KEY = 'samedesk.current-room'
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
  // Sunucudaki odalar; yalnızca oturum varken yüklenir. Misafire uydurma oda gösterilmez.
  const [rooms, setRooms] = useState([])
  // Sunucu hatası gibi kısa bildirimler (sayfanın üstünde, kapatılabilir).
  const [notice, setNotice] = useState('')
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
  // hesap silindikten sonra sayfa yeniden yüklenir (bellekteki sayaç / avatar da gider); ana sayfada bir
  // kez görünen not bunu söyler
  const [deletedNote, setDeletedNote] = useState(() => {
    try {
      const v = sessionStorage.getItem(DELETED_KEY)
      sessionStorage.removeItem(DELETED_KEY)
      return v === '1'
    } catch {
      return false
    }
  })
  const mainRef = useRef(null)
  const { pref: modePref, isDark, setPref: setModePref } = useColorMode()
  useDaypart()
  const timer = usePomodoro()
  // günlük / haftalık odak hedefi: Odam'da seçilir, Sayfam okur
  const [goals, setGoals] = useGoals(user)
  // Odam'daki kronometre: pomodoro gibi sayfadan bağımsız sayar; her tam dakika bugünkü odağa eklenir.
  // İkisi aynı anda çalışmaz: kronometre başlarken pomodoro duraklar, pomodoro başlarken kronometre.
  const stopwatch = useStopwatch({
    onMinutes: timer.addFocus,
    onStart: () => timer.running && timer.toggle(),
  })
  const { running: stopwatchRunning, pause: pauseStopwatch } = stopwatch
  useEffect(() => {
    if (timer.running && stopwatchRunning) pauseStopwatch()
    // yalnızca pomodoro başlayınca bakılır; kronometrenin başlaması onStart'ta pomodoroyu durdurur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.running])
  const page = resolvePage(requested, user)
  // Eski kayıtta avatar hâlâ varsayılan adı ("Sen") taşıyorsa sayfalarda hesabın görünen adı görünür:
  // Sayfam, Avatarım ve odalarda aynı ad.
  const myAvatar = user ? { ...avatar, name: user.displayName } : avatar
  const current = rooms.find((r) => r.id === currentId) ?? null

  // Oda sahnesinde kaydırma şeridi ayrılmaz (site.css); ayrılmayan genişlik --sbw olarak ölçülür, geniş
  // header o kadar sağdan içeri alınır. Sahne kaydırıyorsa (alçak pencere) şerit zaten dolu, --sbw 0.
  useEffect(() => {
    const root = document.documentElement
    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll'
    document.body.appendChild(probe)
    const bar = probe.offsetWidth - probe.clientWidth
    probe.remove()
    if (!bar) return undefined
    const sync = () => {
      const used = window.innerWidth - root.clientWidth
      root.style.setProperty('--sbw', `${Math.max(0, bar - used)}px`)
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(document.body)
    window.addEventListener('resize', sync)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [])

  // Oda listesi sunucudan: girişte, açılışta ve Lobi / Sayfam / Ana sayfaya her gelişte tazelenir.
  const listsRooms = Boolean(user) && (page === 'lobi' || page === 'sayfam' || page === 'oda' || page === 'anasayfa')
  useEffect(() => {
    if (!listsRooms) return undefined
    let stale = false
    fetchRooms()
      .then((list) => {
        if (!stale) setRooms(list)
      })
      .catch((e) => {
        if (!stale) setNotice(errorText(e, 'Odalar yüklenemedi.'))
      })
    return () => {
      stale = true
    }
  }, [listsRooms, page])

  // Token yenilenemezse (oturum sunucuda bitti) giriş sayfasına dönülür.
  useEffect(() => {
    const out = () => {
      setUser(null)
      setRooms([])
      setCurrentId(null)
      setNotice('Oturumun sona erdi; yeniden giriş yap.')
    }
    window.addEventListener(SIGNED_OUT_EVENT, out)
    return () => window.removeEventListener(SIGNED_OUT_EVENT, out)
  }, [])

  // Ortak odadayken sunucuda oturum açık tutulur: girişte açılır, düzenli sinyal gider, çıkınca kapanır.
  // Böylece odadaki gerçek kişiler (aktif üyeler) listelenebilir.
  const inRoomId = user && page === 'oda' && current ? current.id : null
  useEffect(() => {
    if (!inRoomId) return undefined
    enterRoom(inRoomId).catch((e) => setNotice(errorText(e, 'Odaya girilemedi.')))
    const beat = setInterval(() => heartbeat(inRoomId).catch(() => {}), HEARTBEAT_MS)
    return () => {
      clearInterval(beat)
      exitRoom(inRoomId).catch(() => {})
    }
  }, [inRoomId])

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
  // söyler. Açılışta yalnızca sekme başlığı yazılır (odak tarayıcıda kalır). Oda listesi sonradan
  // gelince (#oda'da yeniden yükleme) başlık odanın adıyla yenilenir: bağımlılıkta odanın adı da var.
  const currentName = current?.name
  useEffect(() => {
    const heading = navTarget ? focusPageStart(mainRef.current) : mainRef.current?.querySelector('h1')?.textContent.trim()
    document.title = heading ? NAV_COPY.docTitle(heading) : NAV_COPY.brand
    if (navTarget && heading) setAnnounce(heading)
  }, [page, navTarget, currentId, currentName])

  const go = (id) => {
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
    setRequested(id)
    setNavTarget(id)
    setReceipt(null)
    setAnnounce('')
    setFocusMode(false)
    window.scrollTo(0, 0)
  }
  // Odaya giriş: önce sunucuda üye olunur (zaten üyeysen bir şey değişmez), sonra girilir.
  // Giriş yapmamış ziyaretçi (ana sayfadaki örnek odalar) girişe yönlendirilir.
  const enter = async (room) => {
    if (!user) {
      go('giris')
      return
    }
    try {
      const fresh = await joinRoom(room, room.code)
      setRooms((list) => list.map((r) => (r.id === fresh.id ? { ...r, ...fresh, code: fresh.code ?? r.code } : r)))
    } catch (e) {
      const why = { ROOM_FULL: 'Oda dolu.', ROOM_NOT_FOUND: 'Oda bulunamadı ya da davet kodu yanlış.' }[e.code]
      setNotice(why ?? errorText(e, 'Odaya girilemedi.'))
      return
    }
    setJoined(recordJoin(user, room.id))
    setCurrentId(room.id)
    go('oda')
  }
  // Oda sunucuda oluşturulur; başarısızsa hata metni oluşturma sayfasına döner, başarılıysa null.
  const create = async (draft) => {
    try {
      const room = await createRoom(draft)
      setRooms((list) => [room, ...list.filter((r) => r.id !== room.id)])
      setJoined(recordJoin(user, room.id))
      setCurrentId(room.id)
      go('oda')
      return null
    } catch (e) {
      return errorText(e, '')
    }
  }
  const changeAvatar = (next) => {
    setAvatar(next)
    return saveAvatar(next)
  }
  const signedIn = (u) => {
    setUser(u)
    setJoined(loadJoined(u))
    setNotice('')
    go('sayfam')
  }
  const signOut = () => {
    logout()
    setUser(null)
    setJoined([])
    setCurrentId(null)
    setRooms([])
    go('anasayfa')
  }

  const roomPage = page === 'odam' || (page === 'oda' && current)
  const baseClass = roomPage ? 'site-stage-main' : page === 'anasayfa' ? 'site-landing-main' : GUEST_PAGES.has(page) ? 'site-main site-main--auth' : 'site-main'
  const mainClass = navTarget ? `${baseClass} site-enter` : baseClass
  // Odaya bir gezinmeyle gelindiyse varış anı oynar (yenilemede oynamaz).
  const arriving = navTarget === page

  return (
    <div className={`site${focusMode ? ' site--focus' : ''}`}>
      {!focusMode && <SiteHeader user={user} pages={PAGES} page={page} navPage={NAV_OF[page] ?? page} onGo={go} onLogout={signOut} modePref={modePref} onModeChange={setModePref} wide={Boolean(roomPage)} />}

      {/* Sayfa adı gezinmeden sonra burada duyurulur; aynı ad tekrar gelirse önce boşaltılır (go). */}
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <main key={page} ref={mainRef} className={mainClass}>
        {notice && (
          <div className="site-notice" role="alert">
            <span>{notice}</span>
            <button type="button" className="icon-btn" onClick={() => setNotice('')} aria-label={DELETED_COPY.close}>
              <Icon name="close" size={16} />
              <span className="icon-btn__tip" aria-hidden="true">
                {DELETED_COPY.close}
              </span>
            </button>
          </div>
        )}
        {page === 'anasayfa' && deletedNote && (
          <div className="site-notice" role="status">
            <span>{DELETED_COPY.note}</span>
            <button type="button" className="icon-btn" onClick={() => setDeletedNote(false)} aria-label={DELETED_COPY.close}>
              <Icon name="close" size={16} />
              <span className="icon-btn__tip" aria-hidden="true">
                {DELETED_COPY.close}
              </span>
            </button>
          </div>
        )}
        {page === 'anasayfa' && <LandingPage user={user} avatar={myAvatar} rooms={rooms} onGo={go} onEnter={enter} />}
        {page === 'giris' && <LoginPage onDone={signedIn} onGo={go} />}
        {page === 'kayit' && <RegisterPage onDone={signedIn} onGo={go} />}
        {page === 'sifremi-unuttum' && <ForgotPasswordPage onGo={go} />}
        {page === 'sayfam' && <HomePage user={user} avatar={myAvatar} timer={timer} goals={goals} rooms={rooms} joined={joined} onGo={go} onEnter={enter} />}
        {page === 'odam' && <SoloRoomPage user={user} avatar={myAvatar} timer={timer} stopwatch={stopwatch} goals={goals} onGoalsChange={setGoals} focusMode={focusMode} onFocusModeChange={setFocusMode} arriving={arriving} />}
        {page === 'oda' && (
          <MyRoomPage
            room={current}
            meId={user?.id}
            username={user?.username}
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
            username={user?.username}
            receipt={receipt}
            onCloseReceipt={() => setReceipt(null)}
            onEnter={enter}
            onForget={(id) => setJoined(forgetJoin(user, id))}
            onCreate={() => go('olustur')}
          />
        )}
        {page === 'olustur' && <CreateRoomPage onCreate={create} onBack={() => go('lobi')} isDark={isDark} />}
        {page === 'avatar' && <AvatarPage avatar={myAvatar} onChange={changeAvatar} onEnterRoom={() => go('odam')} />}
        {page === 'hesap' && (
          <AccountPage
            user={user}
            modePref={modePref}
            onModeChange={setModePref}
            onLogout={signOut}
            onDeleted={() => {
              try {
                sessionStorage.setItem(DELETED_KEY, '1')
              } catch {
                /* yok say */
              }
              window.location.hash = 'anasayfa'
              window.location.reload()
            }}
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
