// Odaya kimlerin girebileceği. Etiket her yerde (oda oluşturma seçimi, oda kartı, oda paneli, özet
// çubuğu) bu tek kaynaktan okunur. Kod isteyen odanın tek adı "Davetli", tek eylemi "Kodla gir"; yazımı ve harf büyüklüğü her yerde aynı kalır. Çeviri için
// label tam metindir, başka dizelerle birleştirilmez.
export const ACCESS = {
  public: { label: 'Herkese açık' },
  invite: { label: 'Davetli' },
}

// Seçim listesindeki sıra.
export const ACCESS_IDS = ['public', 'invite']

export const accessLabel = (id) => ACCESS[id]?.label ?? ACCESS.public.label

// Odanın kısa doluluk notu: davetli odada üye sayısı, herkese açık odada (üyelik yok) şu an içeride olan
// kişi sayısı. Sayı yoksa hiçbir şey yazılmaz; uydurma sayı gösterilmez.
const MEMBERS_COPY = { members: (n) => `${n} üye`, inside: (n) => (n ? `${n} kişi içeride` : null) }
export const membersLabel = (room) => {
  if (room?.access === 'invite') return Number.isFinite(room.memberCount) ? MEMBERS_COPY.members(room.memberCount) : null
  return Number.isFinite(room?.insideCount) ? MEMBERS_COPY.inside(room.insideCount) : null
}
