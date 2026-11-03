# Avatarlar

Voxel avatarlar: özelleştirme, odalarda oturma / çalışma / uyuma / mola ve atölye önizlemesi.

```jsx
import AvatarCrowd from './avatars/AvatarCrowd'
import useRoomPeople from './avatars/useRoomPeople'

const { occupants, setMyStatus } = useRoomPeople({ capacity: 6, seed: 42, me: myAvatar })

<LibraryRoom capacity={6} onSpotClick={(spot) => setMyStatus('break', spot.id)}>
  <AvatarCrowd occupants={occupants} theme="library" showNames={false} highlight={hoveredId} />
</LibraryRoom>
```

## Dosyalar

- `options.js`: seçenekler ve renk paletleri.
  - Beden (`body`: erkek | kadın). Kadında ince bel ve geniş kalça, ince kalkık kaş, kirpik, dolgun dudak; erkekte kalın kaş. Sakal ve bıyık yalnızca erkekte.
  - Saç (19 model, `for`: erkek / kadın / ikisi; `hairStylesFor(body)`), saç rengi (11), sakal (8), bıyık (6).
  - Kıyafet: üst, alt, renkleri, ayakkabı.
  - Aksesuar, bölgeye göre birer tane: başlık (`HATS`; Şapka: bere, kep, Fransız beresi, fötr, silindir, kovboy; Fantastik: büyücü, taç, Viking miğferi, kedi kulakları, çiçek tacı) ve rengi, kulaklık, gözlük (kare, yuvarlak, güneş, monokl), boyun (atkı, papyon, kravat, kolye), bilek (saat, akıllı saat, bileklik), küpe (taşlı, halka, sallantılı), metal rengi (taç, küpe, kolye, saat).
  - Kulaklık yalnızca bere, kep ya da başlıksızken (`HEADPHONE_HATS`). Uzun düz, dalgalı ve küt saç kulakları örter; küpe o zaman (ve kulaklıkla) görünmez.
  - `DEFAULT_AVATAR`, `sanitizeAvatar` (eski `accessories` listesini ve bıyıklı eski sakalları yeni alanlara çevirir), `resolveConflicts` (son değişen kalır), `randomAvatar`.
- `model.js`: kemik hiyerarşisi (`BONES`) ve yapılandırmadan kutu parçaları (`buildAvatarParts`).
  - Ölçüler tasarım biriminde yazılır, `SCALE` (0.85) ile küçültülür. Avatar ayakta ~1.2 m, +z yönüne bakar.
  - Saçlar `hairParts`, başlıklar `HAT_KINDS` içinde; kutular min/max aralıklarıyla (`box`). Örten başlıklar saçın tepe parçalarını gizler; taç, çiçek tacı ve kedi kulağı saçın üstüne oturur ve saçın dış sınırına göre boyutlanır (`fit`).
  - `parts.crown`: başın (şapka dahil) en üstü; etiket ve zZz bunun üstünde durur.
  - Eşyalar da parça olarak durur, yalnızca o pozda görünür (`PROPS`): açık kitap, tablet, kalem, tüy kalem, kupa, çay bardağı, karton bardak, simit, ramen, telefon, dart, ıstaka, raket, kepçe, iksir şişesi, VR gözlüğü, sulama kabı, olta, taş, gazete.
  - Kitap ve kupa rengi kişiye göre değişir (`seed`). `props` verilirse yalnızca o odada kullanılan eşyalar kurulur.
- `poses.js`: procedural pozlar.
  - Oturuşlar `sit` nesnesiyle verilir: `{ y, low?, slope?, rise?, edge?, near?, far?, item?, front? }`. Sandalye, eğik oturak (kütük, kanepe) ve minderde bağdaş.
  - Masadaki eller iki kemikli ters kinematikle (`reach`) yerleşir: klavyede eller tuşların, kitapta sayfa köşelerinin üstünde. Önkol masaya giriyorsa dirsek dışa ve yukarı açılır (`deskReach`). Yetişmezse önce biraz eğilir, sonra oturakta öne kayar (`leanToward`). Masaya eğilen başta çene ve sakal masanın üstünde kalır (`chinUp`); masada uyurken baş kolların üstünde.
  - Derin oturakta (sedir, kanepe, koltuk) dizler oturağın ön kenarına (`front`) taşacak kadar öne oturulur; baldırlar tabana girmez.
  - Çalışma: klavye, masadaki ekrana dokunma, masadaki açık kitabı okuma, not alma, elde kitap ya da tablet, düşünme (çene elde).
  - Uyuma: masaya kapanma, arkaya yaslanma (eller kucakta), yüzde gazete, göğüste kitap, hamakta yatma.
  - Mola (`STAND_POSES`): etrafa bakınma, gerinme, içecek, yemek, manzara, cama uzanma, eğilip bakma, çömelme, panel, pano, katalog, el ısıtma, telefon, dans, dart, bilardo, masa tenisi, teleskop, kazan karıştırma, kristal küre, iksir, VR, sulama, olta, taş sektirme, çeşmeden içme, koşu.
  - Pozlar arası geçiş `blendPose` ile yumuşar.
- `activities.js`: oda ve yere göre davranış.
  - `THEME_STYLES`: temanın elde tuttuğu (kitap | tablet), yazı aracı (kalem | tüy kalem) ve uyuma biçimi (`desk`, `lean`, `newspaper`, `tent`).
  - `SPOT_ACTIVITIES`: mola yeri kimliği → ayaktaki hareket, elde tutulan, varsa oturulan / yatılan / binilen yerdeki hareket. Temaya özel farklar `THEME_SPOTS`'ta.
  - `seatBehavior`: koltuğun önündeki masada ne olduğuna (`seat.desk`) ve koltuk türüne (`seat.kind`) göre çalışma ve uyuma.
- `render.js`: kemik matrisleri ve parçaların tek `InstancedMesh`'e yazılması.
- `nav.js`: odanın voxel katmanlarından yürünebilir alan ızgarası (10 cm hücre) ve A* yol bulma.
  - Zemin: üstü -8..+7 cm arası ince kutular. Engel: üstü 7 cm'den yüksek, altı 1.5 m'den alçak kutular. Engeller avatar yarıçapı (24 cm) kadar şişirilir.
  - Yalnızca y ekseninde dönmüş kutular gerçek taban iziyle işaretlenir.
  - Kalkış ve duruş yerleri yalnızca en büyük bağlı bölgeden seçilir (eşya arkasındaki ceplere düşmez).
  - `seatExit`: koltuktan kalkış noktası.
  - `deskInfo`: koltuğun önündeki masanın yüzeyi, ön kenarı ve üstündeki eşyanın (klavye, kitap, defter) yakın / uzak kenarı. `seatFront`: oturak tabanının ön kenarı. Eğik (x/z ekseninde dönmüş) kutular `tilt` ile işaretlenir.
  - `spotSlots`: mola yerinin en fazla iki yeri.
    - Önce eşyanın kullanım noktaları (`spot.stations`), sonra ayakta duruş yerleri. Ayaktakiler `spot.face` yönüne (eşyaya) döner; yoksa en yakın engele.
    - Kullanım noktası birkaç santimle yürünemez alana düşerse 30 cm içindeki en yakın yürünebilir yere kayar.
    - Kullanılan eşyalarda ayaktakiler eşyaya yaklaşır. Göl ve denizde manzaraya dönülür.
    - İki yerden biri doluyken öbürüne de dışarıdan ulaşılabilmelidir. Ulaşılamıyorsa yer tek kişiliktir (kamp 7–8 hamak).
  - `findRefuge`: karşıdan gelene yol vermek için kenara çekilinecek boş yer.
- `AvatarCrowd.jsx`: odadaki avatarlar. Odanın çocuğu olarak kullanılır; koltukları, mola noktalarını ve katmanları `useRoom()` ile okur.
  - Odakta olan, koltuğa ve masaya göre çalışır (kütüphanede masadaki açık kitabı okur, ofiste klavyede yazar, kampta elde kitap okur).
  - Uzakta olan temaya göre uyur, başının üstünde zZz çıkar. Koltukta göğüste açık kitapla (tabletli temalarda yalnızca
    arkaya yaslanarak) uyur. Kampta çadıra girip uyur; zZz ve etiket çadırın üstündedir.
  - Molada olan kalkıp en yakın boş mola yerine (ya da tıklanan halkaya) yürür ve oradaki eşyaya göre davranır. Her yerde en fazla iki kişi olur; dolu yerin yerine sıradakine gidilir.
    - Kanepe, bank, sedir, piknik masası, dağ evinde şöminenin önündeki koltuklar, kütüphane ve dağ evinde pencere minderi,
      sualtında lomboz altı kanepe, ağaç evde kütük bank: oturur, içer, kitap okur ya da telefona bakar.
    - Barda ayakta masa: masanın iki yanında durup içer.
    - Her odada mola yerlerinin toplam kişi yeri kapasiteye yeter (herkes molaya kalksa da yerinde kalan olmaz).
    - Oturulan, yatılan ve binilen yerler ayakta duruş yerlerinden önce dolar.
    - Hamak: kumaşın kavisine uyarak yatar (kalça altta, gövde ve bacaklar yukarı). Ağaç evde hamakla birlikte salınır.
    - Koşu bandı ve VR platformu: üstüne çıkar.
    - Bilardo: ıstaka elde, masanın üstünden göğüs hizasında. Masa tenisi: masanın iki ucunda, raket masa üstü hizasında.
  - Yürürken çakışma önleme:
    - Yürüyen biriyle 0.5 m, duran biriyle 0.42 m arada kalır.
    - Aynı yöne gidenden geride olan bekler.
    - Karşı karşıya gelindiğinde sırası sonra olan kenara çekilip yol verir.
    - Duran birinin etrafından yeni yol aranır. Sırası sonra olan bekleyenler, öndekinin yolundan çekilir.
  - Aynı mola yerine giden iki kişi birbirinin önünden geçecekse yerler değişir.
  - Öbür yerde duran kişi gelenin yolunu kapatıyorsa içerideki yere kayar.
  - 6 sn ilerleyemeyen başka bir mola yerine gider. 15 sn'den uzun takılan (denemelerde hiç olmadı) diğerlerini yok sayar.
  - Kalkışlar kişiye göre 0.2–1.8 sn gecikmeli. Kalkış noktasında ayakta biri varsa kalkış ertelenir.
  - Etiketler tuvalin üstünde DOM katmanıdır. Varsayılan olarak yalnızca durum noktası görünür; durum hem renkle hem biçimle ayrılır:
    - odakta: yeşil, dolu yuvarlak
    - molada: sarı baklava
    - uzakta: gri, içi boş halka

    Kendi adın ("Sen") hep görünür. Avatarın ya da noktanın üstüne gelince, `highlight` verilince ve `showNames` açıkken ad açılır. Üst üste binenler yukarı itilir.
- `useRoomPeople.js`: kendin ve koltukları dolduran simüle edilmiş oda arkadaşları. Arkadaşların durumu kendi kendine değişir; `forced` ile herkes sabit bir durumda tutulur.
- `AvatarPreview.jsx`: atölyedeki 3D önizleme.
  - Platformda, masa başında ya da ayakta duran karakter; sürükleyerek döndürülür.
  - Pozlar: Odakta (masadaki kitabı okuma ya da bilgisayar), Molada (içecek, telefon, gerinme, dans, manzara sırayla), Uzakta, Yürüyüş.
- `AvatarLab.jsx`: geliştirme sayfası (`?lab=avatars`). Bütün hareketler bir arada.
  - `?lab=avatars&only=sip,pool&zoom=1.5` yalnızca seçilenleri yakından gösterir.

## Odaların sağladığı veri

- Koltuk: `{ position, yaw, desk?, kind? }`.
  - `desk`: önündeki masadaki ana eşya (`book`, `notebook`, `laptop`, `keyboard`, `screen`, `tea`).
  - `kind`: koltuk türü (`chair`, `stool`, `bench`, `armchair`, `cushion`, `log`, `stump`).
- Mola noktası: `{ id, label, position, stations? }`. `stations` eşyanın kullanım noktalarıdır: `{ position, yaw, kind: 'sit' | 'lie' | 'mount' | 'stand', swing? }`.
  - Odalar bunları eşya tanımında yerel koordinatla verir (`spot.stations`, `rooms/core/stations.js`).
- Kamp: `beds`. Her çadırın girişi, içi ve tepesi.

## Performans

- Bir odadaki tüm avatarlar tek instanced mesh. Yalnızca o odada kullanılan eşyalar kurulur.
- zZz ve gölgeler ayrı birer mesh; toplam 3 draw call.
- 10 kişilik odada GPU süresi avatarsız odayla aynı aralıkta (p50 2.6–3.5 ms, ölçüm gürültüsü içinde).
- Yürüyen varken saniyede 30 kare istenir. Boştaki hareketleri temanın kendi zamanlayıcısı (12 fps) çizer.
- `reducedMotion` (ya da sistemdeki "hareketi azalt"): avatarlar yürümeden yerlerine geçer, hareketler durur. Kimsenin durumu değişmiyorsa boşta 0 kare çizilir.
- Yol bulma yalnızca hedef değişince ya da önü kapanınca çalışır.
- Gölge, bulunduğu yerdeki zeminin (halı, kilim dahil) 5 mm üstüne çizilir; yüzeyle aynı düzleme düşmez.

## Çakışma denetimi

`.claude/room-tools/check_avatar.mjs` (frontend klasörüne kopyalanıp çalıştırılır) avatarda z-fighting arar. Aynı yöne bakan, aynı düzlemde (1 mm içinde) üst üste binen ve farklı renkli yüzleri bulur.

- 3734 yapılandırma, iki beden için bölge bölge: saç × başlık × kulaklık, saç × sakal × bıyık, saç × gözlük × küpe, sakal × bıyık × gözlük × başlık, üst × alt × boyun, üst × bilek.
- 350 poz denetimi: kemikler arası, eşyalarla birlikte, 7 örnek avatarla.

`.claude/room-tools/check_desk.mjs [tema]` (frontend'e kopyalanır; `AVATAR='{"hat":"wizard"}'` ile başka avatar) her odadaki her koltukta ve mola oturağında çalışma / uyku / oturma pozlarında avatar parçalarının odadaki kutulara girip girmediğini ölçer (koltuğun kendisi ve eğik kutular sayılmaz).

Başka bir kutunun içinde kalan yüzler sayılmaz. Şu an çakışma yok.

## Önizleme

`?theme=library&c=8&people=mix` adresi odayı avatarlarla açar. `people` değerleri:

- `mix`: durumlar kendi kendine değişir.
- `focus`, `break`, `away`: herkes o durumda sabit kalır.
- `wave`: herkes 12 saniyede bir birlikte molaya kalkıp geri oturur (kalabalık testi).

`names=1` herkesin adını gösterir.
