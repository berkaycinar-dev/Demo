// Sunucunun henüz göndermediği oda arkadaşı alanları için geçici değerler. Sunucu alanı gönderince
// yalnızca bu dosya değişir; kişi kartı ve kişi listesi buradan okur.
//
// Sunucunun verdiği (ActiveMemberResponse): userId, username, role, startedAt, avatar. Gerisi aşağıda.
// avatar null ise (kişi hiç avatar kaydetmedi) kimlikten sabit bir avatar üretilir (avatars/useRoomPeople.js).
export const PLACEHOLDER = {
  // ActiveMemberResponse.status yok: başkaları masada, odakta görünür
  status: 'focus',
  // focusStartedAt yok: odak süresi yerine odaya giriş zamanı (startedAt, ms) kullanılır
  focusSince: (person) => person.joinedAt ?? null,
  // workingOn yok: satır gizli kalır (yalnızca yazan kişinin metni gösterilir; örnek cümle uydurulmaz)
  workingOn: () => null,
}
