# Odalar (izometrik 3D sahneler)

Her oda tek başına çalışan bir React bileşenidir: kamera, ışık, sürükle-döndür, +/− yakınlaştırma
ve Otomatik / Gündüz / Akşam / Gece düğmeleri bileşenin içindedir. Sayfaya koymak yeterli.

```jsx
import { LibraryRoom, LibraryRoom4 } from './rooms/library'

// kapasiteye göre seçim (1-10)
<div style={{ height: 600 }}>
  <LibraryRoom capacity={room.capacity} onSpotClick={(spot) => console.log(spot.id)} />
</div>

// ya da doğrudan belirli bir oda
<LibraryRoom4 defaultTimeOfDay="night" />
```

Bileşen ebeveyninin boyutunu doldurur; ebeveyne yükseklik verin.

## Prop'lar

| Prop | Açıklama |
| --- | --- |
| `capacity` | Yalnızca `LibraryRoom`: 1-10, uygun oda bileşenini seçer |
| `defaultTimeOfDay` | `'auto'` (varsayılan, gerçek saati takip eder), `'day'`, `'evening'`, `'night'` |
| `onSpotClick(spot)` | Zemindeki mola halkasına tıklanınca: `{ id, label, position }` |
| `children` | Sahneye eklenecek 3D içerik (avatarlar) |
| `className`, `style` | Dış kapsayıcıya gider |

Avatar bileşenleri sahnenin içinde `useRoom()` ile koltukları (`seats`: `{ id, position, yaw }`)
ve mola noktalarını (`spots`) okur; `useTimeOfDay()` o anki ışık ayarını verir.

## Yapı

- `core/` tema bağımsız: `RoomCanvas` (kabuk), `VoxelMeshes` (instanced çizim), `SpotRings`, gün zamanı ayarları
- `library/parts.js` kütüphane mobilyaları (kutulardan), `buildLibrary.js` yerleşimi sahneye çevirir
- `library/LibraryRoom1..10.jsx` her kapasitenin kendi yerleşimi (`LAYOUT`)

Yeni tema (Kafe vb.): `core/`'u kullanan yeni bir klasör, kendi `parts.js` + `buildX.js` + `XRoom1..N.jsx`.

## Performans

- `frameloop="demand"`: sahne yalnızca sürükleme, zoom veya gün zamanı değişince çizilir; boştayken 0 GPU işi.
- Tüm oda 4 `InstancedMesh` (solid, cam, ampul, ışık havuzu) + halkalar: kare başına 5 draw call.
  En büyük oda (10 kişi) ~1200 kutu / ~15k üçgen.
- Gölge haritası yalnızca ışık değişince yeniden çizilir (`shadowMap.autoUpdate = false`).
  Avatarlar gibi hareketli gölge atan nesneler eklenince `gl.shadowMap.needsUpdate = true` yapılmalı.
- Işık sayısı sabit (en fazla 4 lamba ışığı), gün zamanı geçişinde shader yeniden derlenmez.
- Avatarlarda sürekli animasyon olacaksa animasyon karelerinde `invalidate()` çağrılmalı.
- three.js paketi büyük (~320 kB gzip); oda ekranını `React.lazy` ile ayrı yükleyin.

Önizleme: `npm run dev`, adres çubuğunda `?c=4&t=night` ile kapasite ve gün zamanı seçilebilir.
