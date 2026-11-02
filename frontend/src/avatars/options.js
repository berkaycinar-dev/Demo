// Avatar özelleştirme seçenekleri. Her seçenek { id, label } ya da renk paletleri { id, label, color }.
// Avatar yapılandırması bu kimliklerden oluşur; model (model.js) ve atölye ekranı buradan okur.

export const SKIN_TONES = [
  { id: 'porcelain', label: 'Açık', color: '#f6dcc4' },
  { id: 'light', label: 'Buğday', color: '#ecc3a0' },
  { id: 'tan', label: 'Esmer', color: '#d09a6e' },
  { id: 'brown', label: 'Kumral', color: '#a8714a' },
  { id: 'deep', label: 'Koyu', color: '#7a4c30' },
  { id: 'ebony', label: 'Çok koyu', color: '#55341f' },
]

export const HAIR_COLORS = [
  { id: 'black', label: 'Siyah', color: '#1e1b1a' },
  { id: 'brown', label: 'Kahverengi', color: '#4a2e1c' },
  { id: 'auburn', label: 'Kızıl kahve', color: '#8a3e1e' },
  { id: 'blonde', label: 'Sarı', color: '#d8b060' },
  { id: 'gray', label: 'Gri', color: '#b8b8b8' },
  { id: 'pink', label: 'Pembe', color: '#e87aa8' },
  { id: 'blue', label: 'Mavi', color: '#4a7ad8' },
]

export const EYE_COLORS = [
  { id: 'brown', label: 'Kahverengi', color: '#4a2a18' },
  { id: 'hazel', label: 'Ela', color: '#7a6a2a' },
  { id: 'green', label: 'Yeşil', color: '#3a7a4a' },
  { id: 'blue', label: 'Mavi', color: '#3a6ab0' },
  { id: 'gray', label: 'Gri', color: '#6a7480' },
]

export const HAIR_STYLES = [
  { id: 'short', label: 'Kısa' },
  { id: 'long', label: 'Uzun' },
  { id: 'bun', label: 'Topuz' },
  { id: 'curly', label: 'Kıvırcık' },
  { id: 'ponytail', label: 'At kuyruğu' },
  { id: 'buzz', label: 'Asker' },
  { id: 'bald', label: 'Kel' },
]

export const BEARDS = [
  { id: 'none', label: 'Yok' },
  { id: 'mustache', label: 'Bıyık' },
  { id: 'goatee', label: 'Keçi sakal' },
  { id: 'short', label: 'Kısa sakal' },
  { id: 'full', label: 'Gür sakal' },
]

export const TOPS = [
  { id: 'tshirt', label: 'Tişört' },
  { id: 'hoodie', label: 'Kapüşonlu' },
  { id: 'sweater', label: 'Kazak' },
  { id: 'shirt', label: 'Gömlek' },
  { id: 'jacket', label: 'Ceket' },
]

export const BOTTOMS = [
  { id: 'pants', label: 'Pantolon' },
  { id: 'shorts', label: 'Şort' },
  { id: 'skirt', label: 'Etek' },
]

export const CLOTH_COLORS = [
  { id: 'orange', label: 'Turuncu', color: '#e8893a' },
  { id: 'red', label: 'Kırmızı', color: '#d0453a' },
  { id: 'yellow', label: 'Hardal', color: '#d8b03a' },
  { id: 'green', label: 'Yeşil', color: '#4a9a5a' },
  { id: 'teal', label: 'Petrol', color: '#2a7a80' },
  { id: 'blue', label: 'Mavi', color: '#3a6ad0' },
  { id: 'navy', label: 'Lacivert', color: '#2a3460' },
  { id: 'purple', label: 'Mor', color: '#8a5ac8' },
  { id: 'pink', label: 'Pembe', color: '#e07aa8' },
  { id: 'cream', label: 'Krem', color: '#ece2cc' },
  { id: 'gray', label: 'Gri', color: '#8a8e96' },
  { id: 'charcoal', label: 'Antrasit', color: '#3a3d46' },
  { id: 'brown', label: 'Kahve', color: '#7a5034' },
  { id: 'denim', label: 'Kot', color: '#4a6a9a' },
]

export const SHOE_COLORS = [
  { id: 'white', label: 'Beyaz', color: '#eeeeee' },
  { id: 'black', label: 'Siyah', color: '#222226' },
  { id: 'brown', label: 'Kahve', color: '#6a4228' },
  { id: 'red', label: 'Kırmızı', color: '#c03a32' },
  { id: 'blue', label: 'Mavi', color: '#3a5ab0' },
]

export const ACCESSORIES = [
  { id: 'glasses', label: 'Gözlük' },
  { id: 'headphones', label: 'Kulaklık' },
  { id: 'scarf', label: 'Atkı' },
  { id: 'beanie', label: 'Bere' },
  { id: 'cap', label: 'Kep' },
]

// Aynı anda takılamayan aksesuarlar (ikisi de başın tepesini kaplar).
export const EXCLUSIVE_ACCESSORIES = [['beanie', 'cap']]

export const DEFAULT_AVATAR = {
  name: 'Sen',
  skin: 'light',
  eyes: 'brown',
  hairStyle: 'short',
  hairColor: 'brown',
  beard: 'none',
  top: 'hoodie',
  topColor: 'teal',
  bottom: 'pants',
  bottomColor: 'denim',
  shoes: 'white',
  accessories: ['headphones'],
  accessoryColor: 'orange',
}

const ids = (list) => list.map((o) => o.id)
const FIELDS = {
  skin: ids(SKIN_TONES),
  eyes: ids(EYE_COLORS),
  hairStyle: ids(HAIR_STYLES),
  hairColor: ids(HAIR_COLORS),
  beard: ids(BEARDS),
  top: ids(TOPS),
  topColor: ids(CLOTH_COLORS),
  bottom: ids(BOTTOMS),
  bottomColor: ids(CLOTH_COLORS),
  shoes: ids(SHOE_COLORS),
  accessoryColor: ids(CLOTH_COLORS),
}

// Bilinmeyen alanları varsayılana çeker (eski kayıtlar, elle değiştirilmiş localStorage).
export function sanitizeAvatar(input) {
  const out = { ...DEFAULT_AVATAR }
  if (!input || typeof input !== 'object') return out
  if (typeof input.name === 'string' && input.name.trim()) out.name = input.name.trim().slice(0, 24)
  for (const [key, allowed] of Object.entries(FIELDS)) if (allowed.includes(input[key])) out[key] = input[key]
  if (Array.isArray(input.accessories)) out.accessories = withoutConflicts(input.accessories.filter((a) => ids(ACCESSORIES).includes(a)))
  return out
}

// Aksesuar listesinden çakışanların sonuncusunu bırakır.
export function withoutConflicts(list) {
  let out = [...new Set(list)]
  for (const group of EXCLUSIVE_ACCESSORIES) {
    const present = out.filter((a) => group.includes(a))
    if (present.length > 1) out = out.filter((a) => !group.includes(a) || a === present[present.length - 1])
  }
  return out
}

// Tohumlu rastgele avatar (simüle edilen oda arkadaşları için).
export function randomAvatar(rnd, name) {
  const pickId = (list) => list[Math.floor(rnd() * list.length)].id
  const accessories = []
  for (const a of ['glasses', 'headphones', 'scarf']) if (rnd() < 0.22) accessories.push(a)
  if (rnd() < 0.18) accessories.push(rnd() < 0.5 ? 'beanie' : 'cap')
  const hairStyle = pickId(HAIR_STYLES)
  return {
    name,
    skin: pickId(SKIN_TONES),
    eyes: pickId(EYE_COLORS),
    hairStyle,
    hairColor: rnd() < 0.85 ? pickId(HAIR_COLORS.slice(0, 5)) : pickId(HAIR_COLORS),
    beard: rnd() < 0.35 ? pickId(BEARDS.slice(1)) : 'none',
    top: pickId(TOPS),
    topColor: pickId(CLOTH_COLORS),
    bottom: rnd() < 0.7 ? 'pants' : pickId(BOTTOMS),
    bottomColor: pickId(CLOTH_COLORS),
    shoes: pickId(SHOE_COLORS),
    accessories,
    accessoryColor: pickId(CLOTH_COLORS),
  }
}

export const colorOf = (list, id) => (list.find((o) => o.id === id) ?? list[0]).color
