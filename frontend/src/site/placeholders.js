// Sunucunun henüz göndermediği oda arkadaşı alanları için geçici değerler. Sunucu alanı gönderince
// yalnızca bu dosya değişir; kişi kartı ve kişi listesi buradan okur.
//
// Sunucunun verdiği (ActiveMemberResponse): userId, username, role, startedAt, avatar, status, spot,
// statusSince. Gerisi aşağıda. avatar null ise (kişi hiç avatar kaydetmedi) kimlikten sabit bir avatar
// üretilir (avatars/useRoomPeople.js).
export const PLACEHOLDER = {
  // odak süresi: durum Odakta olduğundan beri (statusSince, ms; kişide since); yoksa odaya giriş zamanı
  focusSince: (person) => person.since ?? person.joinedAt ?? null,
  // workingOn yok: satır gizli kalır (yalnızca yazan kişinin metni gösterilir; örnek cümle uydurulmaz)
  workingOn: () => null,
}
