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

// Odaya katılmış kişi sayısı (sunucudaki memberCount). "Şu an odada" demez: üyelik sayısıdır.
// Sayı yoksa (eski kayıt) hiçbir şey yazılmaz; uydurma sayı gösterilmez.
const MEMBERS_COPY = { count: (n) => `${n} üye` }
export const membersLabel = (room) => (Number.isFinite(room?.memberCount) ? MEMBERS_COPY.count(room.memberCount) : null)
