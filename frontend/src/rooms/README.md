# Odalar (izometrik 3D sahneler)

Her oda tek başına çalışan bir React bileşenidir: kamera, ışık, sürükle-döndür, +/− yakınlaştırma
ve Otomatik / Gündüz / Akşam / Gece düğmeleri bileşenin içindedir. Sayfaya koymak yeterli.

Temalar: `library` (Kütüphane), `cabin` (Dağ Evi, şömineli), `office` (Yazılım Ofisi, plaza),
`teagarden` (Çay Bahçesi, deniz manzaralı).
Her temada 1-10 kişilik oda var.

```jsx
import { LibraryRoom, LibraryRoom4 } from './rooms/library'
import { CabinRoom } from './rooms/cabin'
import { OfficeRoom } from './rooms/office'
import { TeaGardenRoom } from './rooms/teagarden'

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
| `capacity` | Yalnızca `LibraryRoom` / `CabinRoom` / `OfficeRoom` / `TeaGardenRoom`: 1-10, uygun oda bileşenini seçer |
| `reducedMotion` | `CabinRoom` / `OfficeRoom` / `TeaGardenRoom`: animasyonu durdurur (varsayılan: işletim sistemi tercihi) |
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
- `cabin/` aynı yapı: `parts.js` (kütük duvar, taş şömine, karlı pencere...), `buildCabin.js`, `CabinRoom1..10.jsx`
- `office/` aynı yapı: `parts.js` (cam cephe + şehir silüeti, bench masalar, kahve barı...), `buildOffice.js`, `OfficeRoom1..10.jsx`
- `teagarden/` aynı yapı: `parts.js` (deniz manzaralı korkuluk, semaverli çay ocağı, ince belli bardaklar,
  ampul zincirleri, çınar, simitçi, süs havuzu...), `buildTeaGarden.js`, `TeaGardenRoom1..10.jsx`.
  Tüm odalarda köşeler aynı: çay ocağı sol-arka, deniz kenarı sol-ön, kedi sağ-ön, ağaç sağ-arka;
  oda büyüdükçe menü panosu, simitçi, sedir köşesi, çiçeklik ve havuz eklenir.
- Tema kendi gün zamanı renklerini `RoomCanvas`'ın `presets` prop'u ile verir (bkz. `CabinScene.jsx`)
- `night` katmanı yalnızca akşam/gece görünür (ofisteki şehir ışıkları, çay bahçesinde karşı kıyı ve ay); görünürlüğü `nightLights` ayarından gelir

Yeni tema: `core/`'u kullanan yeni bir klasör, kendi `parts.js` + `buildX.js` + `XRoom1..N.jsx`.

## Performans

- `frameloop="demand"`: sahne yalnızca sürükleme, zoom veya gün zamanı değişince çizilir; boştayken 0 GPU işi.
- Tüm oda 4 `InstancedMesh` (solid, cam, ampul, ışık havuzu) + halkalar: kare başına 5 draw call.
  En büyük oda (10 kişi) ~1200 kutu / ~15k üçgen.
- Kutular kameraya yakından uzağa sıralı yüklenir (`VoxelMeshes`): arkadaki zemin/duvar pikselleri
  derinlik testinde elenir. Büyük odada yakınlaşınca GPU süresi ~%40–55 düşer; yeni kutu katmanları
  da `InstancedLayer` üzerinden çizilirse sıralamayı otomatik alır.
- Çözünürlük `dpr` en fazla 1.5 (maliyet piksel sayısıyla büyür; 2x ekranda fark görünmez).
- Gölge haritası yalnızca ışık değişince yeniden çizilir (`shadowMap.autoUpdate = false`).
  Avatarlar gibi hareketli gölge atan nesneler eklenince `gl.shadowMap.needsUpdate = true` yapılmalı.
- Işık sayısı sabit (en fazla 4 lamba ışığı), gün zamanı geçişinde shader yeniden derlenmez.
- Avatarlarda sürekli animasyon olacaksa animasyon karelerinde `invalidate()` çağrılmalı.
- Dağ evinde şömine ateşi (`cabin/FireEffect.jsx`) saniyede en fazla 15 kare ister (~8 draw call/kare,
  gölge yeniden çizilmez). `reducedMotion` prop'u ya da işletim sistemindeki "hareketi azalt" ayarı
  animasyonu durdurur; o zaman boşta yine 0 kare çizilir.
- Ofiste monitör imleçleri ve gökdelen ikaz lambaları (`office/BlinkEffect.jsx`) saniyede 4 kare ister
  (~7 draw call/kare). `reducedMotion` ile durur.
- Çay bahçesinde semaver buharı (`teagarden/SteamEffect.jsx`) ve manzaradaki hareketler
  (`teagarden/SeaViewEffect.jsx`: vapur, yelkenli, martı, yanıp sönen kıyı ışıkları) tek bir
  zamanlayıcıyla saniyede 12 kare ister (~8-9 draw call/kare). `reducedMotion` ile durur.
  Her ampul zinciri bir nokta ışık; en büyük oda ~2050 kutu / ~25k üçgen.
- three.js paketi büyük (~320 kB gzip); oda ekranını `React.lazy` ile ayrı yükleyin.

Önizleme: `npm run dev`, adres çubuğunda `?theme=office&c=4&t=night` ile tema (`library`, `cabin`, `office`, `teagarden`), kapasite ve gün zamanı seçilebilir.
