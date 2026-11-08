import { CLOTH_COLORS, EAR_COVERING, EYE_COLORS, HAIR_COLORS, METALS, NO_BANGS, OVER_HEAD, SKIN_TONES, colorOf } from '../avatars/options'

// Kombin slotlarındaki mini portre: kayıtlı avatarın verisinden çizilen düz voxel büst (16×16 blok ızgara).
// 3D sahne açmaz ve görüntü saklamaz; kombin değişince portre de aynı anda değişir. Saç modeli, şapka ve
// kulaklık kaba hatlarıyla ayrılır, renkler avatarla birebir aynıdır.
const LONG = [...EAR_COVERING, 'ponytail', 'pigtails', 'braid']
const FIXED_HAT = { viking: '#9aa0a8', flowers: '#e58fb0' }
const EAR_CUPS = ['gaming', 'cat', 'retro']
// x >= SHADE_X sütunları bir ton koyu: voxel yan yüzü. Her blok kendi gölgesini çizer; üstteki blok
// alttakinin gölgesini örttüğü için gölge katlanmaz.
const SHADE_X = 9

function blocksOf(a) {
  const skin = colorOf(SKIN_TONES, a.skin)
  const hair = colorOf(HAIR_COLORS, a.hairColor)
  const bald = a.hairStyle === 'bald'
  const buzz = a.hairStyle === 'buzz'
  const long = !bald && LONG.includes(a.hairStyle)
  const male = a.body !== 'female'
  const b = []
  const add = (x, y, w, h, fill) => b.push({ x, y, w, h, fill })
  add(2, 13, 12, 3, colorOf(CLOTH_COLORS, a.topColor))
  add(6, 11, 4, 2, skin)
  if (long) add(3, 4, 10, 9, hair)
  add(4, 3, 8, 8, skin)
  if (!bald) add(4, buzz ? 3 : 2, 8, buzz ? 1 : 2, hair)
  if (!bald && !buzz) {
    add(4, 4, 1, long ? 6 : 2, hair)
    add(11, 4, 1, long ? 6 : 2, hair)
  }
  if (a.bangs && !NO_BANGS.includes(a.hairStyle)) add(5, 4, 6, 1, hair)
  add(5, 6, 2, 2, '#fff')
  add(9, 6, 2, 2, '#fff')
  const eyes = colorOf(EYE_COLORS, a.eyes)
  add(6, 6, 1, 2, eyes)
  add(10, 6, 1, 2, eyes)
  if (male && a.beard !== 'none') add(4, 9, 8, 2, hair)
  if (male && a.mustache !== 'none') add(6, 9, 4, 1, hair)
  if (a.hat !== 'none') add(3, 1, 10, 3, a.hat === 'crown' ? colorOf(METALS, a.metal) : FIXED_HAT[a.hat] ?? colorOf(CLOTH_COLORS, a.hatColor))
  if (OVER_HEAD.includes(a.headphones) || EAR_CUPS.includes(a.headphones)) {
    const cup = colorOf(CLOTH_COLORS, a.accessoryColor)
    add(3, 5, 1, 3, cup)
    add(12, 5, 1, 3, cup)
  }
  return b
}

export default function AvatarPortrait({ avatar, size = 40 }) {
  return (
    <svg className="portrait" width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      {blocksOf(avatar).map(({ x, y, w, h, fill }, i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill={fill} />
          {x + w > SHADE_X && <rect x={Math.max(x, SHADE_X)} y={y} width={x + w - Math.max(x, SHADE_X)} height={h} fill="#000" opacity="0.12" />}
        </g>
      ))}
      {avatar.glasses !== 'none' && <path d="M4.5 5.5h3v3h-3zM8.5 5.5h3v3h-3zM7.5 6.5h1" fill="none" stroke="#2b2420" strokeWidth="0.5" shapeRendering="auto" />}
    </svg>
  )
}
