import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import AvatarPreview from '../avatars/AvatarPreview'
import {
  DEFAULT_AVATAR,
  EAR_COVERING,
  HAIR_COLORS,
  HEADPHONE_HATS,
  OVER_HEAD,
  randomAvatar,
  resolveConflicts,
  sanitizeAvatar,
} from '../avatars/options'
import Icon from './AvatarIcons'
import AvatarPortrait from './AvatarPortrait'
import CharacterMenu from './CharacterMenu'
import { loadPresets, savePresets } from './avatarStore'
import useImageState from './useImageState'

// icon: AvatarIcons adı; poz ve çalışma türü önizlemenin üstündeki HUD'da ikon + etiketle seçilir
const MODES = [
  { id: 'focus', label: 'Odakta', icon: 'focus' },
  { id: 'break', label: 'Molada', icon: 'break' },
  { id: 'away', label: 'Uzakta', icon: 'away' },
  { id: 'walk', label: 'Yürüyüş', icon: 'walk' },
]
// çalışma türü yalnızca masada oturan pozlarda (Odakta, Uzakta) anlamlı
const SEATED = ['focus', 'away']
const ACTIVITIES = [
  { id: 'read', label: 'Kitap', icon: 'read' },
  { id: 'type', label: 'Bilgisayar', icon: 'type' },
]
// Ortak renkleri kullanan takılı öğeler (avatars/model.js ile aynı kural). Boşsa o renk alanı gizlenir.
const ACC_PHONES = ['gaming', 'cat', 'retro', 'neck']
const ACC_NECK = { scarf: 'atkı', bowtie: 'papyon', tie: 'kravat' }
const accessoryColorUsers = (a) =>
  [ACC_PHONES.includes(a.headphones) && 'kulaklık', ACC_NECK[a.neck], a.wrist === 'watch' && 'saat kayışı'].filter(Boolean)
const metalUsersOf = (a) =>
  [
    a.hat === 'crown' && 'taç',
    a.glasses === 'monocle' && 'monokl',
    a.earrings !== 'none' && !EAR_COVERING.includes(a.hairStyle) && !OVER_HEAD.includes(a.headphones) && 'küpe',
    a.neck === 'necklace' && 'kolye',
    a.wrist === 'watch' && 'saat kasası',
    a.wrist === 'bracelet' && 'bileklik',
  ].filter(Boolean)
// "kulaklık, atkı ve saat kayışı"
const listOf = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ve ${items.at(-1)}`)
const HISTORY_LIMIT = 50
// görünen ad sınırı (harf sayısı); sanitizeAvatar da aynı sınırı kullanır
// Zar: önizleme bu aralıklarla (ms, giderek yavaşlar) rastgele görünümlerden geçer; sonuncusu kalır.
const ROLL_STEPS = [55, 60, 70, 85, 105, 135, 170]
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
// Kombin 1'e, 2'ye, 3'e
const SUFFIX = ["'e", "'ye", "'e"]
const sameLook = (a, b) => JSON.stringify({ ...a, name: '' }) === JSON.stringify({ ...b, name: '' })

// Seçenek görselleri: scripts/render-avatar-thumbs.mjs ile avatar modelinden bir kez üretilir
// her beden için ayrı (public/avatar-thumbs/<tür>-<id>-<beden>.webp; sakal ve bıyık yalnızca male).
// thumbs: o alanın tür adı (hair, hat, glasses, beard, mustache); body: avatarın bedeni.
const thumbOf = (kind, id, body) => `${import.meta.env.BASE_URL}avatar-thumbs/${kind}-${id}-${body === 'female' ? 'female' : 'male'}.webp`

// Seçenek görseli: yüklenirken iskelet, yüklenemezse çizgi ikonlu yer tutucu (kırık resim simgesi yok).
function OptionThumb({ src }) {
  const [state, imgProps] = useImageState()
  return (
    <span className="tile__thumb" data-state={state}>
      {state === 'error' ? <Icon name="image" size={20} /> : <img src={src} alt="" width="56" height="56" loading="lazy" decoding="async" {...imgProps} />}
    </span>
  )
}

// Kombin 1'in, 2'nin, 3'ün
const OF = ["'in", "'nin", "'ün"]
// Bildirim süreleri (ms): üstüne yazınca "Geri al" 5 sn durur; fare ya da odak üstündeyken süre işlemez.
const NOTICE_MS = { saved: 2000, same: 2000, overwrote: 5000, restored: 2000, error: 6000 }
const noticeText = ({ kind, slot }) =>
  ({
    saved: `Kombin ${slot + 1}${SUFFIX[slot]} kaydedildi`,
    same: `Kombin ${slot + 1} zaten bu görünüm`,
    overwrote: `Kombin ${slot + 1}${OF[slot]} üstüne yazıldı`,
    restored: `Kombin ${slot + 1} eski hâline döndü`,
    error: 'Kaydedilemedi: tarayıcı depolaması dolu ya da kapalı. Kombin yalnızca bu oturumda duracak.',
  })[kind]

// Kombinler şeridi: üç slot. Portreye dokununca kayıtlı kombin giyilir (geri alınabilir); slotun kaydet ikonu
// şu anki görünümü o slota yazar. Dolu slota yazınca 5 sn'lik "Geri al" çıkar; kayıt ve üstüne yazma ayrı
// mesajla duyurulur. Durum metni başlık satırında durur, yalnızca bir işlemden sonra görünür.
function Wardrobe({ avatar, onLoad }) {
  const [presets, setPresets] = useState(loadPresets)
  // son işlem: { kind, slot, prev (üstüne yazılan kombin), id }; id her işlemde artar, metin yeniden belirir
  const [notice, setNotice] = useState(null)
  const [hold, setHold] = useState(false)
  useEffect(() => {
    if (!notice || hold) return
    const t = setTimeout(() => setNotice(null), NOTICE_MS[notice.kind])
    return () => clearTimeout(t)
  }, [notice, hold])
  const write = (next, kind, slot, prev = null) => {
    setPresets(next)
    const ok = savePresets(next)
    setNotice((n) => ({ kind: ok ? kind : 'error', slot, prev, id: (n?.id ?? 0) + 1 }))
    if (kind !== 'overwrote') setHold(false)
  }
  const wear = (i) => onLoad(sanitizeAvatar({ ...presets[i], name: avatar.name }))
  const save = (i) => {
    const old = presets[i]
    if (old && sameLook(old, avatar)) {
      setNotice((n) => ({ kind: 'same', slot: i, id: (n?.id ?? 0) + 1 }))
      return
    }
    write(presets.map((p, k) => (k === i ? { ...avatar } : p)), old ? 'overwrote' : 'saved', i, old)
  }
  const restore = () => {
    const { slot, prev } = notice
    write(presets.map((p, k) => (k === slot ? prev : p)), 'restored', slot)
  }
  const justSaved = notice && (notice.kind === 'saved' || notice.kind === 'overwrote' || notice.kind === 'same') ? notice.slot : null
  const holdOn = { onMouseEnter: () => setHold(true), onMouseLeave: () => setHold(false), onFocus: () => setHold(true), onBlur: () => setHold(false) }
  return (
    <section className="wardrobe" aria-labelledby="wardrobe-title">
      <div className="wardrobe__head">
        <h2 id="wardrobe-title" className="wardrobe__title">Kombinler</h2>
        {/* canlı bölge sabit kalır; içindeki metin değişince yeniden kurulup belirir. Hata ayrı, ısrarlı
            (alert) bölgede duyurulur. */}
        <span className="wardrobe__status" role="status" data-kind={notice?.kind}>
          <span key={notice?.id}>{notice && notice.kind !== 'error' && noticeText(notice)}</span>
        </span>
        {notice?.kind === 'overwrote' && (
          <button type="button" className="link-btn wardrobe__undo" onClick={restore} {...holdOn}>
            Geri al
          </button>
        )}
      </div>
      <p className="wardrobe__hint">Kaydet simgesi şu anki görünümü bir kombine saklar. Kombini seçince hepsini birden giyersin.</p>
      <p className="form-error wardrobe__error" role="alert">
        {notice?.kind === 'error' && noticeText(notice)}
      </p>
      <ul className="wardrobe__slots">
        {presets.map((p, i) => {
          const worn = p && sameLook(p, avatar)
          return (
            <li key={i} className="wardrobe__slot" data-worn={worn || undefined} data-empty={!p || undefined}>
              <button type="button" className="wardrobe__wear" disabled={!p} aria-pressed={p ? worn : undefined} onClick={() => wear(i)} title={p ? 'Bu kombini giy' : undefined}>
                {p ? (
                  <AvatarPortrait avatar={p} />
                ) : (
                  <span className="wardrobe__ghost" aria-hidden="true">
                    <Icon name="body" size={20} />
                  </span>
                )}
                <span className="wardrobe__name">
                  Kombin {i + 1}
                  {(!p || worn) && <small>{p ? 'giyili' : 'boş'}</small>}
                </span>
              </button>
              <button
                type="button"
                className="wardrobe__save"
                data-done={justSaved === i || undefined}
                onClick={() => save(i)}
                aria-label={p ? `Kombin ${i + 1}${OF[i]} üstüne yaz` : `Kombin ${i + 1}${SUFFIX[i]} kaydet`}
                title={p ? 'Şu anki görünümü bunun üstüne yaz (5 sn geri alınabilir)' : 'Şu anki görünümü buraya kaydet'}
              >
                <Icon name={justSaved === i ? 'check' : 'save'} size={18} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Telefonda (≤900 px) poz ve kombinler alt sayfada: önizleme üstte görünür kalır, her seçim anında
// sahnede görülür. Yerel <dialog>: odak hapsi, Esc ve dışarı dokununca kapanma tarayıcıdan gelir.
function PoseSheet({ open, onClose, mode, setMode, activity, setActivity, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  const seated = SEATED.includes(mode)
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="pose-sheet-title" aria-describedby="pose-sheet-note" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="sheet__head">
        <h2 id="pose-sheet-title" className="sheet__title">Poz ve kombinler</h2>
        <button type="button" className="sheet__close" onClick={onClose} aria-label="Kapat">
          <Icon name="close" />
        </button>
      </div>
      <p id="pose-sheet-note" className="sheet__note">Önizleme pozu: odadaki durumunu değiştirmez</p>
      <div className="segmented segmented--fill" role="group" aria-label="Poz" style={{ '--count': MODES.length }}>
        {MODES.map((m) => (
          <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
            <Icon name={m.icon} size={16} />
            {m.label}
          </button>
        ))}
      </div>
      <div className="segmented segmented--fill sheet__sub" role="group" aria-label="Çalışma türü" style={{ '--count': ACTIVITIES.length }} data-off={!seated || undefined} inert={!seated} aria-hidden={!seated || undefined}>
        {ACTIVITIES.map((a) => (
          <button key={a.id} type="button" aria-pressed={activity === a.id} onClick={() => setActivity(a.id)}>
            <Icon name={a.icon} size={16} />
            {a.label}
          </button>
        ))}
      </div>
      {children}
    </dialog>
  )
}

// Ekran genişliği eşiği (CSS'teki @media ile aynı); değişince yeniden çizer.
const COMPACT = '(max-width: 900px)'
function useCompact() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(COMPACT)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(COMPACT).matches,
  )
}

// Sayfa kaydırılırken true, kaydırma SCROLL_IDLE_MS durunca false. Telefonda yapışkan önizlemenin üstündeki
// kontrol barları bu sürede saydamlaşır: menüde gezinirken avatar görünür kalır. Kapalıyken (geniş ekran)
// dinlemez.
const SCROLL_IDLE_MS = 700
function useScrolling(enabled) {
  const [scrolling, setScrolling] = useState(false)
  useEffect(() => {
    if (!enabled) return undefined
    let timer = 0
    let on = false
    const onScroll = () => {
      if (!on) {
        on = true
        setScrolling(true)
      }
      clearTimeout(timer)
      timer = setTimeout(() => {
        on = false
        setScrolling(false)
      }, SCROLL_IDLE_MS)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [enabled])
  return enabled && scrolling
}

// Otomatik kayıt duyurusu (ekran okuyucu): her değişiklikte değil, değişiklikler SAVE_ANNOUNCE_MS
// durulunca bir kez; son yazışın sonucunu söyler. Metin önce boşaltılır ki aynı cümle yeniden okunsun.
const SAVE_ANNOUNCE_MS = 1200
const SAVE_TEXT = { ok: 'Kaydedildi', failed: 'Kaydedilemedi: tarayıcı depolaması dolu ya da kapalı. Avatar yalnızca bu oturumda duracak.' }
function useSaveAnnouncer() {
  const [message, setMessage] = useState('')
  // Görünür damga: her kayıtta yeniden oynar (id), kendiliğinden söner.
  const [stamp, setStamp] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const announce = (ok) => {
    clearTimeout(timer.current)
    setMessage('')
    setStamp({ id: Date.now(), ok: ok !== false })
    timer.current = setTimeout(() => setMessage(ok === false ? SAVE_TEXT.failed : SAVE_TEXT.ok), SAVE_ANNOUNCE_MS)
  }
  return [message, announce, stamp]
}

// Avatarım: avatar atölyesi. Solda canlı 3D önizleme (poz ve çalışma türü seçilir; kamera seçilen
// bölgeye yaklaşır), geri al / ileri al ve kombin slotları; sağda karakter menüsü (CharacterMenu). Her
// değişiklik hemen kaydedilir; odalarda "Sen" olarak bu avatar oturur.
// fallbackName: boş ad bırakılınca kullanılan ad (hesabın görünen adı).
// Avatarın adı ayrı tutulmaz: hesabın görünen adıdır (Hesap > Profil'den değişir).
export default function AvatarPage({ avatar, onChange, onEnterRoom }) {
  const [mode, setMode] = useState('focus')
  const [activity, setActivity] = useState('read')
  const [zone, setZone] = useState('full')
  // etkin menü satırı saç satırıysa başlık önizlemede gizlenir (saç görünsün); kullanıcı düğmeyle geri açabilir
  const [menuHair, setMenuHair] = useState(false)
  const [hatShown, setHatShown] = useState(false)
  // telefonda poz ve kombinler alt sayfada
  const compact = useCompact()
  const scrolling = useScrolling(compact)
  const [sheetOpen, setSheetOpen] = useState(false)
  // zar: karışma sürerken önizlemede geçici görünüm; sonuç tek adımda kaydedilir (tek geri alma)
  const [roll, setRoll] = useState(null)
  const rollTimers = useRef([])
  useEffect(() => () => rollTimers.current.forEach(clearTimeout), [])
  const previewRef = useRef(null)
  // alt sayfa önizlemenin altındaki alanı kaplar: önce önizleme yapışkan konumuna (ekranın üstüne) gelir
  const openSheet = () => {
    const top = previewRef.current?.getBoundingClientRect().top ?? 0
    if (top > 0) window.scrollBy({ top, behavior: 'instant' })
    setSheetOpen(true)
  }
  // her artışta önizlemenin döndürmesi sıfırlanır (kontrol barındaki Sıfırla)
  const [resetKey, setResetKey] = useState(0)
  const [history, setHistory] = useState({ past: [], future: [] })

  const [saveMessage, announceSave, saveStamp] = useSaveAnnouncer()
  // onChange kaydeder; false dönerse depolama yazılamadı
  const save = (next) => announceSave(onChange(next))
  const commit = (next) => {
    if (JSON.stringify(next) === JSON.stringify(avatar)) return
    setHistory((h) => ({ past: [...h.past, avatar].slice(-HISTORY_LIMIT), future: [] }))
    save(next)
  }
  const undo = () => {
    const prev = history.past.at(-1)
    if (!prev) return
    setHistory((h) => ({ past: h.past.slice(0, -1), future: [avatar, ...h.future] }))
    save(prev)
  }
  const redo = () => {
    const next = history.future[0]
    if (!next) return
    setHistory((h) => ({ past: [...h.past, avatar], future: h.future.slice(1) }))
    save(next)
  }
  // Ctrl+Z / Ctrl+Y (ve Ctrl+Shift+Z); yazı alanındayken tarayıcının kendi geri alması çalışır
  const keys = useRef(null)
  useEffect(() => {
    keys.current = { undo, redo }
  })
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return
      if (e.target.closest?.('input, textarea, [contenteditable="true"]')) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) keys.current.undo()
      else if (k === 'y' || (k === 'z' && e.shiftKey)) keys.current.redo()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const set = (key) => (value) => commit(resolveConflicts({ ...avatar, [key]: value }, key))
  const rollDice = () => {
    if (roll) return
    const final = randomAvatar(Math.random, avatar.name)
    if (reducedMotion()) {
      commit(final)
      return
    }
    const ms = ROLL_STEPS.reduce((a, b) => a + b, 0)
    const shuffle = { start: performance.now(), ms }
    let at = 0
    rollTimers.current = ROLL_STEPS.map((step, i) => {
      at += step
      const look = i === ROLL_STEPS.length - 1 ? final : randomAvatar(Math.random, avatar.name)
      return setTimeout(() => setRoll({ shuffle, look }), at - step)
    })
    rollTimers.current.push(
      setTimeout(() => {
        commit(final)
        setRoll(null)
      }, at),
    )
  }
  // saçı örten başlık ya da kafa üstü kulaklık: menüde saç satırındayken önizlemede gizlenir
  const hasHeadwear = avatar.hat !== 'none' || OVER_HEAD.includes(avatar.headphones)
  const hairFocus = menuHair
  const hideHeadwear = hairFocus && hasHeadwear && !hatShown
  const seated = SEATED.includes(mode)
  const earsCovered = EAR_COVERING.includes(avatar.hairStyle)
  const overHead = OVER_HEAD.includes(avatar.headphones)
  const earNote = avatar.earrings === 'none' ? null : earsCovered ? 'saç kulakları örtüyor' : overHead ? 'kulaklık örtüyor' : null
  const phoneNote = avatar.headphones === 'earbuds' && earsCovered ? 'saç kulakları örtüyor' : HEADPHONE_HATS.includes(avatar.hat) ? null : 'kafa üstü modeller seçilirse başlık çıkar'
  const hair = HAIR_COLORS.find((h) => h.id === avatar.hairColor)
  // Otomatik kaş: doğal saç renginde saçla aynı, diğerlerinde doğal koyu. Not kuralı ve şu anki sonucu söyler.
  const browNote = avatar.brows === 'auto' ? (hair?.natural ? 'Otomatik: doğal saç renginde kaş saçla aynı olur' : 'Otomatik: bu saç renginde kaş doğal koyu olur') : null
  const outfit = avatar.outfit
  const replacedNote = 'tek parça seçili; seçilirse tek parça çıkar'
  const replaced = outfit === 'dress' || outfit === 'onesie' ? replacedNote : null
  // ortak renkler: yalnızca o rengi kullanan bir öğe takılıysa görünür; not hangilerinin boyandığını söyler
  const accUsers = accessoryColorUsers(avatar)
  const metalUsers = metalUsersOf(avatar)


  return (
    <div className="avatar-workshop">
      <div className="avatar-workshop__head">
        <div>
          <h1>Avatar atölyesi</h1>
          <p className="site-muted">
            Burada yaptığın avatar odalarda “Sen” olarak oturur. Değişiklikler hemen kaydedilir.
            {saveStamp && (
              <span key={saveStamp.id} className="save-stamp" data-ok={saveStamp.ok ? '' : undefined} aria-hidden="true">
                {saveStamp.ok && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}
                {saveStamp.ok ? SAVE_TEXT.ok : SAVE_TEXT.failed}
              </span>
            )}
          </p>
          <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
            {saveMessage}
          </p>
        </div>
        <div className="avatar-workshop__tools">
          {onEnterRoom && (
            <button type="button" className="site-btn avatar-workshop__enter" onClick={onEnterRoom}>
              Bu hâliyle odama gir
            </button>
          )}
        </div>
      </div>
      <div className="create avatar-page">
        <section className="create-preview" aria-label="Önizleme" ref={previewRef}>
          <div className="room-frame avatar-page__preview" data-scrolling={scrolling || undefined}>
            <AvatarPreview avatar={roll?.look ?? avatar} shuffle={roll?.shuffle ?? null} mode={mode} activity={activity} focus={zone} hideHeadwear={hideHeadwear} hint={false} resetKey={resetKey} />
            {/* yüzen kontrol barları. Sol üst: poz ve altında çalışma türü (oturmayan pozda yeri korunur,
                gizlenir). Sağ üst: geri al / ileri al ve saç satırında başlık gizle. Alt: ipuçları. */}
            {!compact && (
            <div className="hud-stack hud-stack--start">
              <div className="hud" role="group" aria-label="Poz">
                {MODES.map((m) => (
                  <button key={m.id} type="button" className="hud__opt" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
                    <Icon name={m.icon} size={16} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
              <div className="hud hud--sub" role="group" aria-label="Çalışma türü" data-off={!seated || undefined} inert={!seated} aria-hidden={!seated || undefined}>
                {ACTIVITIES.map((a) => (
                  <button key={a.id} type="button" className="hud__opt" aria-pressed={activity === a.id} onClick={() => setActivity(a.id)}>
                    <Icon name={a.icon} size={16} />
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
            )}
            <div className="hud-stack hud-stack--end">
              <div className="hud" role="toolbar" aria-label="Geçmiş">
                {/* simge düğmeleri: fareyle üstüne gelince ya da klavye odağında ipucu balonu, dokunmatikte
                    (hover: none) etiket simgenin altında hep görünür. Kısayol yalnızca balonda. */}
                <button type="button" className="hud__icon" onClick={undo} disabled={!history.past.length} aria-label="Geri al" aria-keyshortcuts="Control+Z">
                  <Icon name="undo" />
                  <span className="hud__label" aria-hidden="true">
                    Geri al<kbd className="hud__key">Ctrl+Z</kbd>
                  </span>
                </button>
                <button type="button" className="hud__icon" onClick={redo} disabled={!history.future.length} aria-label="İleri al" aria-keyshortcuts="Control+Y">
                  <Icon name="redo" />
                  <span className="hud__label" aria-hidden="true">
                    İleri al<kbd className="hud__key">Ctrl+Y</kbd>
                  </span>
                </button>
              </div>
              <div className="hud">
                {compact && (
                  <button type="button" className="hud__text hud__pose" onClick={openSheet} aria-haspopup="dialog" title="Poz ve kombinler">
                    <Icon name={MODES.find((m) => m.id === mode)?.icon ?? 'focus'} size={16} />
                    Poz
                  </button>
                )}
                <button type="button" className="hud__icon hud__dice" onClick={rollDice} data-rolling={roll ? '' : undefined} aria-label="Rastgele avatar">
                  <Icon name="dice" />
                  <span className="hud__label" aria-hidden="true">
                    Rastgele
                  </span>
                </button>
              </div>
              {hairFocus && hasHeadwear && (
                <div className="hud">
                  <button
                    type="button"
                    className="hud__icon"
                    aria-pressed={hideHeadwear}
                    aria-label="Başlığı ve kulaklığı gizle"
                    onClick={() => setHatShown(!hatShown)}
                  >
                    <Icon name={hideHeadwear ? 'hatOff' : 'hat'} />
                    <span className="hud__label" aria-hidden="true">
                      {hideHeadwear ? 'Başlık gizli' : 'Başlığı gizle'}
                    </span>
                  </button>
                </div>
              )}
            </div>
            <div className="hud hud--bottom">
              <span className="hud__tip">
                <Icon name="drag" size={16} />
                Sürükle: döndür
              </span>
              <span className="hud__tip">
                <Icon name="tap" size={16} />
                Tıkla: selam
              </span>
              <span className="hud__divider" aria-hidden="true" />
              <button type="button" className="hud__text" onClick={() => setResetKey((k) => k + 1)} title="Görünümü sıfırla (çift tık)">
                <Icon name="reset" size={16} />
                Sıfırla
              </button>
            </div>
          </div>
          {compact ? (
            <PoseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} mode={mode} setMode={setMode} activity={activity} setActivity={setActivity}>
              <Wardrobe avatar={avatar} onLoad={(next) => commit(next)} />
            </PoseSheet>
          ) : (
            <Wardrobe avatar={avatar} onLoad={(next) => commit(next)} />
          )}
        </section>

        <div className="site-card create-form avatar-page__editor avatar-page__editor--menu">
          <CharacterMenu
            avatar={avatar}
            set={set}
            notes={{
              brow: browNote,
              topReplaced: replaced,
              bottomReplaced: outfit === 'none' ? null : replacedNote,
              phone: phoneNote,
              ear: earNote,
              acc: accUsers.length ? listOf(accUsers) : null,
              metal: metalUsers.length ? listOf(metalUsers) : null,
            }}
            kit={{ OptionThumb, thumbOf }}
            onRow={({ zone: z, hair: h }) => {
              setZone(z)
              if (h !== menuHair) setHatShown(false)
              setMenuHair(h)
            }}
          />

          {/* sessiz sıfırlama: geri al ile döner; rastgele önizlemedeki zarda */}
          <div className="avatar-page__actions">
            <button type="button" className="quiet-link" onClick={() => commit({ ...DEFAULT_AVATAR, name: avatar.name })}>
              Varsayılana dön
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
