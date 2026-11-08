// Atölye seçenek görsellerinin çizildiği sayfa: ?kind=hair|hat|glasses|beard|mustache&id=<seçenek>&body=male|female.
// Sabit, sade bir avatar (seçilen beden, kulaklıksız, kahverengi kısa saç) yalnızca o seçenekle, elinde eşya olmadan
// yürüyüş pozunda (hareket azaltılmış: duruş) çizilir; kamera
// başa yakındır. render-avatar-thumbs.mjs açar ve ekran görüntüsü alır.
import { createRoot } from 'react-dom/client'
import AvatarPreview from '../src/avatars/AvatarPreview'
import { DEFAULT_AVATAR, resolveConflicts, sanitizeAvatar } from '../src/avatars/options'

const FIELD = { hair: 'hairStyle', hat: 'hat', glasses: 'glasses', beard: 'beard', mustache: 'mustache' }
const params = new URLSearchParams(window.location.search)
const kind = FIELD[params.get('kind')] ? params.get('kind') : 'hair'
const body = params.get('body') === 'female' ? 'female' : 'male'
const base = { ...DEFAULT_AVATAR, body, headphones: 'none', hatColor: 'navy', bangs: false }
const avatar = resolveConflicts(sanitizeAvatar({ ...base, [FIELD[kind]]: params.get('id') }), FIELD[kind])

createRoot(document.getElementById('root')).render(
  <AvatarPreview avatar={avatar} mode="walk" focus={kind === 'hat' ? 'hat' : kind === 'hair' ? 'crown' : 'face'} hint={false} reducedMotion />,
)
