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

// natural: doğal saç rengi. Otomatik kaş rengi doğal renklerde saçın bir ton koyusu, açık ve
// fantastik renklerde (gri, platin, pembe, mavi, mor, yeşil) doğal koyu kahve olur.
export const HAIR_COLORS = [
  { id: 'black', label: 'Siyah', color: '#1e1b1a', natural: true },
  { id: 'brown', label: 'Kahverengi', color: '#4a2e1c', natural: true },
  { id: 'auburn', label: 'Kızıl kahve', color: '#8a3e1e', natural: true },
  { id: 'blonde', label: 'Sarı', color: '#d8b060', natural: true },
  { id: 'gray', label: 'Gri', color: '#b8b8b8' },
  { id: 'ginger', label: 'Kızıl', color: '#c8602a', natural: true },
  { id: 'copper', label: 'Bakır', color: '#d9823e', natural: true },
  { id: 'platinum', label: 'Platin', color: '#ece4cf' },
  { id: 'pink', label: 'Pembe', color: '#e87aa8' },
  { id: 'blue', label: 'Mavi', color: '#4a7ad8' },
  { id: 'purple', label: 'Mor', color: '#8a5ac8' },
  { id: 'green', label: 'Yeşil', color: '#3a9a6a' },
]

// Kaş rengi: otomatik (yukarıya bak), saçla aynı, doğal koyu ya da ayrı seçilen renk (browColor).
export const BROW_MODES = [
  { id: 'auto', label: 'Otomatik' },
  { id: 'hair', label: 'Saçla aynı' },
  { id: 'natural', label: 'Doğal koyu' },
  { id: 'custom', label: 'Ayrı seçim' },
]
export const NATURAL_BROW = '#3a2618'

export const EYE_COLORS = [
  { id: 'brown', label: 'Kahverengi', color: '#4a2a18' },
  { id: 'hazel', label: 'Ela', color: '#7a6a2a' },
  { id: 'green', label: 'Yeşil', color: '#3a7a4a' },
  { id: 'blue', label: 'Mavi', color: '#3a6ab0' },
  { id: 'gray', label: 'Gri', color: '#6a7480' },
]

// Beden tipi: model bazı ayrıntıları buna göre kurar (kadında daha ince bel, kirpik, dolgun dudak;
// erkekte kalın kaş, sakal ve bıyık). Saç modelleri iki beden için ortak.
export const BODIES = [
  { id: 'male', label: 'Erkek' },
  { id: 'female', label: 'Kadın' },
]

// Unisex havuz: her beden tüm modelleri seçebilir. group: atölyede alt başlık (uzunluğa göre).
export const HAIR_STYLES = [
  { id: 'short', label: 'Kısa', group: 'Kısa kesimler' },
  { id: 'sidepart', label: 'Yan ayrık', group: 'Kısa kesimler' },
  { id: 'quiff', label: 'Kabarık', group: 'Kısa kesimler' },
  { id: 'spiky', label: 'Dikenli', group: 'Kısa kesimler' },
  { id: 'undercut', label: 'Undercut', group: 'Kısa kesimler' },
  { id: 'mohawk', label: 'Mohikan', group: 'Kısa kesimler' },
  { id: 'buzz', label: 'Asker', group: 'Kısa kesimler' },
  { id: 'pixie', label: 'Pixie', group: 'Kısa kesimler' },
  { id: 'bald', label: 'Kel', group: 'Kısa kesimler' },
  { id: 'curly', label: 'Kıvırcık', group: 'Kıvırcık ve uzun' },
  { id: 'afro', label: 'Afro', group: 'Kıvırcık ve uzun' },
  { id: 'bob', label: 'Küt', group: 'Kıvırcık ve uzun' },
  { id: 'long', label: 'Uzun düz', group: 'Kıvırcık ve uzun' },
  { id: 'wavy', label: 'Uzun dalgalı', group: 'Kıvırcık ve uzun' },
  { id: 'halfup', label: 'Yarım toplu', group: 'Kıvırcık ve uzun' },
  { id: 'manbun', label: 'Erkek topuzu', group: 'Toplu ve örgülü' },
  { id: 'ponytail', label: 'At kuyruğu', group: 'Toplu ve örgülü' },
  { id: 'bun', label: 'Topuz', group: 'Toplu ve örgülü' },
  { id: 'spacebuns', label: 'Çift topuz', group: 'Toplu ve örgülü' },
  { id: 'pigtails', label: 'İki kuyruk', group: 'Toplu ve örgülü' },
  { id: 'braid', label: 'Örgü', group: 'Toplu ve örgülü' },
]

// Kulakları örten saçlar: küpe ve kulak içi kulaklık görünmez.
export const EAR_COVERING = ['long', 'wavy', 'bob', 'halfup']
// Kahkül eklenemeyen modeller (alında saç yok ya da tepesi traşlı).
export const NO_BANGS = ['bald', 'buzz', 'mohawk']

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
  { id: 'pullover', label: 'Süveter (gömlek üstü)' },
  { id: 'cardigan', label: 'Hırka' },
  { id: 'shirt', label: 'Gömlek' },
  { id: 'flannel', label: 'Oduncu gömleği' },
  { id: 'fleece', label: 'Polar' },
  { id: 'cami', label: 'Askılı bluz' },
  { id: 'jacket', label: 'Ceket' },
  { id: 'robe', label: 'Bornoz / battaniye' },
]

export const BOTTOMS = [
  { id: 'pants', label: 'Pantolon' },
  { id: 'joggers', label: 'Eşofman altı' },
  { id: 'pajama', label: 'Pijama altı' },
  { id: 'shorts', label: 'Şort' },
  { id: 'skirt', label: 'Etek' },
]

// Tek parça: elbise ve hayvanlı tulum üstün ve altın yerine geçer (üst rengini kullanır); salopet
// altın yerine geçer, üst içinde görünür (alt rengini kullanır).
export const OUTFITS = [
  { id: 'none', label: 'Yok' },
  { id: 'dress', label: 'Elbise' },
  { id: 'overalls', label: 'Salopet' },
  { id: 'onesie', label: 'Hayvanlı tulum' },
]
// Seçilen tek parçanın yerine geçtiği alanlar.
export const OUTFIT_REPLACES = { dress: ['top', 'bottom'], onesie: ['top', 'bottom'], overalls: ['bottom'] }

export const FOOTWEAR = [
  { id: 'sneakers', label: 'Spor ayakkabı' },
  { id: 'boots', label: 'Ev botu (panduf)' },
  { id: 'bunny', label: 'Tavşanlı terlik' },
  { id: 'bear', label: 'Ayılı terlik' },
  { id: 'clogs', label: 'Crocs tarzı terlik' },
  { id: 'socks', label: 'Kalın yün çorap' },
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
  { id: 'cream', label: 'Krem', color: '#efe4cc' },
  { id: 'pink', label: 'Pembe', color: '#eaa0bc' },
  { id: 'gray', label: 'Gri', color: '#9a9ca4' },
  { id: 'green', label: 'Yeşil', color: '#5a9a6a' },
]

// Takılar ve aksesuarlar bölgeye göre; her bölgeden bir tane seçilir. group: atölyede alt başlık.
export const HATS = [
  { id: 'none', label: 'Yok', group: 'Günlük' },
  { id: 'beanie', label: 'Bere', group: 'Günlük' },
  { id: 'cap', label: 'Kep', group: 'Günlük' },
  { id: 'beret', label: 'Fransız beresi', group: 'Günlük' },
  { id: 'fedora', label: 'Fötr', group: 'Günlük' },
  { id: 'tophat', label: 'Silindir', group: 'Günlük' },
  { id: 'cowboy', label: 'Kovboy şapkası', group: 'Günlük' },
  { id: 'wizard', label: 'Büyücü şapkası', group: 'Fantastik' },
  { id: 'crown', label: 'Taç', group: 'Fantastik' },
  { id: 'viking', label: 'Viking miğferi', group: 'Fantastik' },
  { id: 'catears', label: 'Kedi kulakları', group: 'Fantastik' },
  { id: 'flowers', label: 'Çiçek tacı', group: 'Fantastik' },
]

// Kulaklıklar. over: bandı başın üstünden geçer (yalnızca HEADPHONE_HATS ile); boyundaki ve kulak
// içi her başlıkla takılır.
export const HEADPHONES = [
  { id: 'none', label: 'Yok' },
  { id: 'gaming', label: 'Oyuncu (mikrofonlu)', over: true },
  { id: 'cat', label: 'Kedi kulaklı RGB', over: true },
  { id: 'retro', label: 'Retro süngerli', over: true },
  { id: 'neck', label: 'Boyunda' },
  { id: 'earbuds', label: 'Kablosuz kulak içi' },
]
export const OVER_HEAD = HEADPHONES.filter((h) => h.over).map((h) => h.id)

// Kafa üstü kulaklıkla birlikte takılabilen başlıklar (bant üstlerinden geçer).
export const HEADPHONE_HATS = ['none', 'beanie', 'cap']

export const GLASSES = [
  { id: 'none', label: 'Yok' },
  { id: 'square', label: 'Kare' },
  { id: 'round', label: 'Yuvarlak' },
  { id: 'rimless', label: 'Çerçevesiz' },
  { id: 'sun', label: 'Güneş gözlüğü' },
  { id: 'pixel', label: 'Piksel gözlük' },
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
  hairColor2: 'none',
  bangs: false,
  brows: 'auto',
  browColor: 'brown',
  beard: 'none',
  mustache: 'none',
  top: 'hoodie',
  topColor: 'teal',
  bottom: 'pants',
  bottomColor: 'denim',
  outfit: 'none',
  footwear: 'sneakers',
  shoes: 'white',
  hat: 'none',
  hatColor: 'brown',
  glasses: 'none',
  neck: 'none',
  wrist: 'none',
  earrings: 'none',
  headphones: 'gaming',
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
  hairColor2: ['none', ...ids(HAIR_COLORS)],
  brows: ids(BROW_MODES),
  browColor: ids(HAIR_COLORS),
  beard: ids(BEARDS),
  mustache: ids(MUSTACHES),
  top: ids(TOPS),
  topColor: ids(CLOTH_COLORS),
  bottom: ids(BOTTOMS),
  bottomColor: ids(CLOTH_COLORS),
  outfit: ids(OUTFITS),
  footwear: ids(FOOTWEAR),
  shoes: ids(SHOE_COLORS),
  hat: ids(HATS),
  hatColor: ids(CLOTH_COLORS),
  glasses: ids(GLASSES),
  neck: ids(NECKWEAR),
  wrist: ids(WRISTWEAR),
  earrings: ids(EARRINGS),
  headphones: ids(HEADPHONES),
  accessoryColor: ids(CLOTH_COLORS),
  metal: ids(METALS),
}

// Eski kayıt biçimi (accessories listesi, bıyığı içeren sakallar, var/yok kulaklık) yeni alanlara
// çevrilir.
function migrate(input) {
  const out = { ...input }
  if (Array.isArray(input.accessories)) {
    const has = (a) => input.accessories.includes(a)
    out.headphones ??= has('headphones') ? 'gaming' : 'none'
    out.glasses ??= has('glasses') ? 'square' : 'none'
    out.neck ??= has('scarf') ? 'scarf' : 'none'
    out.hat ??= has('cap') ? 'cap' : has('beanie') ? 'beanie' : 'none'
    out.hatColor ??= input.accessoryColor
  }
  if (input.mustache == null && ['mustache', 'goatee', 'short', 'full'].includes(input.beard)) out.mustache = 'classic'
  if (input.beard === 'mustache') out.beard = 'none'
  if (typeof out.headphones === 'boolean') out.headphones = out.headphones ? 'gaming' : 'none'
  return out
}

// Görünen ad en çok 24 harf; harf, kullanıcının gördüğü karakterdir (emoji ve birleşik karakterler bölünmez).
const NAME_MAX = 24
const graphemes = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('tr', { granularity: 'grapheme' }) : null
const clipName = (s) => (graphemes ? [...graphemes.segment(s)].map((g) => g.segment) : [...s]).slice(0, NAME_MAX).join('')

// Bilinmeyen alanları varsayılana çeker (eski kayıtlar, elle değiştirilmiş localStorage) ve
// birbirini dışlayan seçimleri düzeltir.
export function sanitizeAvatar(input) {
  const out = { ...DEFAULT_AVATAR }
  if (!input || typeof input !== 'object') return out
  const src = migrate(input)
  if (typeof src.name === 'string' && src.name.trim()) out.name = clipName(src.name.trim())
  for (const [key, allowed] of Object.entries(FIELDS)) if (allowed.includes(src[key])) out[key] = src[key]
  if (typeof src.bangs === 'boolean') out.bangs = src.bangs
  return resolveConflicts(out)
}

/**
 * Birbirini dışlayan seçimler: kadın bedende sakal ve bıyık yok; kafa üstü kulaklık yalnızca
 * HEADPHONE_HATS ile; boyundaki kulaklık atkıyla olmaz; kahkül traşlı / saçsız modellerde yok; tek
 * parçanın yerine geçtiği üst ya da alt seçilirse tek parça çıkar. changed: kullanıcının az önce
 * değiştirdiği alan (o kalır, çakışan öbürü kaldırılır).
 */
export function resolveConflicts(avatar, changed = null) {
  const out = { ...avatar }
  if (out.body === 'female') {
    out.beard = 'none'
    out.mustache = 'none'
  }
  if (OVER_HEAD.includes(out.headphones) && !HEADPHONE_HATS.includes(out.hat)) {
    if (changed === 'headphones') out.hat = 'none'
    else out.headphones = 'none'
  }
  if (out.headphones === 'neck' && out.neck === 'scarf') {
    if (changed === 'headphones') out.neck = 'none'
    else out.headphones = 'none'
  }
  if (NO_BANGS.includes(out.hairStyle)) out.bangs = false
  if (out.outfit !== 'none' && OUTFIT_REPLACES[out.outfit]?.includes(changed)) out.outfit = 'none'
  return out
}

// Kaşın rengi (model ve atölye aynı kuralı kullanır).
export function browColorOf(avatar) {
  const hair = HAIR_COLORS.find((h) => h.id === avatar.hairColor) ?? HAIR_COLORS[0]
  if (avatar.brows === 'hair') return hair.color
  if (avatar.brows === 'natural') return NATURAL_BROW
  if (avatar.brows === 'custom') return colorOf(HAIR_COLORS, avatar.browColor)
  return hair.natural ? hair.color : NATURAL_BROW
}

const MALE_COMMON_HAIR = ['short', 'sidepart', 'quiff', 'spiky', 'undercut', 'manbun', 'buzz', 'curly', 'afro', 'bald']
const FEMALE_COMMON_HAIR = ['long', 'wavy', 'halfup', 'bob', 'pixie', 'ponytail', 'bun', 'spacebuns', 'pigtails', 'braid', 'curly', 'afro']

// Tohumlu rastgele avatar (simüle edilen oda arkadaşları için; atölyede "Rastgele").
export function randomAvatar(rnd, name) {
  const pickId = (list) => list[Math.floor(rnd() * list.length)].id
  const some = (p, list) => (rnd() < p ? pickId(list.filter((o) => o.id !== 'none')) : 'none')
  const body = rnd() < 0.5 ? 'male' : 'female'
  const male = body === 'male'
  // fantastik başlıklar seyrek
  const r = rnd()
  const hat = r < 0.2 ? pickId(HATS.filter((h) => h.group === 'Günlük' && h.id !== 'none')) : r < 0.26 ? pickId(HATS.filter((h) => h.group === 'Fantastik')) : 'none'
  const o = rnd()
  // saç çoğunlukla bedende yaygın modellerden; tek parça ve ev terlikleri seyrek
  const hairPool = male ? MALE_COMMON_HAIR : FEMALE_COMMON_HAIR
  return resolveConflicts({
    name,
    body,
    skin: pickId(SKIN_TONES),
    eyes: pickId(EYE_COLORS),
    hairStyle: rnd() < 0.85 ? hairPool[Math.floor(rnd() * hairPool.length)] : pickId(HAIR_STYLES),
    hairColor: rnd() < 0.85 ? pickId(HAIR_COLORS.filter((h) => h.natural)) : pickId(HAIR_COLORS),
    hairColor2: rnd() < 0.12 ? pickId(HAIR_COLORS) : 'none',
    bangs: rnd() < 0.2,
    brows: 'auto',
    browColor: 'brown',
    beard: male ? some(0.35, BEARDS) : 'none',
    mustache: male ? some(0.3, MUSTACHES) : 'none',
    top: pickId(TOPS),
    topColor: pickId(CLOTH_COLORS),
    bottom: rnd() < 0.6 ? 'pants' : pickId(BOTTOMS),
    bottomColor: pickId(CLOTH_COLORS),
    outfit: o < 0.06 ? 'dress' : o < 0.1 ? 'overalls' : o < 0.12 ? 'onesie' : 'none',
    footwear: rnd() < 0.75 ? 'sneakers' : pickId(FOOTWEAR),
    shoes: pickId(SHOE_COLORS),
    hat,
    hatColor: pickId(CLOTH_COLORS),
    glasses: some(0.25, GLASSES),
    neck: some(0.25, NECKWEAR),
    wrist: some(0.3, WRISTWEAR),
    earrings: some(male ? 0.1 : 0.45, EARRINGS),
    headphones: rnd() < 0.25 ? pickId(HEADPHONES.filter((h) => h.id !== 'none')) : 'none',
    accessoryColor: pickId(CLOTH_COLORS),
    metal: pickId(METALS),
  })
}

export const colorOf = (list, id) => (list.find((o) => o.id === id) ?? list[0]).color
