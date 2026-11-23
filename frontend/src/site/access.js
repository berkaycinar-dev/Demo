// Odaya kimlerin girebileceği. Etiket her yerde (oda oluşturma seçimi, oda kartı, oda paneli, özet
// çubuğu) bu tek kaynaktan okunur; yazımı ve harf büyüklüğü her yerde aynı kalır. Çeviri için
// label ve hint tam metinlerdir, başka dizelerle birleştirilmez.
export const ACCESS = {
  public: { label: 'Herkese açık', hint: 'Oda lobide listelenir, herkes girebilir.' },
  invite: { label: 'Davetle', hint: 'Bir davet kodu üretilir; yalnızca kodu bilenler girebilir.' },
}

// Seçim listesindeki sıra.
export const ACCESS_IDS = ['public', 'invite']

export const accessLabel = (id) => ACCESS[id]?.label ?? ACCESS.public.label
