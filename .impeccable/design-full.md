---
name: Odakhane
description: Kamerasız birlikte odaklanma odası; sıcak ahşap, kâğıt ve kil malzemeli arayüz, voxel odanın etrafında.
colors:
  terracotta: "#9c4122"
  terracotta-hover: "#85361c"
  terracotta-fill: "#a24526"
  terracotta-soft: "#f8e7dd"
  terracotta-ring: "#b5502d"
  on-terracotta: "#fff8f1"
  chip-on-bg: "#f5ddd0"
  chip-on-fg: "#3d1a0c"
  terracotta-dark: "#eb9a78"
  terracotta-ring-dark: "#e08a66"
  chip-on-bg-dark: "#4b2d22"
  page-base: "#efe9df"
  surface: "#fffdf9"
  material-paper: "#f2ece2"
  material-clay: "#ebe2d4"
  line: "#e6ded2"
  line-strong: "#cbbfae"
  line-field: "#958775"
  line-strong-dark: "#786f66"
  line-field-dark: "#857b70"
  text: "#221e1a"
  text-2: "#3d362f"
  muted: "#675e54"
  page-base-dark: "#24211e"
  surface-dark: "#302c28"
  material-wood: "#3b3530"
  material-clay-dark: "#2a2622"
  line-dark: "#47403a"
  text-dark: "#efe9e1"
  muted-dark: "#b3a99c"
  sign-wood: "#5b4331"
  sign-edge: "#3e2d20"
  sign-ink: "#f7eedd"
  success: "#1e6650"
  break: "#245f58"
  info: "#1f93ab"
  badge: "#8a5f08"
  status-focus: "#1f8a4c"
  status-break: "#b86e00"
  status-away: "#7f776e"
  room-library: "#146d34"
  room-library-dark: "#89d298"
  room-cabin: "#735601"
  room-cabin-dark: "#deb866"
  room-office: "#34589d"
  room-office-dark: "#9bbeff"
  room-teagarden: "#006483"
  room-teagarden-dark: "#68ccf5"
  room-camp: "#44670d"
  room-camp-dark: "#a6cc80"
  room-space: "#5b4c99"
  room-space-dark: "#bcb2ff"
  room-underwater: "#016869"
  room-underwater-dark: "#57d4d4"
  room-bar: "#8a3a64"
  room-bar-dark: "#f4a0c8"
  room-treehouse: "#615e00"
  room-treehouse-dark: "#c4c36c"
  room-cyber: "#764286"
  room-cyber-dark: "#dca7ec"
typography:
  pixel-hero:
    fontFamily: "Pixelify Sans, Pixelify Fallback, Inter, system-ui, sans-serif"
    fontSize: "55px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0"
  pixel-display:
    fontFamily: "Pixelify Sans, Pixelify Fallback, Inter, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0"
  pixel-headline:
    fontFamily: "Pixelify Sans, Pixelify Fallback, Inter, system-ui, sans-serif"
    fontSize: "33px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0"
  pixel-label:
    fontFamily: "Pixelify Sans, Pixelify Fallback, Inter, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0"
  title:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title-s:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  meta:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  numeric:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontWeight: 700
    fontFeature: "'tnum' 1"
  label:
    fontFamily: "Inter, Inter Fallback, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  block: "6px"
  sm: "8px"
  control-sm: "10px"
  control: "12px"
  control-lg: "14px"
  card: "20px"
  card-lg: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "56px"
  page-gutter: "32px"
  page-gutter-narrow: "16px"
  page-max: "1216px"
  measure-text: "720px"
components:
  button-primary:
    backgroundColor: "{colors.terracotta-fill}"
    textColor: "{colors.on-terracotta}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.terracotta-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.material-paper}"
    textColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-secondary-hover:
    backgroundColor: "{colors.material-paper}"
  button-small:
    rounded: "{rounded.control-sm}"
    padding: "0 14px"
    height: "36px"
  button-wide:
    rounded: "{rounded.control-lg}"
    width: "100%"
    height: "54px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
  input:
    backgroundColor: "{colors.page-base}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "46px"
  nav-item:
    textColor: "{colors.muted}"
    rounded: "{rounded.control-sm}"
    padding: "0 14px"
    height: "44px"
  nav-item-active:
    backgroundColor: "{colors.material-paper}"
    textColor: "{colors.text}"
  segmented:
    backgroundColor: "{colors.material-clay}"
    rounded: "9px"
    padding: "3px"
  segmented-option-on:
    backgroundColor: "{colors.chip-on-bg}"
    textColor: "{colors.chip-on-fg}"
    rounded: "{rounded.block}"
    height: "36px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card-lg}"
  option-block:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.block}"
    height: "44px"
  choice-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.block}"
    padding: "0 14px"
    height: "40px"
  door-sign:
    backgroundColor: "{colors.sign-wood}"
    textColor: "{colors.sign-ink}"
    typography: "{typography.pixel-headline}"
---

# Design System: Odakhane

## Overview

**Creative North Star: "Akşam Çalışma Odası"**

Odakhane'nin arayüzü, lamba ışığında bir çalışma odasının içindeki mobilyadır. Asıl görünen şey
izometrik voxel odadır; site onun etrafında duran masa, tabela ve kâğıttır. Açık modda gündüz
kâğıdı ve kil, koyu modda akşam ahşabı ve kömür tonları hâkimdir; ikisi de aynı sıcak kahve ailesinden
gelir ve tek vurgu rengi pişmiş terracottadır.

Yoğunluk orta: kartlar geniş iç boşluklu, satırlar rahat, uzun seans boyunca göz yormayacak
kadar sakin. Bileşenler dokunsal ve sakindir: hafif hacimli, basınca yerine oturan, ama dikkati
odadan çalmayan. Piksel yazı (Pixelify Sans) odaların voxel karakterini arayüze taşıyan tek ses;
yalnızca başlıkta ve bir değeri okutan kısa yazıda kullanılır.

Tanımlı bir anti-referans yok; sistem kendi kurallarıyla sınırlanır.

**Key Characteristics:**
- Sıcak kahve tonlu zemin, kart ve çizgiler; açık ve koyu mod aynı sıcaklıkta.
- Tek vurgu: pişmiş terracotta, birincil eylem ve seçim için.
- İki ses: piksel başlık ve Inter; Inter'de rolü boyut, ağırlık ve harf aralığı ayırır.
- Katmanlı derinlik: zemin, kart, seçili öğe; her katmanın kendi gölgesi.
- Oda sahnesi her sayfada en büyük ve en renkli öğe.

## Colors

Sıcak kâğıt-kil-ahşap nötrleri ve tek bir pişmiş terracotta vurgu; durum renkleri yalnızca anlam taşır.

### Primary
- **Pişmiş Terracotta** (açık `terracotta`, koyu `terracotta-dark`): birincil buton dolgusu
  (`terracotta-fill`, üstte hafif parlaklık geçişiyle), seçili çip kenarı ve halkası
  (`terracotta-ring`), odak halkası, başlıktaki vurgu ve aktif bağlantılar. Açık modda koyu ve
  doygun (krem yazıyla ≥ 4.5:1), koyu modda açılıp somonlaşır.
- **Terracotta Kâğıdı** (`terracotta-soft`, `chip-on-bg`): seçili çip ve hafif vurgulu yüzeylerin zemini.

### Neutral
- **Gün Kâğıdı** (`page-base`, koyu `page-base-dark`): sayfa zemini; üstte hafif ışık lekesi ve
  dikey geçişle (`--bg-page`).
- **Kart Beyazı** (`surface`, koyu `surface-dark`): kartlar, başlık şeridi, form alanları.
- **Kâğıt / Kil / Ahşap** (`material-paper`, `material-clay`, `material-wood`): ikincil yüzeyler,
  çökük alanlar (segmented şerit), aktif gezinme öğesi. Koyu modda kâğıdın yerini ahşap alır.
- **Çizgi** (`line`, `line-strong`): kart kenarı, ayraç, ikincil buton ve seçenek bloğu kenarı.
- **Alan çizgisi** (`line-field`): giriş, seçim kutusu ve arama alanının kenarı. Alanı tanıtan tek ipucu
  olduğu için karta ve alan zeminine karşı ≥ 3:1 (açık 3.44 / 3.09, koyu 3.34 / 3.86).
- **Mürekkep** (`text`, `text-2`, `muted`): gövde, ikincil yazı, yardım metni.
- **Tabela Ahşabı** (`sign-wood`, `sign-edge`, `sign-ink`): kapı tabelası; oda adının yazıldığı
  ahşap levha ve onun açık mürekkebi.

### Gün zamanı
Sitenin zemin ışığı gerçek saati izler (`useDaypart.js`, `<html data-daypart>`): odalardaki
"Otomatik" gün zamanıyla aynı eşikler (07-17 gündüz, 17-20 akşam, 20-07 gece). Yalnızca
`--page-base` ve `--bg-page` (zemin + üst ışık lekesi) değişir; kartlar, çizgiler ve yazı sabit.
Açık modda akşam amber, gece hafif koyu kâğıt; koyu modda gündüz bir ton açık, gece daha derin kahve.
Zemin en koyu ucunda bile `--muted` yazıya ≥ 4.7:1. Geçiş animasyonsuz; dakikada bir bakılır.

### Oda vurgusu
Her tema kendi imza rengini taşır (`--room-accent`, `[data-room-theme]` ile; `ThemeLabel.jsx`):
Kütüphane yeşil abajur, Dağ Evi mum ve pirinç, Yazılım Ofisi monitör mavisi, Çay Bahçesi deniz,
Kamp çam, Uzay hologram moru, Sualtı akvaryum turkuazı, Bar neon pembe, Ağaç Ev yaprak, Siber Loft
neon mor. Hepsi aynı OKLCH açıklığında (açık L 0.47, koyu L 0.80): kart zeminine karşı açıkta
≥ 6.3:1, koyuda ≥ 7:1. Ton terracottadan (≈38°) uzak tutulur. Yalnızca odanın kimliğini söyler:
lobide tema adı, oda sayfasında tema satırı, tek kişilik odada başlığın önündeki kare.

### Durum
- `success`, `break`, `info`, `badge`: bildirim, mola, bilgi ve rozet yazısı, her biri `-soft` zeminiyle.
- `status-focus` / `status-break` / `status-away`: avatar durum noktası (odakta, molada, uzakta).
  Biçim de ayırır (nokta, baklava, içi boş halka); renk tek başına taşımaz.

### Named Rules
**The One Ember Rule.** Terracotta yalnızca birincil eylem, seçim ve odak içindir. Bir ekranda
ikinci bir dolgulu terracotta buton varsa biri yanlıştır. Birincil buton dolgusu (`terracotta-fill`)
iki modda da aynıdır: koyu moddaki açık terracotta (`terracotta-dark`) yazı ve halka rengidir,
krem yazıya dolgu olamaz (2.1:1).

**The Room Identity Rule.** Oda vurgusu yalnızca "bu hangi oda" sorusunu yanıtlar ve hep küçük kare
işaretle gelir; seçim, odak, sayaç ya da eylem rengi olmaz. Sayaç halkası faz rengini (odak / mola)
korur.

**The Same Warmth Rule.** Koyu mod ayrı bir dünya değil, aynı odanın akşamıdır: her nötr kahve
ailesinde kalır, soğuk gri ya da saf siyah kullanılmaz.

## Typography

**Display Font:** Pixelify Sans (Pixelify Fallback: Arial'ın Pixelify ölçülerine eşlenmiş hali)
**Body Font:** Inter (Inter Fallback: ölçüleri eşlenmiş Arial), Türkçe çekirdek alt kümesi tek dosyada

İki aile, ikisi de kendi sunucumuzdan; dış font CDN'i yok. `--font-display`, `--font-numeric` ve
`--font-mono` rol adı olarak kalır, hepsi Inter'e çözülür. Sayılar `font-variant-numeric: tabular-nums`,
kodlar `--code-features` (eğik sıfır + eşit genişlikte rakam) ile ayrılır.

**Character:** Piksel başlık odaların voxel dünyasından gelen tek oyunbaz ses; altında tek bir
düzenli, okunaklı grotesk her şeyi taşır.

### Hierarchy
- **Pixel hero** (500, 55px, 1.1): yalnızca tanıtım sayfasının ana başlığı; dar ekranda 44px.
- **Pixel display** (500, 44px, 1.1): Sayfam karşılama başlığı, tanıtım alıntısı (dar ekranda 33px).
- **Pixel headline** (500, 33px, 1.1): her sayfanın h1'i, tanıtımın bölüm ve kapanış başlıkları,
  kapı tabelası, kapasite sayacı.
- **Pixel label** (500, 22px): tema adı, seçili değer, sıra rozeti; okunan piksel yazının tabanı.
- **Title** (700, 24px, 1.2, -0.015em): h2, sayfa içi bölüm başlığı. Büyük başlık (28px) yalnızca
  giriş sayfasının marka bloğunda.
- **Title small** (600, 20px, -0.01em): h3, kart ve panel başlığı.
- **Lead** (400, 18px): giriş paragrafı ve küçük panel başlığı.
- **Body** (400, 16px, 1.5): gövde, açıklama; metin sayfalarında ölçü 720px.
- **Control** (600-700, 15px): buton ve gezinme yazısı.
- **Label** (600, 14px): form etiketi, yardım metni, ikincil satır, çip.
- **Meta** (400, 13px): sahne üstü ipucu, kısa not, zaman damgası. **Micro** (12px) yalnızca
  telefondaki simgeli sekme etiketi ve küçük rozet.
- **Numeric** (700, tabular): sayaç ve istatistik rakamları; boyutu bileşen belirler (28-58px).

Her rol theme.css'te bir `--text-*` token'ıdır; CSS'te ham px yazı boyutu yalnızca bileşene özgü
rakam, marka adı ve stepper glifi için kalır.

### Named Rules
**The Eleven Grid Rule.** Pixelify'ın bir pikseli 92/1000 em'dir; yazı yalnızca 11'in katlarında
(22 / 33 / 44 / 55px) ekran pikseline oturur. Ara boyut kullanılmaz, 22px'in altına inilmez,
ağırlık yalnızca 500, harf aralığı 0, sahte kalınlık yok.

**The One Pixel Voice Rule.** Piksel yazı başlık ve bir değeri okutan kısa yazı içindir; okunan
paragraf, buton yazısı ve form etiketi asla piksel değildir.

**The Scale Token Rule.** Yazı boyutu `--text-*` ya da `--pixel-*` token'ından gelir; 11.5, 13.5,
17, 19 gibi ara boyutlar yazılmaz. Yeni bir boyut gerekiyorsa önce rolü tanımlanır.

## Layout

Tek sütunlu, ortalanmış sayfa kabı: en fazla 1216px içerik, 32px kenar boşluğu (560px altında 16px).
Başlık ve alt bilgi şeridi tam genişliktir ve iç boşluğu içerik kabıyla hizalanır. Metin sayfaları
720px okuma ölçüsünde daralır. 1920px'te kap büyümez; kenarlar sakin zeminde kalır. Oda sayfaları
istisnadır: sahne ekranın kalanını doldurur.

**Akışkan değerler.** Kart iç boşluğu `--pad-card` (`clamp(18px, 5vw, 24px)`), büyük yüzeyinki
`--pad-card-lg` (`clamp(20px, 6vw, 32px)`); Sayfam'ın avatar sütunu `clamp(280px, 30vw, 400px)`,
sahnesi `clamp(300px, 28vw, 380px)`, oda oluşturma sahnesi `clamp(320px, 100svh - 400px, 600px)`.
Ara genişliği kırılma noktası yerine `clamp()` taşır.

**Kırılma noktaları** (ekran; içerik kırıldığı yerde):
- **≤374** küçük telefon: üst sekmeler 13px yazı, 4px iç boşluk.
- **≤560** telefon: kenar boşluğu 16px, başlık tek satır, marka yalnızca işaret, koyu mod ve çıkış
  Hesap sayfasında.
- **≤680** oturumlu başlıkta marka adı ekran okuyucuya kalır.
- **≤900** tablet: iki sütunlu sayfalar (Sayfam, oda, oda oluşturma, tanıtım hero'su) tek sütuna
  iner; atölye alt sayfası (`.sheet`) açılır; telefon/tablet sayaç çubuğu.
- **≤1000** lobi yan paneli oda listesinin altına iner. **<1064** oda oluşturmada tema notu kartlara geçer.
- Kısa masaüstü (`min-width: 901px` + `max-height`) oda ve oluşturma panellerini sıkıştırır.

**Container query'ler** bileşenin kendi genişliğine bakar: karakter menüsü (`cmenu`, ≥600 ad solda,
şerit sağda), oda formu tema ızgarası (`room-form`, ≥560 beş sütun), avatar HUD (≤480 / ≤360) ve
kombinler (≤400). Yeni bir bileşen ekranı değil kabını sorgular.

Boşluk ritmi 4px tabanlıdır (4 / 8 / 12 / 16 / 24 / 32 / 56). Dokunma hedefi en az 44px (marka
bağlantısı dahil). Telefonda yatayda çentik payı `safe-area-inset` ile korunur; altta yapışan
çubuklar ev göstergesi payını kendisi alır. Hover yalnızca `(hover: hover)` altında anlam taşır.

## Elevation & Depth

Katmanlı sistem: zemin < kart < seçili öğe. Gölge yapısaldır, her katman kendi gölgesini taşır;
koyu modda gölgeler koyulaşır, kenar çizgisi açıklaşır.

### Shadow Vocabulary
- **Kart kenarı** (`--card-edge`; açık: `inset 0 0 0 1px #e6ded2, 0 1px 2px rgba(60,40,20,.05), 0 10px 24px -14px rgba(60,40,20,.2)`):
  her kart ve panel; 1px iç kenar + yumuşak alt gölge.
- **Voxel yüzü** (`--voxel-face`; açık: `inset 0 -2px 0 rgba(90,64,36,.12), inset 0 1px 0 rgba(255,255,255,.7)`):
  seçili çip ve segmented seçeneği; altta koyu, üstte açık kenarla küçük bir blok gibi okunur.
- **Birincil parıltı** (`--primary-glow`; açık: `inset 0 0 0 1px #8a3a1d, 0 2px 6px -2px rgba(140,60,30,.4)`):
  birincil butonun kenarı ve altındaki sıcak gölge.
- **Çökük şerit** (segmented: `inset 0 0 0 1px line, inset 0 2px 0 rgba(60,40,20,.06)`): seçim
  şeritlerinin zemine gömülü yatağı.

### Motion
Hareket derinliğin devamıdır: süre ve eğri theme.css token'larından gelir (`--dur-press` 120ms,
`--dur-fast` 150ms, `--dur-state` 200ms, `--dur-reveal` 300ms, `--dur-scene` 600ms; `--ease-out`
gelen, `--ease-standard` durum, `--ease-exit` giden öğe). Çıkış girişten kısa ve hızlanarak.
Ortak girişler `motion-fade`, `motion-fade-soft`, `motion-rise`, `motion-drop`; varsayılan hâl hep
görünür, animasyon yalnızca "from" tanımlar. Hover'da öğenin kendisi kımıldamaz, içindeki parça
hareket eder (oda kartında yalnızca "Gir"e gelince odanın resmi 4px yükselir).

Sitenin tek odak anı **odaya varış**: kamera 0.8 yakınlık ve +0.24 rad yandan 1100ms'de
(easeOutQuart) oturma açısına süzülür, sahnenin üstünde tabela ahşabından "Odaya girdin" levhası
~1.5sn asılı kalır, odak oda başlığına geçer. Destekleyen geçişler sessizdir: sayfa değişiminde
`main` 200ms solar (yalnızca gezinmeden sonra, yenilemede değil), sekme başlığı ve canlı bölge
sayfanın h1'ini söyler; hızlı katılım kartı odanın adını 1600ms'lik fitille gösterir; odadan çıkış
fişi (blok · dk · kalınan süre, "Tekrar gir") lobide yükselir. Sayaç odaya bağlıdır: odak sürerken
masa lambaları 700ms'de 1.6 kat parlar, başlarken halka bir kez nabız atar, duraklatınca söner;
biten blok bugünkü sayının yanında "+N dk" olarak yükselip söner.

**The Settle Rule.** Basılan düğme blok gibi yerine oturur: büyük düğme 1px iner
(`--press-sink`) ve birincil butonun alt gölgesi kısalır (`--primary-glow-pressed`); küçük seçenek
%96'ya küçülür (`--press-shrink`). Sitede başka basış hareketi yoktur.

**The Still Under Reduce Rule.** "Hareketi azalt"ta `--press-*` none olur ve yer değiştiren her
geçiş kapanır; renk, gölge ve opaklık geri bildirimi kalır. Döngüler (iskelet ışıltısı) durur.
Kamera varışı ve tanıtım gösteriminin kendiliğinden oynaması kapanır; levha yalnızca belirip söner,
fitil kısalmak yerine solar (bekleme süresi aynı kalır).

### Named Rules
**The Raised Selection Rule.** Seçili öğe zeminden bir blok kadar yükselir (voxel yüzü);
seçili olmayan öğe düz kalır. Seçimi yalnızca renk değil, hacim de söyler.

## Shapes

Yumuşak, dostça köşeler ve hacimli bloklar. Yarıçap boyutla büyür ve her değer bir `--radius-*`
token'ıdır: seçim bloğu 6px, küçük rozet ve simge kutusu 8px, küçük buton ve gezinme öğesi 10px,
buton, giriş ve uyarı 12px, büyük buton ve iç sahne 14px, her kart ve panel 20px, tek başına duran
yüzey (giriş kartı, açılır pencere, kapanış çağrısı) 24px; arama kutusu, etiket ve sayı hapları tam
yuvarlak. İç içe yüzeyde dıştaki yarıçap içtekinin üstüne aradaki boşluğu ekler (HUD: 14 + 3).
Avatar, durum noktası ve yuvarlak araç butonları %50. Kenarlar 1px; kesikli kenar yalnızca boş durum notunda.
Kâğıt lifi dokusu (SVG gürültü, %4-7.5 opaklık) yalnızca avatar ve oda oluşturma panellerinde.

## Components

### Buttons
Dokunsal ve sakin; birincil buton dolgulu terracotta, ikincil çerçeveli.
- **Shape:** 12px yarıçap; küçük 10px, geniş ve xl 14px.
- **Primary:** terracotta dolgu, üstte beyaz-siyah ince parlaklık geçişi, krem yazı (700, 15px), birincil
  parıltı gölgesi. Yükseklik 46px (lg 50, xl 54, geniş 54 ve tam genişlik).
- **Hover / Focus:** birincil `brightness(0.94)` ile koyulaşır (açılmaz: karşıtlık korunur); ikincil
  kâğıt zemini alır. Odak: 2px terracotta çerçeve, 3px boşluk. Geçiş 150ms.
- **Disabled:** birincil nötr kâğıt zemin + soluk yazı (soluk terracotta bozuk gibi okunur).
- **Secondary:** şeffaf zemin, `line-strong` çerçeve, mürekkep yazı.
- **Quiet link:** çerçevesiz, yalnızca yazı; ikincil eylemler (Varsayılana dön, Şifremi unuttum).

### Chips
- **Choice chip:** kart zemini, `line-strong` çerçeve, 6px yarıçap, 40px yükseklik; renk ve
  küçük resim seçenekleri aynı satır dilinde.
- **Segmented:** az ve kısa seçenekler için bitişik şerit; çökük kil yatak, seçili seçenek
  terracotta kâğıdı + terracotta kenar + voxel yüzü ile yükselir.

### Cards / Containers
Kart tek yüzeydir: `surface` zemin ve kart kenarı gölgesi; ayrıca `border` eklenmez (kart kenarı
1px iç çizgiyi zaten taşır).
- **Corner Style:** 20px; tek başına duran yüzey 24px.
- **Background:** `surface`.
- **Shadow Strategy:** kart kenarı (Elevation).
- **Internal Padding:** 24px.
- **Boş durum notu:** kesikli `line-strong` çerçeve, 16px yarıçap, soluk yazı.

### Dialogs
Açılır pencere (davet kodu, yasal metin) kartın sayfanın üstünde yüzen hâlidir: `surface`, 24px,
`--shadow-dialog`, koyu yarı saydam arka perde (2px bulanık). Yerel `<dialog>`: odak hapsi ve Esc
tarayıcıdan. Düğmeleri standart `.site-btn`; pencereye özel düğme stili yazılmaz. Telefondaki poz
alt sayfası (`.sheet`) ayrı: önizleme arkada görünsün diye perdesi hafif.

### Option Block
Yazılı seçenek (`.choice-row`), karakter menüsünün seçenek şeridi ve ok düğmeleri tek tabanı paylaşır:
kart zemini, `line-strong` 1px kenar, 6px yarıçap, voxel yüzü gölgesi. Boyut, yazı ve seçili hâl
her bileşenin kendi kuralında; seçili hâl Raised Selection'a uyar ve hover'da kaybolmaz.

### Inputs / Fields
- **Style:** sayfa zemini rengi, `line-strong` 1px çerçeve, 12px yarıçap, 46px yükseklik; etiket
  üstte 14px 600.
- **Focus:** 2px terracotta çerçeve, 3px boşluk.
- **Error:** `aria-invalid` ile kırmızımsı kenar ve alanın altında `role="alert"` hata metni.

### Navigation
Üst şerit: solda marka (küp simge + ad), ortada sayfa bağlantıları, sağda koyu/açık mod düğmesi
ve hesap eylemleri. Bağlantı 44px yüksek, 10px yarıçaplı; dinlenirken soluk, üzerine gelince
mürekkep, aktif sayfada kâğıt/ahşap zemin + 600 ağırlık. Mod düğmesi 44px yuvarlak.

### Door Sign (signature)
Oda adının yazıldığı ahşap kapı tabelası: tabela ahşabı zemin, koyu kenar, açık mürekkeple piksel
headline. Oda oluşturmada oda adı doğrudan tabelaya yazılır.

Oda sayfasında panelin başlık kartı da kapı tabelasıdır (`.material-sign`): koyu ceviz levha her
iki modda aynı, iki çivi, ince tahta çizgileri; içindeki bileşenler koyu modun token'larını alır.

### Desk Drawer
Oda panelinde sayaç ve odadakiler masa çekmecesidir: kâğıt iç (`--material-paper`, koyuda
`surface`), 5px ahşap çerçeve iç gölgeyle çizilir (`--drawer-wood`; kartın boyu değişmez), üst
kenarda tutamak yuvası. Odak modunda panel malzemesiz kalır, odanın rengini alır.

### Room Stage (signature)
İzometrik voxel oda sahnesi: sayfanın en büyük öğesi, sıcak radyal zemin (`--scene-bg`) üzerinde;
altında gün zamanı ve tema adını söyleyen kısa açıklama.

### Landing Demo
Tanıtımda adım kartları, özellik üçlüsü ve kapanış bandı yoktur. "Bir oturum, baştan sona" bölümünde
canlı bir oda (Çay Bahçesi, 4 kişi) varış → odak (lamba) → mola (+25 dk) sırasını hızlandırılmış
oynatır; adımlar tıklanır, Durdur/Oynat vardır, yalnızca görünürken oynar. Söz odanın bir satırıdır.

### Page Heads
Uygulama sayfalarının başı kart değildir: piksel başlık ve en fazla iki eylem (Lobi: Hızlı gir,
Oda oluştur). Sayı hapları, radyal zemin süsü ve kart üstü "Aktif" rozeti kullanılmaz; yalnızca
gizli oda işaretlenir. Bilinmeyen adres "Bu oda boş" sayfasına gider.

## Do's and Don'ts

### Do:
- **Do** piksel yazıyı yalnızca 22 / 33 / 44 / 55px'te, 500 ağırlıkta, 0 harf aralığıyla kullan.
- **Do** her rengi theme.css token'ından al ve koyu mod karşılığını aynı blokta tanımla.
- **Do** seçimi hem renkle hem hacimle (voxel yüzü) göster; durum noktalarında biçimle de ayır.
- **Do** birincil butonu üzerine gelince koyulaştır, açma (krem yazı karşıtlığı ≥ 4.5:1).
- **Do** dokunma hedeflerini en az 44px tut.
- **Do** yeni bir buton, kart, pencere ya da seçenek için önce mevcut sınıfı kullan (`.site-btn`,
  `.site-card`, dialog tabanı, seçenek bloğu); yarıçap ve gölgeyi token'dan al.

### Don't:
- **Don't** bir ekranda birden fazla dolgulu terracotta buton kullanma. Tanıtım ve giriş/kayıtta
  header'daki "Kayıt ol" sakin kalır; odaya girme eyleminin adı her yerde "gir"dir.
- **Don't** paragraf, buton yazısı ya da form etiketini piksel yazıyla dizme.
- **Don't** koyu modda soğuk gri ya da saf siyah zemin kullanma.
- **Don't** soluk terracottayı pasif durum için kullanma; pasif birincil nötr kâğıda döner.
- **Don't** bir bağlam içinde `.site-btn`'i yeniden tanımlama; boyut gerekiyorsa `--small` / `--lg` /
  `--xl` / `--wide` değişkenlerinden birini kullan.
