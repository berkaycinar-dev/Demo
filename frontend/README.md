# Odakhane frontend

Odakhane'nin web arayüzü: React 19 + Vite, oda sahneleri için three.js (`@react-three/fiber`).
Kullanıcı temalı bir odaya girer, avatarıyla bir masaya oturur ve pomodoro sayacıyla çalışır.

Bu sürüm **backend'e bağlı değildir**. Hesaplar, odalar, sayaç ve avatar tarayıcının
`localStorage`'ında tutulur. Odadaki diğer kişiler simülasyondur.

## Gereksinimler

- Node.js 24 (CI aynı sürümü kullanır)
- npm

## Çalıştırma

```sh
cd frontend
npm ci
npm run dev
```

Site `http://localhost:5173/` adresinde açılır.

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu (anında yenileme) |
| `npm run build` | Üretim derlemesi, çıktı `dist/` |
| `npm run preview` | `dist/` derlemesini yerelde sunar |
| `npm run lint` | ESLint |

CI (`.github/workflows/frontend-ci.yml`) `main` dalına push ve pull request'lerde `npm ci`, `npm run lint` ve
`npm run build` çalıştırır.

## Geliştirme adresleri

| Adres | Ne açılır |
|---|---|
| `/` | Site (sayfalar `#sayfam`, `#lobi`, `#odam` gibi adreslerle seçilir) |
| `/?theme=cabin&c=4&t=night` | Tek bir oda sahnesi: tema, kapasite (1-10), gün zamanı |
| `/?theme=library&c=8&people=mix&names=1` | Oda sahnesi, kişilerle ve isimlerle |
| `/?lab=avatars` | Bütün avatar hareketleri |

Tema kimlikleri: `library`, `cabin`, `office`, `teagarden`, `camp`, `space`, `underwater`, `bar`,
`treehouse`, `cyber`.

## Backend bağlantısı (prototip)

Site backend'e `src/site/api.js` üzerinden bağlanır. Varsayılan adres canlı demo backend'idir
(`https://demo-backend-bcns.onrender.com`). Yerel backend için `frontend/.env.local` dosyasına yaz:

```
VITE_API_URL=http://localhost:8080
```

| Sunucudan gelir | Bu tarayıcıda kalır |
|---|---|
| Kayıt, giriş, çıkış, oturum yenileme | Görünen ad, avatar |
| Oda listesi, oda oluşturma, odaya katılma | Sayaç, odak istatistikleri, katılım geçmişi |
| Odadaki oturum ve şu an odada olanlar | Kişisel oda (`#odam`) |

- Giriş e-postayla yapılır. Kullanıcı adında nokta kullanılamaz (backend kuralı).
- Oda teması backend'de ayrı bir alan değil. Prototipte odanın açıklamasında `theme:<ad>` olarak taşınır.
- Gizli odaya yalnızca odayı açan ve üyeler girebilir. Başkası yalnız kodla katılamaz, çünkü backend'de
  "kodla oda bul" ucu henüz yok.
- Hesap ayarlarında e-posta, şifre değişikliği ve hesap silme prototipte kapalı.
- Canlı backend yalnız `https://samedesk.vercel.app` adresine izin verir (CORS). Vercel önizleme
  adreslerinden istekler reddedilir.

## Klasörler

```
src/
  site/       sayfalar, site kabuğu, sayaç, stil (theme.css token'ları, site.css, pages.css)
  rooms/      oda temaları; rooms/core ortak sahne (kamera, ışık, etkileşimli eşyalar)
  avatars/    voxel avatar, kıyafet seçenekleri, odadaki kişiler
public/
  room-thumbs/    oda kartı görselleri (scripts/render-room-thumbs.mjs)
  avatar-thumbs/  avatar seçenek görselleri (scripts/render-avatar-thumbs.mjs)
  icons/, og-image.png, favicon.svg   marka görselleri (scripts/render-brand-assets.mjs)
  404.html        sunucuda olmayan yollar için sayfa
```

Tasarım kuralları depo kökündeki `DESIGN.md`'de, ürün bağlamı `PRODUCT.md`'de.

## Görselleri yeniden üretmek

Görseller koddan çizilir; elle düzenlenmez. Tema, avatar ya da marka değişince ilgili script
yeniden çalıştırılır. Üçü de bir Chrome/Edge ve geçici olarak `puppeteer-core` ister:

```sh
cd frontend
npm i --no-save puppeteer-core
node scripts/render-room-thumbs.mjs          # oda kartları (THUMB_TIME=evening: koyu mod varyantı)
node scripts/render-avatar-thumbs.mjs        # avatar seçenekleri
node scripts/render-brand-assets.mjs         # uygulama ikonları ve paylaşım görseli
```

Tarayıcı varsayılan yolda değilse `CHROME_PATH` ile verilir.

## Kurallar

- Bir oda sahnesine ya da ortak oda bileşenine yapılan her değişiklik 10 temanın tamamında ve
  1-10 kapasitenin hepsinde çalışmalı.
- Açık ve koyu mod, `prefers-reduced-motion` ve 390 / 768 / 1440 genişlikleri desteklenir.
- Arayüz metinleri çeviriye hazır tutulur: sayılar ve adlar metne ayrı değişken olarak girer.
