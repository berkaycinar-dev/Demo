// Atölye seçenek görsellerinin çizildiği sayfa: ?kind=<tür>&id=<seçenek>&body=male|female[&focus=<kamera odağı>].
// Türler FIELD'da; kamera odağı verilmezse türün varsayılanı (FOCUS) kullanılır.
// Sabit, sade bir avatar (seçilen beden, kulaklıksız, kahverengi kısa saç) yalnızca o seçenekle, elinde eşya olmadan
// yürüyüş pozunda (hareket azaltılmış: duruş) çizilir; kamera
// başa yakındır. render-avatar-thumbs.mjs açar ve ekran görüntüsü alır.
import { createRoot } from 'react-dom/client'
import AvatarPreview from '../src/avatars/AvatarPreview'
import { DEFAULT_AVATAR, resolveConflicts, sanitizeAvatar } from '../src/avatars/options'

const FIELD = {
  hair: 'hairStyle',
  hat: 'hat',
  glasses: 'glasses',
  beard: 'beard',
  mustache: 'mustache',
  top: 'top',
  bottom: 'bottom',
  outfit: 'outfit',
  footwear: 'footwear',
  headphones: 'headphones',
  earrings: 'earrings',
  neck: 'neck',
  wrist: 'wrist',
}
// türün kamera odağı (AvatarPreview VIEWS.walk); ?focus= ile değişir
const FOCUS = { hat: 'hat', hair: 'crown', top: 'full', bottom: 'full', outfit: 'full', footwear: 'full', neck: 'full', wrist: 'full' }
const params = new URLSearchParams(window.location.search)
const kind = FIELD[params.get('kind')] ? params.get('kind') : 'hair'
const body = params.get('body') === 'female' ? 'female' : 'male'
const base = { ...DEFAULT_AVATAR, body, headphones: 'none', hatColor: 'navy', bangs: false }
const avatar = resolveConflicts(sanitizeAvatar({ ...base, [FIELD[kind]]: params.get('id') }), FIELD[kind])
const focus = params.get('focus') || FOCUS[kind] || 'face'
// tam boy çizilip figürün bir bölgesi kesilen türler: platform çizilmez (render-avatar-thumbs.mjs BODY_CROP)
const BODY_CROP = ['top', 'bottom', 'outfit', 'footwear', 'neck', 'wrist']

createRoot(document.getElementById('root')).render(
  <AvatarPreview avatar={avatar} mode="walk" focus={focus} hint={false} reducedMotion stage={!BODY_CROP.includes(kind)} />,
)
