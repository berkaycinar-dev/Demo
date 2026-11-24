# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Birincil kitle henüz kesinleşmedi (açık karar). Ortak nokta: tek başına çalışırken odağını
korumakta zorlanan, başkalarıyla "aynı odada" çalışmanın verdiği düzenden yararlanan kişiler.
Öğrenciler, uzaktan çalışanlar ve ekipler aday kitlelerdir; hiçbiri öncelikli olarak seçilmedi.

## Product Purpose

Odakhane bir birlikte odaklanma odasıdır (study-with-me / body doubling). Kullanıcılar temalı
sanal bir odaya girer, avatarlarıyla bir koltuğa oturur ve aynı anda çalışır. Başarı: kullanıcının
odada kalıp odak seanslarını tamamlaması ve geri dönmesi.

## Positioning

Kamerasız varlık. Kişi odada yalnızca avatarıyla görünür; kamera ve ses bilinçli olarak yoktur.
Mahremiyet ve düşük sosyal baskı ürünün parçasıdır. Varlık hissini görüntü yerine el yapımı,
gerçek saate göre ışığı değişen izometrik voxel mekânlar taşır.

## Operating Context

- Oturum uzun sürer: kullanıcı odaya girer, saatlerce çalışır, molalarda mola noktalarına geçer.
- Oda kapasitesi 1-10 kişi; her kapasitenin kendi yerleşimi vardır.
- 10 oda teması (kullanıcıya görünen): Kütüphane (`library`), Dağ Evi (`cabin`), Yazılım Ofisi
  (`office`), Çay Bahçesi (`teagarden`), Kamp (`camp`), Uzay İstasyonu (`space`), Sualtı Üssü
  (`underwater`), Bar (`bar`), Ağaç Ev (`treehouse`), Siber Loft (`cyber`). Simyacı Odası
  (`alchemist`) iptal edildi (2026-11-07): dosyaları kodda gizli duruyor (`hidden: true`), yeni
  geliştirmeler ona uygulanmaz.
- Gün zamanı (Otomatik / Gündüz / Akşam / Gece) varsayılan olarak gerçek saati takip eder.

## Capabilities and Constraints

Var — oda sahneleri (`frontend/src/rooms/`):
- `core/`: tema bağımsız kabuk ve ortak parçalar. `RoomCanvas` (kamera, ışık, sürükle-döndür,
  yakınlaştırma, gün zamanı düğmeleri), `VoxelMeshes` (katman başına tek InstancedMesh),
  `Interactives` (tıklanabilir eşyalar), `SpotRings` (mola halkaları), `SteamEffect`,
  `AnimationTicker`, `voxel.js` (kutu kurucu; `interactive(...)` ile tıklanabilir eşya), `timeOfDay.js`.
- Her tema kendi klasöründe aynı yapıda: `parts.js` (eşyalar), `build<Tema>.js` (yerleşimi sahneye
  çevirir), `<Tema>Scene.jsx`, `<Tema>Room1..10.jsx` (kapasite başına yerleşim), temaya özel efekt
  bileşenleri (ateş, kar, neon, kabarcık...), `index.js`. Tema listesi `rooms/themes.js`.
- Her sahne koltuklar (`seats`), mola noktaları (`spots`) ve avatar eklenebilir alan verir.
- Tıklanabilir eşyalar (her temada, her kapasitede en az üç): lamba / fener / akvaryum ışığı
  açılıp kapanır, ekran ve hologramlar kısa bir güç kırpışmasıyla yeniden açılır, bitki ve ağaçlar
  sallanır, makineler (çaydanlık, kahve makinesi, semaver, kazan, otomat, müzik kutusu...)
  sarsılıp buhar, kabarcık, iksir ya da nota çıkarır.

Var — site (`frontend/src/site/`), hash yönlendirmeli tek sayfa:
- Herkese açık: Anasayfa (tanıtım), Koşullar, Gizlilik. Misafir: Giriş, Kayıt.
- Hesapla: Sayfam (bugünkü odak istatistiği, sayaç), Odam (tek kişilik kişisel oda: tema ve ortam
  sesi ayarları, odak modu), Avatarım (avatar atölyesi), Lobi (oda listesi, herkese açık ve davet
  kodlu odalar, oda oluşturma), oda sayfası (ortak oda: odadakiler, sıralama), Hesap.
- Hesap şimdilik yereldir: kullanıcılar ve oturum tarayıcıda (`localStorage`, PBKDF2 parola özeti).
  Ortak odalardaki oda arkadaşları şimdilik simülasyondur (`useRoomPeople`).
- Pomodoro sayacı (`usePomodoro`): 25/5, 50/10, 90/15 ön ayarları; bitiş zamanına göre sayar (sekme
  arka planda kalsa da kaymaz), aşama bitince zil çalar, biten odak blokları günlük istatistiğe
  yazılır. Odak bloku süresi dolarak bitince odadaki kendi avatarın yerinde kollarını kaldırıp
  sevinir, sonra molaya kalkar (atlanan blokta sevinmez).

Var — avatar sistemi (`frontend/src/avatars/`):
- Kemikli voxel avatar (`model.js`), prosedürel pozlar ve jestler (`poses.js`), odadaki kalabalık
  ve yürüyüş simülasyonu (`AvatarCrowd`), atölye önizlemesi (`AvatarPreview`).
- Avatar atölyesi: sekme yok; tek kaydırmalı karakter menüsü (`CharacterMenu`). Dört başlıklı bölüm
  (Beden; Saç ve yüz; Kıyafet; Aksesuar) alt alta durur, her ayar bir satırdır: satır başında etiket,
  yanında seçenek şeridi (radiogroup; renkler örnekle, saç/sakal/bıyık küçük resimle). Bağlı satırlar
  yalnızca gerektiğinde görünür (özel kaş rengi, sakal/bıyık, kumaş/metal renkleri). Odaklanılan
  satırın bölgesine yaklaşan kamera, 4 önizleme durumu (Odakta, Molada, Uzakta, Yürüyüş) ve çalışma türü (Kitap,
  Bilgisayar), 3 kombin slotu, 50 adımlık geri al / ileri al (Ctrl+Z, Ctrl+Y), Rastgele,
  Varsayılana dön. Değişiklikler hemen kaydedilir.
- Jestler: gözlük takılınca karakter sol eliyle çerçeveyi düzeltir, başlık takılınca başını ele
  yatırıp başlığı (kepte siperi) tutar; önizlemede karaktere tıklanınca kameraya dönüp el sallar ve
  başıyla selam verir. Her değişiklikte karakter kısa bir çöküp toparlanma tepkisi verir.

Var — backend (`backend/`, henüz frontend'e bağlı değil):
- Spring Boot + PostgreSQL (Flyway göçleri V1-V7), `docker-compose.yml`, Bruno istek koleksiyonu.
- `auth`: kayıt, giriş, JWT erişim + yenileme belirteci. `room`: oda oluşturma, katılma, üyeler,
  roller, kapsam (herkese açık / davetli). `timer`: kişisel Pomodoro durumu (komut kimliği ve durum
  sürümüyle). `point`: biten odak bloklarından puan olayları. `realtime`: oda olayı yayıncısı
  (şimdilik yalnızca loglar).
- Site hâlâ tamamen `localStorage` üzerinde çalışır; bu servisleri çağırmaz.

Planlı:
- Frontend'i backend'e bağlamak: sunucu tarafı hesap, gerçek çok kişili odalar, gerçek zamanlı
  oda olayları.
- Odadaki herkesin paylaştığı ortak odak-mola zamanlayıcısı.
- Oda içi yazılı sohbet.
- Seri ve hedef takibi.

Kapsam dışı:
- Kamera ve ses. Bilinçli ürün kararı, eksik özellik değil.

Teknik:
- Stack: frontend React 19 + Vite, three.js + @react-three/fiber; backend Java / Spring Boot +
  PostgreSQL. İkisi henüz bağlı değil.
- Web; masaüstü ve mobil eşit öncelikli. Oda sahneleri mobil GPU'da da akıcı kalmalı
  (`frameloop="demand"`, dpr en fazla 1.5, three.js ayrı yüklenir).

Açık kararlar: birincil kullanıcı kitlesi, hesap/kimlik modeli, oda oluşturma ve katılma akışı.

## Brand Commitments

- Ad: Odakhane.
- Dil: önce Türkçe; arayüz metinleri ileride çok dilli olacak şekilde hazırlanmalı.
- Türk kültürüne ait temalar (çay bahçesi, semaver, simitçi) bilinçli tercihlerdir.

## Evidence on Hand

- 10 temanın 1-10 kişilik oda sahneleri: `frontend/src/rooms/`,
  geliştirme önizlemesi `npm run dev` + `?theme=office&c=4&t=night`; bütün avatar hareketleri
  `?lab=avatars`.
- Kullanıcı yorumu, kullanım verisi, müşteri ya da basın yok. Uydurulmamalı.
- Logo yok; `frontend/public/favicon.svg` Vite şablonundan kalma.

## Product Principles

1. Varlık, gözetim değil: birlikte olma hissi kamerasız, avatarla kurulur.
2. Oda odağı korur: arayüz seans boyunca geri planda durur, çalışmayı bölmez.
3. Mekân ürünün kendisidir: temalar özenle yapılmış yerlerdir, dekor değil.
4. Telefonda da eksiksiz: mobil katılım birinci sınıf.

## Development Rules

KURAL: Oda sahnelerinde veya ortak bileşenlerde yapılan her geliştirme, animasyon ve etkileşim
istisnasız olarak 10 oda temasının tamamına uygulanmalıdır.

- İptal edilen Simyacı Odası (`alchemist`) kapsam dışıdır.
- Her temanın 1-10 kişilik bütün yerleşimleri denetlenir; bir özellik yalnızca bazı kapasitelerde
  görünüyorsa eksik sayılır.

## Accessibility & Inclusion

- "Hareketi azalt" tercihi uygulanır: oda animasyonları `reducedMotion` ile durur; avatar jestleri,
  sevinç, bitki sallanması, makine sarsıntısı ve ekran kırpışması yapılmaz; lamba anında açılıp
  kapanır.
- Arayüz metinleri çeviriye hazır olmalı (sabit Türkçe dizeler gömülmemeli).
