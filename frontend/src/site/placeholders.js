// Sunucunun henüz göndermediği oda arkadaşı alanları için geçici değerler. Sunucu alanı gönderince
// yalnızca bu dosya değişir; kişi kartı ve kişi listesi buradan okur.
//
// Sunucunun verdiği (ActiveMemberResponse): userId, username, role, startedAt. Gerisi aşağıda.
// Avatar da sunucuda yok: başkaları kimlikten sabit üretilen avatarla çizilir (avatars/useRoomPeople.js,
// randomAvatar(seededRandom(roomSeed(userId)))). Sunucu avatarı gönderince oradaki üretim kalkar.
export const PLACEHOLDER = {
  // ActiveMemberResponse.status yok: başkaları masada, odakta görünür
  status: 'focus',
  // focusStartedAt yok: odak süresi yerine odaya giriş zamanı (startedAt, ms) kullanılır
  focusSince: (person) => person.joinedAt ?? null,
  // workingOn yok: satır gizli kalır (yalnızca yazan kişinin metni gösterilir; örnek cümle uydurulmaz)
  workingOn: () => null,
}
