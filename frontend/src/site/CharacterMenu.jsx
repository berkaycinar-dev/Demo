import { useId, useRef, useState } from 'react'
import {
  BEARDS,
  BODIES,
  BOTTOMS,
  BROW_MODES,
  CLOTH_COLORS,
  EYE_COLORS,
  FOOTWEAR,
  GLASSES,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  HEADPHONES,
  METALS,
  MUSTACHES,
  NECKWEAR,
  NO_BANGS,
  OUTFITS,
  SHOE_COLORS,
  SKIN_TONES,
  TOPS,
  WRISTWEAR,
  EARRINGS,
} from '../avatars/options'
import Icon from './AvatarIcons'
import './CharacterMenu.css'

// DENEME: oyunlardaki karakter yaratma ekranı gibi ok seçimli menü. Eski sekme düzeni (AvatarPage) yerinde
// durur; atölyedeki "Düzen" anahtarı ikisi arasında geçer. Beğenilmezse bu dosya, CharacterMenu.css ve
// AvatarPage'deki LAYOUTS anahtarı silinerek geri dönülür.
//
// Her kategori bir satır: ◀ seçili öğe ▶. ←/→ öğeyi değiştirir (uçlarda döner), ↑/↓ kategoriler arasında
// gezer, Home/End ilk/son öğe, Enter "Hepsi" ızgarasını açar, Esc kapatır. Dokunmatikte değer alanında yatay
// kaydırma da öğe değiştirir. Satıra gelince kamera o satırın bölgesine yaklaşır (zone).

const ON_OFF = [
  { id: 'on', label: 'Var' },
  { id: 'off', label: 'Yok' },
]
const FIXED_COLOR_HATS = ['none', 'crown', 'viking', 'flowers']
const SECOND_HAIR = [{ id: 'none', label: 'Yok', color: null }, ...HAIR_COLORS]
// yatay kaydırma eşiği (px): bundan kısa hareket dokunma sayılır
const SWIPE = 32

// Satırlar: key avatar alanı; color: renk satırı (ızgara yerine renk noktaları); thumbs: seçenek görseli
// türü; hair: saç satırı (önizlemede başlık gizlenir); get/put: alan değeri seçenek kimliği değilse.
function menuSections(a, n) {
  const male = a.body !== 'female'
  const outfit = a.outfit
  const hatLabel = HATS.find((h) => h.id === a.hat)?.label ?? 'Başlık'
  return [
    {
      title: 'Beden',
      rows: [
        { key: 'body', label: 'Beden', zone: 'full', options: BODIES },
        { key: 'skin', label: 'Ten rengi', zone: 'face', options: SKIN_TONES, color: true },
        { key: 'eyes', label: 'Göz rengi', zone: 'face', options: EYE_COLORS, color: true },
      ],
    },
    {
      title: 'Saç ve yüz',
      rows: [
        { key: 'hairStyle', label: 'Saç modeli', zone: 'face', options: HAIR_STYLES, thumbs: 'hair', hair: true },
        {
          key: 'bangs',
          label: 'Kahkül',
          zone: 'face',
          options: ON_OFF,
          hair: true,
          get: (v) => (v ? 'on' : 'off'),
          put: (id) => id === 'on',
          disabled: NO_BANGS.includes(a.hairStyle),
          note: NO_BANGS.includes(a.hairStyle) ? 'bu saç modelinde yok' : null,
        },
        { key: 'hairColor', label: male ? 'Saç ve sakal rengi' : 'Saç rengi', zone: 'face', options: HAIR_COLORS, color: true, hair: true },
        { key: 'hairColor2', label: 'İkinci saç rengi', zone: 'face', options: SECOND_HAIR, color: true, hair: true, note: 'parlama ve uçlar' },
        { key: 'brows', label: 'Kaş', zone: 'face', options: BROW_MODES, hair: true, note: n.brow },
        a.brows === 'custom' && { key: 'browColor', label: 'Kaş rengi', zone: 'face', options: HAIR_COLORS, color: true, hair: true },
        male && { key: 'beard', label: 'Sakal', zone: 'face', options: BEARDS, thumbs: 'beard', hair: true },
        male && { key: 'mustache', label: 'Bıyık', zone: 'face', options: MUSTACHES, thumbs: 'mustache', hair: true },
      ],
    },
    {
      title: 'Kıyafet',
      rows: [
        { key: 'top', label: 'Üst', zone: 'upper', options: TOPS, note: n.topReplaced },
        { key: 'topColor', label: outfit === 'dress' ? 'Elbise rengi' : outfit === 'onesie' ? 'Tulum rengi' : 'Üst rengi', zone: 'upper', options: CLOTH_COLORS, color: true },
        { key: 'bottom', label: 'Alt', zone: 'legs', options: BOTTOMS, note: n.bottomReplaced },
        { key: 'bottomColor', label: outfit === 'overalls' ? 'Salopet rengi' : 'Alt rengi', zone: 'legs', options: CLOTH_COLORS, color: true },
        { key: 'outfit', label: 'Tek parça', zone: 'full', options: OUTFITS },
        { key: 'footwear', label: 'Ayakkabı', zone: 'feet', options: FOOTWEAR },
        { key: 'shoes', label: 'Ayakkabı rengi', zone: 'feet', options: SHOE_COLORS, color: true },
      ],
    },
    {
      title: 'Aksesuar',
      rows: [
        { key: 'hat', label: 'Başlık', zone: 'hat', options: HATS, thumbs: 'hat' },
        !FIXED_COLOR_HATS.includes(a.hat) && { key: 'hatColor', label: `${hatLabel} rengi`, zone: 'hat', options: CLOTH_COLORS, color: true },
        { key: 'glasses', label: 'Gözlük', zone: 'face', options: GLASSES, thumbs: 'glasses' },
        { key: 'headphones', label: 'Kulaklık', zone: a.headphones === 'neck' ? 'chest' : 'face', options: HEADPHONES, note: n.phone },
        { key: 'earrings', label: 'Küpe', zone: 'face', options: EARRINGS, note: n.ear },
        { key: 'neck', label: 'Boyun', zone: 'chest', options: NECKWEAR },
        { key: 'wrist', label: 'Bilek', zone: 'wrist', options: WRISTWEAR },
        n.acc && { key: 'accessoryColor', label: 'Aksesuar rengi', zone: 'upper', options: CLOTH_COLORS, color: true, note: n.acc },
        n.metal && { key: 'metal', label: 'Metal', zone: 'upper', options: METALS, color: true, note: n.metal },
      ],
    },
  ].map((s) => ({ ...s, rows: s.rows.filter(Boolean) }))
}

// avatar: şu anki görünüm. set(key)(value): AvatarPage'in çakışma çözen yazıcısı. notes: satır notları ve
// ortak renk kullanıcıları (AvatarPage hesaplar). kit: AvatarPage'deki ızgara ve renk bileşenleri ("Hepsi").
// onRow({ zone, hair }): satıra gelinince kamera ve başlık gizleme için. lead: menünün başındaki alan (ad).
export default function CharacterMenu({ avatar, set, notes, kit, onRow, lead }) {
  const { Choices, Swatches, OptionThumb, thumbOf } = kit
  const sections = menuSections(avatar, notes)
  const rows = sections.flatMap((s) => s.rows)
  // etkin satır; satır kaybolursa (ör. beden değişince sakal) aynı sıradaki satıra düşülür
  const [current, setCurrent] = useState({ key: rows[0].key, index: 0 })
  let active = rows.findIndex((r) => r.key === current.key)
  if (active < 0) active = Math.min(current.index, rows.length - 1)
  const [openKey, setOpenKey] = useState(null)
  // son değişiklik: değer etiketi ve ok o yönden kısa bir itme ile gelir; n her basışta artar
  const [hit, setHit] = useState({ key: null, dir: 0, n: 0 })
  const wells = useRef({})
  const swipe = useRef(null)
  const hintId = useId()
  const baseId = useId()

  const valueOf = (r) => (r.get ? r.get(avatar[r.key]) : avatar[r.key])
  const write = (r, id) => set(r.key)(r.put ? r.put(id) : id)
  // kamera yalnızca satır (ya da satırın bölgesi) değişince döner; aynı satırda ok basmak bölgeyi korur
  const reported = useRef(null)
  const activate = (r) => {
    const at = `${r.key}:${r.zone}`
    if (reported.current !== at) onRow({ zone: r.zone, hair: !!r.hair })
    reported.current = at
    setCurrent({ key: r.key, index: rows.indexOf(r) })
  }
  const step = (r, dir) => {
    activate(r)
    if (r.disabled) return
    const list = r.options
    const i = Math.max(0, list.findIndex((o) => o.id === valueOf(r)))
    write(r, list[(i + dir + list.length) % list.length].id)
    setHit((h) => ({ key: r.key, dir, n: h.n + 1 }))
  }
  const jump = (r, id, dir = 0) => {
    write(r, id)
    setHit((h) => ({ key: r.key, dir, n: h.n + 1 }))
  }
  const focusRow = (i) => {
    const r = rows[(i + rows.length) % rows.length]
    activate(r)
    setOpenKey(null)
    wells.current[r.key]?.focus()
    wells.current[r.key]?.scrollIntoView({ block: 'nearest' })
  }
  const toggle = (r) => {
    activate(r)
    setOpenKey(openKey === r.key ? null : r.key)
  }
  const onWellKey = (e, r, i) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const act = {
      ArrowLeft: () => step(r, -1),
      ArrowRight: () => step(r, 1),
      ArrowUp: () => focusRow(i - 1),
      ArrowDown: () => focusRow(i + 1),
      Home: () => !r.disabled && jump(r, r.options[0].id, -1),
      End: () => !r.disabled && jump(r, r.options.at(-1).id, 1),
      Enter: () => !r.disabled && toggle(r),
      ' ': () => !r.disabled && toggle(r),
      Escape: () => setOpenKey(null),
    }[e.key]
    if (!act) return
    e.preventDefault()
    act()
  }
  // dokunmatik: değer alanında yatay kaydırma; dikey hareket sayfayı kaydırır (touch-action: pan-y)
  const onDown = (e) => {
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onUp = (e, r) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(e.clientY - s.y)) step(r, dx < 0 ? 1 : -1)
    else activate(r)
  }
  // ızgaradan seçince kapanır, odak satıra döner
  const pick = (r) => (id) => {
    const list = r.options
    const from = list.findIndex((o) => o.id === valueOf(r))
    jump(r, id, Math.sign(list.findIndex((o) => o.id === id) - from))
    setOpenKey(null)
    wells.current[r.key]?.focus()
  }

  return (
    <div className="cmenu" role="group" aria-label="Karakter menüsü">
      <p id={hintId} className="cmenu__keys">
        <span>
          <kbd>←</kbd>
          <kbd>→</kbd> değiştir
        </span>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> kategori
        </span>
        <span>
          <kbd>Enter</kbd> hepsi
        </span>
      </p>
      {lead}
      {sections.map((s) => (
        <section key={s.title} className="cmenu__section">
          <h2 className="opt-section__title cmenu__title">{s.title}</h2>
          <ul className="cmenu__rows">
            {s.rows.map((r) => {
              const i = rows.indexOf(r)
              const on = i === active
              const list = r.options
              const at = Math.max(0, list.findIndex((o) => o.id === valueOf(r)))
              const cur = list[at]
              const open = openKey === r.key
              const panelId = `${baseId}-${r.key}`
              const labelId = `${panelId}-label`
              const pressed = hit.key === r.key ? hit : null
              return (
                <li key={r.key} className="cmenu__row" data-active={on || undefined} data-off={r.disabled || undefined}>
                  <div className="cmenu__label">
                    <span id={labelId} className="cmenu__name">
                      {r.label}
                    </span>
                    {r.note && <span className="cmenu__note">{r.note}</span>}
                  </div>
                  <div className="cmenu__picker">
                    <button type="button" className="cmenu__arrow" tabIndex={-1} disabled={r.disabled} aria-label={`Önceki ${r.label.toLocaleLowerCase('tr')}`} onClick={() => step(r, -1)}>
                      <span key={pressed?.dir === -1 ? pressed.n : 'l'} className="cmenu__ico" data-hit={pressed?.dir === -1 || undefined}>
                        <Icon name="chevronLeft" size={20} />
                      </span>
                    </button>
                    {/* değer alanı: satırın tek sekme durağı (roving). Yatay kaydırıcı rolü ←/→ ile değeri okutur;
                        ↑/↓ burada kategori değiştirir (ipucu aria-describedby ile okunur). */}
                    <div
                      ref={(el) => (wells.current[r.key] = el)}
                      className="cmenu__well"
                      role="slider"
                      tabIndex={on ? 0 : -1}
                      aria-labelledby={labelId}
                      aria-describedby={hintId}
                      aria-orientation="horizontal"
                      aria-valuemin={1}
                      aria-valuemax={list.length}
                      aria-valuenow={at + 1}
                      aria-valuetext={`${cur.label}, ${at + 1} / ${list.length}`}
                      aria-disabled={r.disabled || undefined}
                      onKeyDown={(e) => onWellKey(e, r, i)}
                      onFocus={() => activate(r)}
                      onPointerDown={onDown}
                      onPointerUp={(e) => onUp(e, r)}
                      onPointerCancel={() => (swipe.current = null)}
                    >
                      <span key={pressed ? pressed.n : 'v'} className="cmenu__value" data-dir={pressed?.dir || undefined}>
                        {r.color && <span className={cur.color ? 'cmenu__chip' : 'cmenu__chip cmenu__chip--none'} style={cur.color ? { background: cur.color } : undefined} aria-hidden="true" />}
                        {r.thumbs && (
                          <span className="cmenu__thumb" aria-hidden="true">
                            <OptionThumb key={`${cur.id}-${avatar.body}`} src={thumbOf(r.thumbs, cur.id, avatar.body)} />
                          </span>
                        )}
                        <span className="cmenu__text">
                          <span className="cmenu__label-value">{cur.label}</span>
                          <span className="cmenu__count" aria-hidden="true">
                            {at + 1}/{list.length}
                          </span>
                        </span>
                      </span>
                    </div>
                    <button type="button" className="cmenu__arrow" tabIndex={-1} disabled={r.disabled} aria-label={`Sonraki ${r.label.toLocaleLowerCase('tr')}`} onClick={() => step(r, 1)}>
                      <span key={pressed?.dir === 1 ? pressed.n : 'r'} className="cmenu__ico" data-hit={pressed?.dir === 1 || undefined}>
                        <Icon name="chevronRight" size={20} />
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    className="cmenu__all"
                    tabIndex={on || open ? 0 : -1}
                    disabled={r.disabled}
                    aria-expanded={open}
                    aria-controls={open ? panelId : undefined}
                    onClick={() => toggle(r)}
                  >
                    <Icon name={open ? 'close' : 'grid'} size={16} />
                    {open ? 'Kapat' : 'Hepsi'}
                    <span className="visually-hidden">: {r.label}</span>
                  </button>
                  {open && (
                    <div
                      id={panelId}
                      className="cmenu__panel"
                      onKeyDown={(e) => {
                        if (e.key !== 'Escape') return
                        e.stopPropagation()
                        setOpenKey(null)
                        wells.current[r.key]?.focus()
                      }}
                    >
                      {r.color ? (
                        <Swatches label={r.label} options={list} value={valueOf(r)} onChange={pick(r)} />
                      ) : (
                        <Choices label={r.label} bare thumbs={r.thumbs} body={avatar.body} options={list} value={valueOf(r)} onChange={pick(r)} />
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
