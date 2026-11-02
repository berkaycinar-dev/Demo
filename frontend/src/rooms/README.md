# Odalar (izometrik 3D sahneler)

Her oda tek başına çalışan bir React bileşenidir: kamera, ışık, sürükle-döndür, +/− yakınlaştırma
ve Otomatik / Gündüz / Akşam / Gece düğmeleri bileşenin içindedir. Sayfaya koymak yeterli.

Temalar: `library` (Kütüphane), `cabin` (Dağ Evi, şömineli), `office` (Yazılım Ofisi, plaza),
`teagarden` (Çay Bahçesi, deniz manzaralı), `camp` (Kamp, göl kenarı), `space` (Uzay İstasyonu),
`underwater` (Sualtı Araştırma Üssü), `bar` (Bar, yağmurlu sokağa bakan), `treehouse` (Ağaç Ev, ormanda), `cyber` (Siber Loft, neon megakent), `alchemist` (Simyacı Odası, taş kule).
Her temada 1-10 kişilik oda var.

```jsx
import { LibraryRoom, LibraryRoom4 } from './rooms/library'
import { CabinRoom } from './rooms/cabin'
import { OfficeRoom } from './rooms/office'
import { TeaGardenRoom } from './rooms/teagarden'
import { CampRoom } from './rooms/camp'
import { SpaceRoom } from './rooms/space'
import { UnderwaterRoom } from './rooms/underwater'
import { BarRoom } from './rooms/bar'
import { TreehouseRoom } from './rooms/treehouse'
import { CyberRoom } from './rooms/cyber'
import { AlchemistRoom } from './rooms/alchemist'

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
| `capacity` | Yalnızca `LibraryRoom` / `CabinRoom` / `OfficeRoom` / `TeaGardenRoom` / `CampRoom` / `SpaceRoom` / `UnderwaterRoom` / `BarRoom` / `TreehouseRoom` / `CyberRoom` / `AlchemistRoom`: 1-10, uygun oda bileşenini seçer |
| `reducedMotion` | Tüm temalar: animasyonu durdurur (varsayılan: işletim sistemi tercihi) |
| `defaultTimeOfDay` | `'auto'` (varsayılan, gerçek saati takip eder), `'day'`, `'evening'`, `'night'` |
| `onSpotClick(spot)` | Zemindeki mola halkasına tıklanınca: `{ id, label, position }` |
| `children` | Sahneye eklenecek 3D içerik (avatarlar) |
| `className`, `style` | Dış kapsayıcıya gider |

Avatar bileşenleri sahnenin içinde `useRoom()` ile koltukları ve mola noktalarını okur; `useTimeOfDay()` o anki
ışık ayarını verir.

- Koltuk (`seats`): `{ id, position, yaw, desk?, kind? }`. `desk` önündeki masadaki ana eşya, `kind` koltuk türü.
- Mola noktası (`spots`): `{ id, label, position, stations?, face? }`. `stations` eşyanın oturma, yatma, binme ya da
  durma noktalarıdır. Eşya tanımında, eşyanın çizildiği çerçevede yerel koordinatla verilir (`spot.stations`,
  `core/stations.js`). `face` ayaktakilerin döneceği yön (eşyaya doğru).
- Kapı önlerinde mola noktası yok.
- Kamp ayrıca çadırları verir (`beds`: giriş, iç, tepe); uzaktakiler çadıra girip uyur.

Yeni bir eşyaya mola noktası eklerken kişinin orada ne yapacağı `src/avatars/activities.js`'e yazılır.
Hazır avatar sistemi `src/avatars/` içinde (`AvatarCrowd` odanın çocuğu olarak verilir; bkz. `src/avatars/README.md`).
Yürünebilir alan odanın voxel katmanlarından çıkarılır; yeni bir tema ya da düzen eklenince `.claude/room-tools/check_nav.mjs`
ile her koltuğun kalkış noktası ve mola yerlerinin erişilebilirliği denetlenmeli.

## Yapı

- `core/` tema bağımsız: `RoomCanvas` (kabuk), `VoxelMeshes` (instanced çizim), `SpotRings`, gün zamanı ayarları,
  `AnimationTicker` (temanın tüm efektlerine ortak kare zamanlayıcısı), `SteamEffect` (semaver, çaydanlık, kahve
  makinesi buharı; tüm temalar paylaşır). `RoomCanvas`'ın `lamps` dizisi `[x, y, z]` ya da `{ position, color }` alır;
  renk verilmezse gün zamanı ayarındaki `lampColor` kullanılır. Builder'daki `glow(x, y, z, w, d, color)` ışık havuzunu
  bu renkle boyar (renk `lampColor` ile çarpılır).
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
- `underwater/` aynı yapı: `parts.js` (pirinç çerçeveli sekizgen lombozlar ve arkalarında deniz, basınç kapısı, dalış
  giysisi, kahve köşesi, numune rafı, yosun bahçesi, lomboz masası, yuvarlak sonar masası, lomboz altı kanepe, denizanası
  tankı, batiskaflı dalış havuzu, tüp kafesi...), `buildUnderwater.js`, `UnderwaterRoom1..10.jsx`. Derin deniz habitatı;
  uzay istasyonundan farklı düzen: arka duvarda soldan sağa lombozlar (altında tek kişilik lomboz masası ya da önünde mola
  halkası), dalış giysisi, kahve köşesi, numune rafı (7+), yosun bahçesi (eşit aralıkla); ortada yuvarlak sonar masası,
  koltuklar çevresinde (2-6 kişi, ilki kameraya dönük); sol duvarda basınç kapısı, lomboz (2-5) ya da lomboz altı kanepe
  (6+), sol önde batiskaflı dalış havuzu (4+); sağda denizanası tankı, sağ önde tüp kafesi (5+). Koltuklar: lomboz masaları
  (1, 7-10) + sonar masası. Her lombozun arkasındaki deniz duvar kalınlığı içinde sığ bir dioramadır (kamera dönünce
  derinlik verir); açıklık dışına taşan balık ve yosunlar duvar gövdesinin içinde kalır.
- `bar/` aynı yapı: `parts.js` (yağmurlu sokağa bakan sürgülü pencereler, giriş kapısı, dart, aynalı ve neon tabelalı
  arka bar, taburelerli tezgâh, deri sedirler, vantilatörlü yuvarlak masa, müzik kutusu, bilardo masası...), `buildBar.js`,
  `BarRoom1..10.jsx`. Düzen her odada aynı: arka duvarda soldan sağa giriş kapısı, dart (4+), arka bar ve önündeki tezgâh,
  müzik kutusu (eşit aralıkla); sol duvarda pencereler ve pencere altında sedirler (6+), ortada yuvarlak masa (4+), sağda
  bilardo masası (8+), bilardo olmayan odalarda müzik kutusunun önünde büyük saksı, orta-önde ayakta masa (7+, mola yeri).
  Koltuklar: tabureler + sedirler + masa.
- `treehouse/` aynı yapı: `parts.js` (tahta kaplama duvarlar, ormana bakan açık pencereler, zemindeki giriş kapağı ve
  merdiven, kasa kitaplık, kakao köşesi, hamak, odayı delip geçen ağaç gövdesi ve dalları, kütük masa ve tabureler, minder
  köşesi, teleskop...), `buildTreehouse.js`, `TreehouseRoom1..10.jsx`. Düzen her odada aynı: arka duvarda soldan sağa giriş
  kapağı, kitaplık (3+), kakao köşesi (5+), gövdeye bağlı hamak ve sağ arka köşede gövde (eşit aralıkla); sol duvarda
  pencereler ve her birinin altında tabureli masa, ortada kilim üstünde kütük masa (3-5, 2 kişi) ya da büyük yuvarlak kütük
  masa (6+, 4 kişi), sağda teleskop, sağ önde minder köşesi (8+), sol önde kütük bank (9+). Koltuklar: pencere masaları +
  kütük masa + minder köşesi (2). Kitaplığın önü de mola yeri.
- `cyber/` aynı yapı: `parts.js` (yerden tavana panoramik pencere ve gece kenti, zırhlı kayar kapı, sunucu kabinleri, veri
  duvarı, veri akışı sütunları, drone yuvası, "ODAK" neonlu ramen otomatı, kapsül masa ve sandalyeler, hologram masası, yumurta
  koltuklu lounge, VR istasyonu, bonsai teraryumu...), `buildCyber.js`, `CyberRoom1..10.jsx`. Düzen her odada aynı: sol duvar
  panoramik pencere ve önünde kapsül masalar; arka duvarda soldan sağa kapı, sunucular (3+), veri duvarı (5+), drone yuvası ve
  otomat (eşit aralıkla, geniş boşluklarda veri akışı sütunu); ortada hologram masası (3-5, 2 kişi) ya da uzun hologram adası
  (6+, 4 kişi), sağda VR istasyonu, sağ önde lounge (8+), lounge olmayan orta odalarda bonsai teraryumu. Koltuklar: kapsül
  masalar + hologram masası / adası + lounge (2). Sunucuların önü ve (yer varsa) sol-önde pencere kenarı mola yeri.
  Neonlar `bulb` katmanında; tema `bulb` ve `lampColor`'ı beyaz tutar, lambalar ve ışık havuzları kendi rengini taşır.
- `alchemist/` aynı yapı: `parts.js` (kaba taş duvar ve döşeme, meşe kirişler, sivri kemerli kurşun çerçeveli pencereler,
  kemerli kapı, kitaplık, baykuşlu iksir dolabı, imbikli simya tezgâhı, duvar şamdanları, gotik sandalyeli okuma ve çalışma
  masaları, ocak üstünde kazan, rün çemberli kristal küre, gök küresi, berjerli okuma köşesi...), `buildAlchemist.js`,
  `AlchemistRoom1..10.jsx`. Düzen her odada aynı: sol duvarda pencereler ve altlarında okuma masaları; arka duvarda soldan
  sağa kapı, kitaplık, iksir dolabı (3+), simya tezgâhı (7+) (eşit aralıkla, geniş boşluklarda şamdan); sağ arka köşede kazan,
  sağda kristal küre, ortada halı üstünde çalışma masaları (3+), sağ önde okuma köşesi (8+), olmayan orta odalarda gök küresi.
  Koltuklar: okuma masaları + çalışma masaları (2'şer) + okuma köşesi (2). Duvara asılan düz eşyalar, 1 cm taşan taşların
  önünde kalsın diye en az 1.2 cm önde durur.
- Tema kendi gün zamanı renklerini `RoomCanvas`'ın `presets` prop'u ile verir (bkz. `CabinScene.jsx`)
- `night` katmanı yalnızca akşam/gece görünür (ofisteki şehir ışıkları, çay bahçesinde karşı kıyı ve ay, kampta yıldızlar, istasyonda zemin yönlendirme LED'leri ve gezegendeki şehir ışıkları, sualtı üssünde parlayan plankton, barda karşı binanın pencereleri ve sokak lambası, ağaç evde pencerelerdeki ay ve yıldızlar, Siber Loft'ta kulelerin ışıklı pencere şeritleri, simyacı odasında ay ve uzak kulenin penceresi); görünürlüğü `nightLights` ayarından gelir

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
- Sualtı üssünde lombozların ardında geçen balık sürüleri ve kaplumbağa, salınan yosunlar, yükselen kabarcıklar ve
  denizanaları; içeride denizanası tankı, sonar masasında dönen tarama çizgisi, yanıp sönen hedefler ve masanın üstünde
  daire çizen balina hologramı, batiskafın pervanesi ve havuzdaki parıltılar (`underwater/ReefEffect.jsx`) ile kahve buharı
  tek zamanlayıcıyla saniyede 12 kare ister (~11-12 draw call/kare, efektin tamamı 2 instanced mesh; deniz tarafı suyun gün
  zamanı rengini alır). `reducedMotion` ile durur. En büyük oda ~1290 kutu, en fazla 2 nokta ışık.
- Barda pencerelerde yağan yağmur ve camdan süzülen damlalar, titreyen "BAR" neonu, müzik kutusunda yürüyen ışıklar, mum
  alevi, dönen tavan vantilatörü (`bar/BarEffect.jsx`) ve kahve fincanlarının buharı tek zamanlayıcıyla saniyede 12 kare
  ister (~10 draw call/kare, efektin tamamı 3 instanced mesh). `reducedMotion` ile durur. En büyük oda ~1170 kutu, en fazla
  3 nokta ışık.
- Ağaç evde pencerelerden düşen yapraklar, gece ateş böcekleri, kavanozdaki ateş böcekleri, yanıp sönen süs ampulleri,
  fener alevleri, salınan hamak ve rüzgâr çanı, başını sallayan kuş, gövde boyunca süzülen yapraklar
  (`treehouse/TreehouseEffect.jsx`) ve kakao buharı tek zamanlayıcıyla saniyede 12 kare ister (~10 draw call/kare, efektin
  tamamı 4 instanced mesh; ateş böcekleri yalnızca akşam/gece çizilir). `reducedMotion` ile durur. En büyük oda ~1450 kutu,
  en fazla 3 nokta ışık.
- Siber Loft'ta pencerede iki şeritte akan uçan araçlar, ikaz lambaları ve iki renkli reklam panoları, sunucu LED'leri, veri
  duvarında çubuk grafik / radar taraması / kayan satırlar, veri akışı sütunları, holo ekranlar, dönen hologram küreler ve tarama
  halkaları, titreyen "ODAK" neonu, süzülen drone (`cyber/CyberEffect.jsx`) ve kahve / erişte buharı tek zamanlayıcıyla saniyede
  12 kare ister (~10 draw call/kare, efektin tamamı 3 instanced mesh). `reducedMotion` ile durur. En büyük oda ~850 kutu, en
  fazla 3 renkli nokta ışık (eflatun, kehribar, camgöbeği).
- Simyacı odasında mum ve ocak alevleri, kıvılcımlar, kazanda ve şişelerde kabarcıklar, kazandan yükselen yarı saydam yeşil
  duman, imbikten damlayan iksir, sırayla yanan rünler, kristal kürenin nabız gibi atan çekirdeği ve çevresindeki ışıltılar,
  süzülen kitaplar ve mumlar, başını çeviren baykuş, dönen gök küresi, pencerelerde bulutlar ve gece parıldayan yıldızlar
  (`alchemist/AlchemyEffect.jsx`) ile çay buharı tek zamanlayıcıyla saniyede 12 kare ister (~12 draw call/kare, efektin tamamı
  5 instanced mesh; yıldızlar yalnızca akşam/gece çizilir). `reducedMotion` ile durur. En büyük oda ~1670 kutu, en fazla 3
  renkli nokta ışık (kazan yeşil, kristal mor, masa mumu).
- three.js paketi büyük (~320 kB gzip); oda ekranını `React.lazy` ile ayrı yükleyin.

Önizleme: `npm run dev`, adres çubuğunda `?theme=office&c=4&t=night` ile tema (`library`, `cabin`, `office`, `teagarden`, `camp`, `space`, `underwater`, `bar`, `treehouse`, `cyber`, `alchemist`), kapasite ve gün zamanı seçilebilir.
Simyacı odası şimdilik seçim listelerinde gizli (`themes.js`'te `hidden: true`, listeler `LISTED_THEMES`'i okur); dosyaları
duruyor, `?theme=alchemist` ile açılır ve o temayla kurulmuş odalar çalışmaya devam eder.
Parametresiz adres sitenin sade test arayüzünü açar (`src/site/`): Lobi, Odam, Oda oluştur (tema ve kapasite seçimi, canlı
3D önizleme), Avatarım (avatar atölyesi). `&people=mix` odayı avatarlarla açar (bkz. `src/avatars/README.md`). Temaların listesi (ad, kısa açıklama, oda bileşeni, en büyük kapasite) `themes.js` içinde; iki taraf da onu okur.
