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
  { id: 'ginger', label: 'Kızıl', color: '#c8602a' },
  { id: 'platinum', label: 'Platin', color: '#ece4cf' },
  { id: 'pink', label: 'Pembe', color: '#e87aa8' },
  { id: 'blue', label: 'Mavi', color: '#4a7ad8' },
  { id: 'purple', label: 'Mor', color: '#8a5ac8' },
  { id: 'green', label: 'Yeşil', color: '#3a9a6a' },
]

export const EYE_COLORS = [
  { id: 'brown', label: 'Kahverengi', color: '#4a2a18' },
  { id: 'hazel', label: 'Ela', color: '#7a6a2a' },
  { id: 'green', label: 'Yeşil', color: '#3a7a4a' },
  { id: 'blue', label: 'Mavi', color: '#3a6ab0' },
  { id: 'gray', label: 'Gri', color: '#6a7480' },
]

// Beden tipi: model bazı ayrıntıları buna göre kurar (kadında daha ince bel, kirpik, dolgun dudak;
// erkekte kalın kaş, sakal ve bıyık). Saç modelleri de bedene göre listelenir.
export const BODIES = [
  { id: 'male', label: 'Erkek' },
  { id: 'female', label: 'Kadın' },
]

// for: hangi beden için listelenir ('both' ikisi de). Atölyede seçili bedenin listesi gösterilir.
export const HAIR_STYLES = [
  { id: 'short', label: 'Kısa', for: 'both' },
  { id: 'sidepart', label: 'Yan ayrık', for: 'male' },
  { id: 'quiff', label: 'Kabarık', for: 'male' },
  { id: 'spiky', label: 'Dikenli', for: 'male' },
  { id: 'undercut', label: 'Undercut', for: 'male' },
  { id: 'manbun', label: 'Erkek topuzu', for: 'male' },
  { id: 'mohawk', label: 'Mohikan', for: 'both' },
  { id: 'buzz', label: 'Asker', for: 'both' },
  { id: 'curly', label: 'Kıvırcık', for: 'both' },
  { id: 'afro', label: 'Afro', for: 'both' },
  { id: 'long', label: 'Uzun düz', for: 'both' },
  { id: 'wavy', label: 'Uzun dalgalı', for: 'female' },
  { id: 'bob', label: 'Küt', for: 'female' },
  { id: 'pixie', label: 'Pixie', for: 'female' },
  { id: 'ponytail', label: 'At kuyruğu', for: 'female' },
  { id: 'bun', label: 'Topuz', for: 'female' },
  { id: 'pigtails', label: 'İki kuyruk', for: 'female' },
  { id: 'braid', label: 'Örgü', for: 'female' },
  { id: 'bald', label: 'Kel', for: 'both' },
]
export const hairStylesFor = (body) => HAIR_STYLES.filter((h) => h.for === 'both' || h.for === body)

// Kulakları örten saçlar: küpe görünmez.
export const EAR_COVERING = ['long', 'wavy', 'bob']

// Sakal ve bıyık ayrı seçilir (erkek bedende).
export const BEARDS = [
  { id: 'none', label: 'Yok' },
  { id: 'stubble', label: 'Kirli sakal' },
  { id: 'goatee', label: 'Keçi sakal' },
  { id: 'chinstrap', label: 'Çene hattı' },
  { id: 'sideburns', label: 'Favori' },
  { id: 'short', label: 'Kısa sakal' },
  { id: 'full', label: 'Gür sakal' },
  { id: 'long', label: 'Uzun sakal' },
]

export const MUSTACHES = [
  { id: 'none', label: 'Yok' },
  { id: 'classic', label: 'Klasik' },
  { id: 'pencil', label: 'İnce' },
  { id: 'chevron', label: 'Gür' },
  { id: 'handlebar', label: 'Burma' },
  { id: 'horseshoe', label: 'Nal' },
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

// Takılar ve aksesuarlar bölgeye göre; her bölgeden bir tane seçilir. group: atölyede alt başlık.
export const HATS = [
  { id: 'none', label: 'Yok', group: 'Şapka' },
  { id: 'beanie', label: 'Bere', group: 'Şapka' },
  { id: 'cap', label: 'Kep', group: 'Şapka' },
  { id: 'beret', label: 'Fransız beresi', group: 'Şapka' },
  { id: 'fedora', label: 'Fötr', group: 'Şapka' },
  { id: 'tophat', label: 'Silindir', group: 'Şapka' },
  { id: 'cowboy', label: 'Kovboy şapkası', group: 'Şapka' },
  { id: 'wizard', label: 'Büyücü şapkası', group: 'Fantastik' },
  { id: 'crown', label: 'Taç', group: 'Fantastik' },
  { id: 'viking', label: 'Viking miğferi', group: 'Fantastik' },
  { id: 'catears', label: 'Kedi kulakları', group: 'Fantastik' },
  { id: 'flowers', label: 'Çiçek tacı', group: 'Fantastik' },
]

// Kulaklıkla birlikte takılabilen başlıklar (bant üstlerinden geçer).
export const HEADPHONE_HATS = ['none', 'beanie', 'cap']

export const GLASSES = [
  { id: 'none', label: 'Yok' },
  { id: 'square', label: 'Kare' },
  { id: 'round', label: 'Yuvarlak' },
  { id: 'sun', label: 'Güneş gözlüğü' },
  { id: 'monocle', label: 'Monokl' },
]

export const NECKWEAR = [
  { id: 'none', label: 'Yok' },
  { id: 'scarf', label: 'Atkı' },
  { id: 'bowtie', label: 'Papyon' },
  { id: 'tie', label: 'Kravat' },
  { id: 'necklace', label: 'Kolye' },
]

export const WRISTWEAR = [
  { id: 'none', label: 'Yok' },
  { id: 'watch', label: 'Saat' },
  { id: 'smartwatch', label: 'Akıllı saat' },
  { id: 'bracelet', label: 'Bileklik' },
]

export const EARRINGS = [
  { id: 'none', label: 'Yok' },
  { id: 'studs', label: 'Taşlı küpe' },
  { id: 'hoops', label: 'Halka küpe' },
  { id: 'drops', label: 'Sallantılı küpe' },
]

// Taç, küpe, kolye, saat kasası ve bileklik bu renkte.
export const METALS = [
  { id: 'gold', label: 'Altın', color: '#e2b23c' },
  { id: 'silver', label: 'Gümüş', color: '#c9ced6' },
  { id: 'rose', label: 'Rose', color: '#e0a08a' },
  { id: 'black', label: 'Siyah', color: '#2c2c30' },
]

export const DEFAULT_AVATAR = {
  name: 'Sen',
  body: 'male',
  skin: 'light',
  eyes: 'brown',
  hairStyle: 'short',
  hairColor: 'brown',
  beard: 'none',
  mustache: 'none',
  top: 'hoodie',
  topColor: 'teal',
  bottom: 'pants',
  bottomColor: 'denim',
  shoes: 'white',
  hat: 'none',
  hatColor: 'brown',
  glasses: 'none',
  neck: 'none',
  wrist: 'none',
  earrings: 'none',
  headphones: true,
  accessoryColor: 'orange',
  metal: 'gold',
}

const ids = (list) => list.map((o) => o.id)
const FIELDS = {
  body: ids(BODIES),
  skin: ids(SKIN_TONES),
  eyes: ids(EYE_COLORS),
  hairStyle: ids(HAIR_STYLES),
  hairColor: ids(HAIR_COLORS),
  beard: ids(BEARDS),
  mustache: ids(MUSTACHES),
  top: ids(TOPS),
  topColor: ids(CLOTH_COLORS),
  bottom: ids(BOTTOMS),
  bottomColor: ids(CLOTH_COLORS),
  shoes: ids(SHOE_COLORS),
  hat: ids(HATS),
  hatColor: ids(CLOTH_COLORS),
  glasses: ids(GLASSES),
  neck: ids(NECKWEAR),
  wrist: ids(WRISTWEAR),
  earrings: ids(EARRINGS),
  accessoryColor: ids(CLOTH_COLORS),
  metal: ids(METALS),
}

// Eski kayıt biçimi (accessories listesi, bıyığı içeren sakallar) yeni alanlara çevrilir.
function migrate(input) {
  const out = { ...input }
  if (Array.isArray(input.accessories)) {
    const has = (a) => input.accessories.includes(a)
    out.headphones ??= has('headphones')
    out.glasses ??= has('glasses') ? 'square' : 'none'
    out.neck ??= has('scarf') ? 'scarf' : 'none'
    out.hat ??= has('cap') ? 'cap' : has('beanie') ? 'beanie' : 'none'
    out.hatColor ??= input.accessoryColor
  }
  if (input.mustache == null && ['mustache', 'goatee', 'short', 'full'].includes(input.beard)) out.mustache = 'classic'
  if (input.beard === 'mustache') out.beard = 'none'
  return out
}

// Bilinmeyen alanları varsayılana çeker (eski kayıtlar, elle değiştirilmiş localStorage) ve
// birbirini dışlayan seçimleri düzeltir.
export function sanitizeAvatar(input) {
  const out = { ...DEFAULT_AVATAR }
  if (!input || typeof input !== 'object') return out
  const src = migrate(input)
  if (typeof src.name === 'string' && src.name.trim()) out.name = src.name.trim().slice(0, 24)
  for (const [key, allowed] of Object.entries(FIELDS)) if (allowed.includes(src[key])) out[key] = src[key]
  if (typeof src.headphones === 'boolean') out.headphones = src.headphones
  return resolveConflicts(out)
}

/**
 * Birbirini dışlayan seçimler: kadın bedende sakal ve bıyık yok; kulaklık yalnızca HEADPHONE_HATS
 * ile. changed: kullanıcının az önce değiştirdiği alan (o kalır, çakışan öbürü kaldırılır).
 */
export function resolveConflicts(avatar, changed = null) {
  const out = { ...avatar }
  if (out.body === 'female') {
    out.beard = 'none'
    out.mustache = 'none'
  }
  if (out.headphones && !HEADPHONE_HATS.includes(out.hat)) {
    if (changed === 'headphones') out.hat = 'none'
    else out.headphones = false
  }
  return out
}

// Tohumlu rastgele avatar (simüle edilen oda arkadaşları için).
export function randomAvatar(rnd, name) {
  const pickId = (list) => list[Math.floor(rnd() * list.length)].id
  const some = (p, list) => (rnd() < p ? pickId(list.filter((o) => o.id !== 'none')) : 'none')
  const body = rnd() < 0.5 ? 'male' : 'female'
  const male = body === 'male'
  // fantastik başlıklar seyrek
  const r = rnd()
  const hat = r < 0.2 ? pickId(HATS.filter((h) => h.group === 'Şapka' && h.id !== 'none')) : r < 0.26 ? pickId(HATS.filter((h) => h.group === 'Fantastik')) : 'none'
  return resolveConflicts({
    name,
    body,
    skin: pickId(SKIN_TONES),
    eyes: pickId(EYE_COLORS),
    hairStyle: pickId(hairStylesFor(body)),
    hairColor: rnd() < 0.85 ? pickId(HAIR_COLORS.slice(0, 7)) : pickId(HAIR_COLORS),
    beard: male ? some(0.35, BEARDS) : 'none',
    mustache: male ? some(0.3, MUSTACHES) : 'none',
    top: pickId(TOPS),
    topColor: pickId(CLOTH_COLORS),
    bottom: rnd() < 0.7 ? 'pants' : pickId(BOTTOMS),
    bottomColor: pickId(CLOTH_COLORS),
    shoes: pickId(SHOE_COLORS),
    hat,
    hatColor: pickId(CLOTH_COLORS),
    glasses: some(0.25, GLASSES),
    neck: some(0.25, NECKWEAR),
    wrist: some(0.3, WRISTWEAR),
    earrings: some(male ? 0.1 : 0.45, EARRINGS),
    headphones: rnd() < 0.22,
    accessoryColor: pickId(CLOTH_COLORS),
    metal: pickId(METALS),
  })
}

export const colorOf = (list, id) => (list.find((o) => o.id === id) ?? list[0]).color
