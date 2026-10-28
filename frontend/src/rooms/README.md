# Odalar (izometrik 3D sahneler)

Her oda tek başına çalışan bir React bileşenidir: kamera, ışık, sürükle-döndür, +/− yakınlaştırma
ve Otomatik / Gündüz / Akşam / Gece düğmeleri bileşenin içindedir. Sayfaya koymak yeterli.

Temalar: `library` (Kütüphane), `cabin` (Dağ Evi, şömineli), `office` (Yazılım Ofisi, plaza),
`teagarden` (Çay Bahçesi, deniz manzaralı), `camp` (Kamp, göl kenarı), `space` (Uzay İstasyonu).
Her temada 1-10 kişilik oda var.

```jsx
import { LibraryRoom, LibraryRoom4 } from './rooms/library'
import { CabinRoom } from './rooms/cabin'
import { OfficeRoom } from './rooms/office'
import { TeaGardenRoom } from './rooms/teagarden'
import { CampRoom } from './rooms/camp'
import { SpaceRoom } from './rooms/space'

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
| `capacity` | Yalnızca `LibraryRoom` / `CabinRoom` / `OfficeRoom` / `TeaGardenRoom` / `CampRoom` / `SpaceRoom`: 1-10, uygun oda bileşenini seçer |
| `reducedMotion` | Tüm temalar: animasyonu durdurur (varsayılan: işletim sistemi tercihi) |
| `defaultTimeOfDay` | `'auto'` (varsayılan, gerçek saati takip eder), `'day'`, `'evening'`, `'night'` |
| `onSpotClick(spot)` | Zemindeki mola halkasına tıklanınca: `{ id, label, position }` |
| `children` | Sahneye eklenecek 3D içerik (avatarlar) |
| `className`, `style` | Dış kapsayıcıya gider |

Avatar bileşenleri sahnenin içinde `useRoom()` ile koltukları (`seats`: `{ id, position, yaw }`)
ve mola noktalarını (`spots`) okur; `useTimeOfDay()` o anki ışık ayarını verir.

## Yapı

- `core/` tema bağımsız: `RoomCanvas` (kabuk), `VoxelMeshes` (instanced çizim), `SpotRings`, gün zamanı ayarları,
  `AnimationTicker` (temanın tüm efektlerine ortak kare zamanlayıcısı), `SteamEffect` (semaver, çaydanlık, kahve
  makinesi buharı; tüm temalar paylaşır)
- `library/parts.js` kütüphane mobilyaları (kutulardan), `buildLibrary.js` yerleşimi sahneye çevirir
- `library/LibraryRoom1..10.jsx` her kapasitenin kendi yerleşimi (`LAYOUT`). Düzen her odada aynı: arka duvar
  boydan kitaplık (8+ kişide ortada büst nişi), sol-arkada küre, sağ-arkada saksı ve kart kataloğu, sol duvarda
  pencere önü bank ve sol-önde okuma köşesi, sağ kenarda çay köşesi, 8+ kişide sağ-önde el yazması vitrini.
- `cabin/` aynı yapı: `parts.js` (kütük duvar, taş şömine, karlı pencere...), `buildCabin.js`, `CabinRoom1..10.jsx`.
  Şömine arka duvarın ortasında, berjerler iki yanında ateşe dönük; solunda odun askısı, sağında kayaklar ve
  köknar; sol duvarda pencere önü oturma, gitar ve kanepe; sağ kenarda kakao köşesi.
- `office/` aynı yapı: `parts.js` (cam cephe + şehir silüeti, bench masalar, kahve barı...), `buildOffice.js`, `OfficeRoom1..10.jsx`.
  Arka duvarda soldan sağa görev panosu, çıta panel ve dolap, ekran, su sebili, kahve barı; sol-önde lounge
  (kanepe ve karşısında armut koltuklar), 8+ kişide sağ-önde masa tenisi.
- Her temada ön kenar boş kalır (kamerayı kapatmaz); eşyalar duvara ya da kendi köşesine dayalı, yüzü odaya dönük.
- `teagarden/` aynı yapı: `parts.js` (deniz manzaralı korkuluk, semaverli çay ocağı, ince belli bardaklar,
  ampul zincirleri, çınar, simitçi, süs havuzu...), `buildTeaGarden.js`, `TeaGardenRoom1..10.jsx`.
  Tüm odalarda köşeler aynı: çay ocağı sol-arka, deniz kenarı sol-ön, kedi sağ-ön, ağaç sağ-arka;
  oda büyüdükçe menü panosu, simitçi, sedir köşesi, çiçeklik ve havuz eklenir.
- `camp/` aynı yapı: `parts.js` (çimen ada + göl kesiti, çam/huş ormanı, taş çemberli ateş, kütük bank,
  çadırlar, iskele, kano, hamak...), `buildCamp.js`, `CampRoom1..10.jsx`. Düzen her odada aynı:
  solda göl, arkada orman, ortada ateş çemberi (koltuklar ateşe bakar, ön taraf kameraya açık),
  sağda çadırlar; oda büyüdükçe iskele, piknik masası, kano, tabela ve hamak eklenir.
- `space/` aynı yapı: `parts.js` (gezegen manzaralı gözlem penceresi, hava kilidi, uzay giysisi, kontrol paneli,
  hologramlı görev masası, hidroponik bahçe, koşu bandı...), `buildSpace.js`, `SpaceRoom1..10.jsx`. Düzen her odada
  aynı: sol duvar pencere, arka duvarda soldan sağa hava kilidi, giysi, kontrol paneli, ikmal otomatı, kargo rafı,
  hidroponik bahçe (eşit aralıkla), ortada görev masası, sağ kenarda spor köşesi; oda büyüdükçe koşu bandı,
  teleskop, bisiklet, pencere önü bank, kargo rafı ve zemin penceresi eklenir.
- Tema kendi gün zamanı renklerini `RoomCanvas`'ın `presets` prop'u ile verir (bkz. `CabinScene.jsx`)
- `night` katmanı yalnızca akşam/gece görünür (ofisteki şehir ışıkları, çay bahçesinde karşı kıyı ve ay, kampta yıldızlar, istasyonda zemin yönlendirme LED'leri ve gezegendeki şehir ışıkları); görünürlüğü `nightLights` ayarından gelir

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
- Kütüphanede çay buharı ve gerçek saati gösteren duvar saati (`library/ClockEffect.jsx`, saniye ibresi işler)
  tek zamanlayıcıyla saniyede 10 kare ister (~8 draw call/kare). `reducedMotion` prop'u ya da işletim
  sistemindeki "hareketi azalt" ayarı animasyonu durdurur; o zaman boşta yine 0 kare çizilir.
- Dağ evinde şömine ateşi (`cabin/FireEffect.jsx`), pencerelerde yağan kar (`cabin/SnowEffect.jsx`) ve kakao
  buharı tek zamanlayıcıyla saniyede 15 kare ister (~10 draw call/kare, gölge yeniden çizilmez). `reducedMotion` ile durur.
- Ofiste monitör imleçleri, gökdelen ikaz lambaları (`office/BlinkEffect.jsx`) ve espresso buharı tek
  zamanlayıcıyla saniyede 10 kare ister (~8 draw call/kare). `reducedMotion` ile durur.
- Çay bahçesinde semaver buharı ve manzaradaki hareketler
  (`teagarden/SeaViewEffect.jsx`: vapur, yelkenli, martı, yanıp sönen kıyı ışıkları) tek bir
  zamanlayıcıyla saniyede 12 kare ister (~8-9 draw call/kare). `reducedMotion` ile durur.
  Her ampul zinciri bir nokta ışık; en büyük oda ~2050 kutu / ~25k üçgen.
- Kampta ateş (`camp/CampfireEffect.jsx`: alev, kıvılcım, titreyen ışık) ile ateş böcekleri ve parlayan
  yıldızlar (`camp/NightLifeEffect.jsx`, yalnızca akşam/gece) tek zamanlayıcıyla saniyede 15 kare ister
  (~9 draw call/kare). `reducedMotion` ile durur. En büyük oda ~1250 kutu, en fazla 3 nokta ışık.
- Uzay istasyonunda dönen hologram, pencerede süzülen uydu, ekrandaki tarama çizgisi ve yanıp sönen tuş /
  durum ışıkları / yıldızlar (`space/StationEffect.jsx`) tek zamanlayıcıyla saniyede 12 kare ister (~9 draw call/kare,
  efektin tamamı 2 instanced mesh). `reducedMotion` ile durur. En büyük oda ~1150 kutu, en fazla 3 nokta ışık.
- three.js paketi büyük (~320 kB gzip); oda ekranını `React.lazy` ile ayrı yükleyin.

Önizleme: `npm run dev`, adres çubuğunda `?theme=office&c=4&t=night` ile tema (`library`, `cabin`, `office`, `teagarden`, `camp`, `space`), kapasite ve gün zamanı seçilebilir.
