import { Fragment, useId, useLayoutEffect, useRef, useState } from 'react'
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

// Karakter menüsü: avatar atölyesinin düzenleyicisi. Her kategori bir satır; satırda o kategorinin bütün
// seçenekleri yatay kaydırılabilen bir şeritte durur (görselli alanlarda voxel görsel, renklerde nokta,
// diğerlerinde ad). Seçili seçenek dolgu ve halkayla belirgindir, seçilince şeritte görünür alana kayar.
//
// Klavye: şerit satırın tek sekme durağıdır (roving). ←/→ seçeneği değiştirir (uçlarda döner), ↑/↓ satırlar
// arasında gezer, Home/End ilk/son seçenek. Satıra gelince kamera o satırın bölgesine yaklaşır (zone).

const ON_OFF = [
  { id: 'on', label: 'Var' },
  { id: 'off', label: 'Yok' },
]
const FIXED_COLOR_HATS = ['none', 'crown', 'viking', 'flowers']
// Klavye kullanımı: şeritlere aria-describedby ile okunur, ekranda yer kaplamaz (ok tuşları
// radiogroup'un olağan davranışı).
const KEYS_HINT = 'Sol ve sağ ok tuşları seçeneği değiştirir, yukarı ve aşağı ok tuşları kategoriler arasında gezer; Home ve End ilk ve son seçeneğe gider.'
const SECOND_HAIR = [{ id: 'none', label: 'Yok', color: null }, ...HAIR_COLORS]

// Satırlar: key avatar alanı; color: renk satırı (nokta); thumbs: seçenek görseli türü; hair: saç satırı
// (önizlemede başlık gizlenir); get/put: alan değeri seçenek kimliği değilse; group: bölüm içi alt başlık.
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
    // Aksesuar: takıldığı yere göre iki grup (baş / boyun ve bilek). Renk satırları yalnızca o rengi kullanan
    // bir öğe takılıyken görünür: başlık rengi başlığın, ortak renkler ise kullandığı öğelerin grubunda.
    {
      title: 'Aksesuar',
      rows: [
        { key: 'hat', label: 'Başlık', zone: 'hat', options: HATS, thumbs: 'hat', group: 'Başta' },
        !FIXED_COLOR_HATS.includes(a.hat) && { key: 'hatColor', label: `${hatLabel} rengi`, zone: 'hat', options: CLOTH_COLORS, color: true, group: 'Başta' },
        { key: 'glasses', label: 'Gözlük', zone: 'face', options: GLASSES, thumbs: 'glasses', group: 'Başta' },
        { key: 'headphones', label: 'Kulaklık', zone: a.headphones === 'neck' ? 'chest' : 'face', options: HEADPHONES, note: n.phone, group: 'Başta' },
        { key: 'earrings', label: 'Küpe', zone: 'face', options: EARRINGS, note: n.ear, group: 'Başta' },
        { key: 'neck', label: 'Boyun', zone: 'chest', options: NECKWEAR, group: 'Boyun ve bilek' },
        { key: 'wrist', label: 'Bilek', zone: 'wrist', options: WRISTWEAR, group: 'Boyun ve bilek' },
        n.acc && { key: 'accessoryColor', label: 'Kumaş', zone: 'upper', options: CLOTH_COLORS, color: true, note: n.acc, group: 'Renkler' },
        n.metal && { key: 'metal', label: 'Metal', zone: 'upper', options: METALS, color: true, note: n.metal, group: 'Renkler' },
      ],
    },
  ].map((s) => ({ ...s, rows: s.rows.filter(Boolean) }))
}

// Şerit seçeneğinin yüzü: görsel, renk noktası ya da ad. "Yok" görselli alanlarda boş kare yerine ikonla
// gösterilir (görseli neredeyse boş bir kafa).
function Face({ r, o, body, OptionThumb, thumbOf }) {
  if (r.color) return <span className={o.color ? 'cstrip__dot' : 'cstrip__dot cstrip__dot--none'} style={o.color ? { background: o.color } : undefined} aria-hidden="true" />
  if (r.thumbs)
    return (
      <span className="cstrip__thumb" aria-hidden="true">
        {o.id === 'none' ? (
          <span className="tile__thumb cstrip__none">
            <Icon name="none" size={20} />
          </span>
        ) : (
          <OptionThumb key={body} src={thumbOf(r.thumbs, o.id, body)} />
        )}
      </span>
    )
  return o.label
}

// Yatay şerit: seçili seçenek değişince (ve ilk açılışta) şeridin içinde görünür alana kayar; sayfa kaymaz.
function Strip({ r, value, innerRef, children, ...props }) {
  const ref = useRef(null)
  const first = useRef(true)
  // seçili öğe şeridin ortasına: konum şeride göre ölçülür (offsetLeft şeride değil üst öğeye göredir)
  const center = (instant) => {
    const strip = ref.current
    const sel = strip?.querySelector('[aria-checked="true"]')
    if (!sel) return
    const a = sel.getBoundingClientRect()
    const b = strip.getBoundingClientRect()
    const left = strip.scrollLeft + a.left - b.left - (b.width - a.width) / 2
    strip.scrollTo({ left, behavior: instant ? 'instant' : 'smooth' })
  }
  useLayoutEffect(() => {
    center(first.current || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false))
    first.current = false
  }, [value])
  // şerit genişliği değişince (kaydırma çubuğu belirince, pencere daralınca) seçili öğe görünür kalır
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => center(true))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return (
    <div
      ref={(el) => {
        ref.current = el
        innerRef(el)
      }}
      className={`cstrip cstrip--${r.color ? 'color' : r.thumbs ? 'thumb' : 'text'}`} {...props}>
      {children}
    </div>
  )
}

// avatar: şu anki görünüm. set(key)(value): AvatarPage'in çakışma çözen yazıcısı. notes: satır notları ve
// ortak renk kullanıcıları (AvatarPage hesaplar). kit: seçenek görseli (OptionThumb, thumbOf).
// onRow({ zone, hair }): satıra gelinince kamera ve başlık gizleme için. lead: menünün başındaki alan (ad).
// Oklar yalnızca şeridi sığmayan satırlarda çizilir (seçeneklerin hepsi zaten görünüyorsa ok gereksiz).
// Ölçü satırın seçici alanına göre yapılır; o alanın genişliği oklardan bağımsızdır, döngü olmaz.
function useOverflowingStrips(rootRef, strips) {
  const [keys, setKeys] = useState(() => new Set())
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const measure = () => {
      const next = new Set()
      for (const [key, strip] of Object.entries(strips.current)) {
        const picker = strip?.closest('.cmenu__picker')
        if (picker && strip.scrollWidth > picker.clientWidth + 1) next.add(key)
      }
      setKeys((old) => (old.size === next.size && [...next].every((k) => old.has(k)) ? old : next))
    }
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [rootRef, strips])
  return keys
}

export default function CharacterMenu({ avatar, set, notes, kit, onRow, lead }) {
  const { OptionThumb, thumbOf } = kit
  const sections = menuSections(avatar, notes)
  const rows = sections.flatMap((s) => s.rows)
  // etkin satır; satır kaybolursa (ör. beden değişince sakal) aynı sıradaki satıra düşülür
  const [current, setCurrent] = useState({ key: rows[0].key, index: 0 })
  let active = rows.findIndex((r) => r.key === current.key)
  if (active < 0) active = Math.min(current.index, rows.length - 1)
  const strips = useRef({})
  const rootRef = useRef(null)
  const overflowing = useOverflowingStrips(rootRef, strips)
  const hintId = useId()
  const baseId = useId()

  const valueOf = (r) => (r.get ? r.get(avatar[r.key]) : avatar[r.key])
  const write = (r, id) => set(r.key)(r.put ? r.put(id) : id)
  // kamera yalnızca satır (ya da satırın bölgesi) değişince döner; aynı satırda seçenek değiştirmek bölgeyi korur
  const reported = useRef(null)
  const activate = (r) => {
    const at = `${r.key}:${r.zone}`
    if (reported.current !== at) onRow({ zone: r.zone, hair: !!r.hair })
    reported.current = at
    setCurrent({ key: r.key, index: rows.indexOf(r) })
  }
  // seçili seçeneğe odak (roving): seçim değişince odak yeni seçili düğmeye geçer
  const focusOption = (r, id) => {
    requestAnimationFrame(() => strips.current[r.key]?.querySelector(`[data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true }))
  }
  const pick = (r, id) => {
    activate(r)
    if (r.disabled || id === valueOf(r)) return
    write(r, id)
    focusOption(r, id)
  }
  const step = (r, dir) => {
    const list = r.options
    const i = Math.max(0, list.findIndex((o) => o.id === valueOf(r)))
    pick(r, list[(i + dir + list.length) % list.length].id)
  }
  const focusRow = (i) => {
    const r = rows[(i + rows.length) % rows.length]
    activate(r)
    const strip = strips.current[r.key]
    // seçili seçenek: roving tabindex bir sonraki çizimde ona geçer, odak şimdi verilebilir
    strip?.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true })
    strip?.closest('.cmenu__row')?.scrollIntoView({ block: 'nearest' })
  }
  const onKey = (e, r, i) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const act = {
      ArrowLeft: () => step(r, -1),
      ArrowRight: () => step(r, 1),
      ArrowUp: () => focusRow(i - 1),
      ArrowDown: () => focusRow(i + 1),
      Home: () => pick(r, r.options[0].id),
      End: () => pick(r, r.options.at(-1).id),
    }[e.key]
    if (!act) return
    e.preventDefault()
    act()
  }

  return (
    <div ref={rootRef} className="cmenu" role="group" aria-label="Karakter menüsü">
      <p id={hintId} className="sr-only">
        {KEYS_HINT}
      </p>
      {lead}
      {sections.map((s) => (
        <section key={s.title} className="cmenu__section">
          <h2 className="opt-section__title cmenu__title">{s.title}</h2>
          <ul className="cmenu__rows">
            {s.rows.map((r, k) => {
              const i = rows.indexOf(r)
              const on = i === active
              const list = r.options
              const value = valueOf(r)
              const cur = list.find((o) => o.id === value) ?? list[0]
              const labelId = `${baseId}-${r.key}`
              const arrows = overflowing.has(r.key)
              const groupStart = r.group && r.group !== s.rows[k - 1]?.group
              return (
                <Fragment key={r.key}>
                {groupStart && (
                  <li className="cmenu__group">
                    <h3>{r.group}</h3>
                  </li>
                )}
                <li className="cmenu__row" data-active={on || undefined} data-off={r.disabled || undefined}>
                  <div className="cmenu__label">
                    <span id={labelId} className="cmenu__name">
                      {r.label}
                    </span>
                    {/* görsel ve renk şeritlerinde seçili seçeneğin adı satırın başında okunur */}
                    {(r.color || r.thumbs) && <span className="cmenu__current">{cur.label}</span>}
                    {r.note && <span className="cmenu__note">{r.note}</span>}
                  </div>
                  <div className="cmenu__picker" data-arrows={arrows || undefined}>
                    {arrows && (
                      <button type="button" className="cmenu__arrow" tabIndex={-1} disabled={r.disabled} aria-label={`Önceki ${r.label.toLocaleLowerCase('tr')}`} onClick={() => step(r, -1)}>
                        <Icon name="chevronLeft" size={20} />
                      </button>
                    )}
                    {/* radiogroup: Tab sırasında yalnızca seçili seçenek durur; ↑/↓ burada satır değiştirir
                        (ipucu aria-describedby ile okunur) */}
                    <Strip
                      r={r}
                      value={value}
                      role="radiogroup"
                      aria-labelledby={labelId}
                      aria-describedby={hintId}
                      aria-disabled={r.disabled || undefined}
                      onKeyDown={(e) => onKey(e, r, i)}
                      onFocus={() => activate(r)}
                      onPointerDown={() => activate(r)}
                      innerRef={(el) => (strips.current[r.key] = el)}
                    >
                      {list.map((o) => {
                        const checked = o.id === cur.id
                        return (
                          <button
                            key={o.id}
                            type="button"
                            role="radio"
                            className={o.id === 'none' ? 'cstrip__opt cstrip__opt--none' : 'cstrip__opt'}
                            data-id={o.id}
                            aria-checked={checked}
                            aria-label={r.color || r.thumbs ? o.label : undefined}
                            aria-disabled={r.disabled || undefined}
                            title={r.color || r.thumbs ? o.label : undefined}
                            tabIndex={on && checked ? 0 : -1}
                            onClick={() => pick(r, o.id)}
                          >
                            <Face r={r} o={o} body={avatar.body} OptionThumb={OptionThumb} thumbOf={thumbOf} />
                          </button>
                        )
                      })}
                    </Strip>
                    {arrows && (
                      <button type="button" className="cmenu__arrow" tabIndex={-1} disabled={r.disabled} aria-label={`Sonraki ${r.label.toLocaleLowerCase('tr')}`} onClick={() => step(r, 1)}>
                        <Icon name="chevronRight" size={20} />
                      </button>
                    )}
                  </div>
                </li>
                </Fragment>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
