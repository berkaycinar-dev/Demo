// Ürünün adı Odakhane'den SameDesk'e değişti; tarayıcıdaki kayıtların anahtarları da "odakhane." /
// "odakhane-" ile başlıyordu. Uygulama açılmadan önce (main.jsx'te ilk import) eski anahtarlar bir kez
// yeni adlarına taşınır: avatar, oturum, ayarlar ve odak sayısı kaybolmaz. Yeni anahtar zaten varsa
// (yeni ad altında yazılmış daha güncel veri) ona dokunulmaz; eski anahtar her durumda silinir.
const OLD = 'odakhane'
const NEW = 'samedesk'

function migrate(store) {
  const keys = []
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i)
    if (key && (key.startsWith(`${OLD}.`) || key.startsWith(`${OLD}-`))) keys.push(key)
  }
  for (const key of keys) {
    const next = NEW + key.slice(OLD.length)
    if (store.getItem(next) === null) store.setItem(next, store.getItem(key))
    store.removeItem(key)
  }
}

try {
  migrate(window.localStorage)
  migrate(window.sessionStorage)
} catch {
  /* depolama kapalıysa (gizli pencere, engelli site verisi) taşınacak bir şey de yoktur */
}
