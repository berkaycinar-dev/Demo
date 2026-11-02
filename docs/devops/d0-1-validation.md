# D0.1 doğrulama kaydı

Tarih: 2 Kasım 2026. Dal: `codex/d0-1-local-environment`.

## Doğrulama kapsamı

Bu çalışma kök `docker-compose.yml`, `.env.example`, `.gitignore`, `README.md`
ve bu doğrulama kaydını ekler. Frontend, 3B sahneler, backend kaynakları,
entity, REST, auth ve migration değiştirilmedi.

`git fetch origin` başarılı. Uzak dal `origin/feature/backend-skeleton`
incelendi: `af1d00d` commit'inde backend zemini, PostgreSQL 16 Compose'u,
Java 21 / Spring Boot 4.1.1 / Maven 3.9.9 Wrapper ayarları ve
`RoomEventPublisher` zaten var. Dal birleştirilmedi, dosyaları kopyalanmadı,
sürüm seti değiştirilmedi; backend çalıştırılmadı veya test edilmedi.

## Geçen kontroller

- `docker compose --env-file .env.example config --quiet`: exit 0.
- Normalize edilmiş Compose JSON'unda iki servisin portları `127.0.0.1`;
  iki healthcheck mevcut; PostgreSQL named volume kullanıyor;
  Redis için Compose volume'ü tanımlı değil.
- Gerçek `.env` olmayan durumda `docker compose config --quiet` gerekli
  `DB_PASSWORD` eksik olduğu için beklendiği gibi başarısız.
- `git check-ignore .env backend/.env frontend/.env.local`: üçü ignore ediliyor.
- `.env.example` ignore edilmiyor.
- `git diff --check`: başarılı. Dosyalar henüz untracked olduğundan bu komut
  yeni dosyaların tamamı için whitespace doğrulaması sayılmaz.
- Takip edilen uygulama dosyalarında `git diff --name-only` çıktısı boş.
- Sabit PostgreSQL/Redis etiketleri resmi Docker Hub image listelerinden doğrulandı.

## Çalışma zamanı sonuçları

Kullanıcı Docker Desktop'ı başlattıktan sonra motor erişimi sağlandı.
Önceki pipe bulunamadı engeli giderildi; uygulama servislerinin ayarları değiştirilmedi.

| Kontrol | Sonuç |
|---|---|
| `docker info --format '{{.ServerVersion}}'` | `29.5.3` |
| `docker compose --env-file .env.example up -d --wait` | Exit 0; iki resmi image indirildi, iki servis healthy |
| PostgreSQL SQL yazma | Geçici `public.d01_probe_20261102_01` tablosu oluşturuldu; bir kayıt yazıldı |
| Redis SET / GET | Geçici `odakhane:d01:probe:20261102:01` anahtarı yazılıp doğru değer okundu |
| `docker compose --env-file .env.example down` | Exit 0; volume silinmedi |
| Yeniden `up -d --wait` | Exit 0; iki servis tekrar healthy |
| PostgreSQL kalıcılık | Önceki deneme kaydı `persistence-ok` olarak okundu |
| Redis geçici veri politikası | Deneme anahtarı için EXISTS sonucu `0` |
| Test verisi temizliği | Yalnızca oluşturulan deneme tablosu DROP TABLE ile kaldırıldı |
| `docker compose --env-file .env.example exec -T redis redis-cli ping` | `PONG` |
| Son `docker compose --env-file .env.example ps` | PostgreSQL ve Redis healthy; portlar yalnızca `127.0.0.1:5432` ve `127.0.0.1:6379` |

Bu test ayrı kurulumdan ziyade bu bilgisayardaki ilk servis kurulumunu doğrular.
Servisler test sonunda açık bırakıldı. Gerçek `.env` oluşturulmadı; servisler
yalnızca açıkça yerel örnek değerler içeren `.env.example` ile başlatıldı.
Normal ekip kurulumunda README'deki örnekten `.env` oluşturma adımı izlenir.

Yeni beş D0.1 dosyasında ayrıca satır sonu boşluk kontrolü geçti.
Son `git diff --name-only -- frontend backend` exit 0 ve boş çıktı:
uygulama kaynakları değişmedi.

## Sonraki işler

Bu bilgisayardaki PostgreSQL/Redis çalışma zamanı kabul kontrolleri geçti.
C'nin backend bağlantısı, migration testleri ve diğer üç ekip üyesinin temiz
kurulumu henüz doğrulanmadı. Bu değişiklik yalnızca D0.1 lokal bağımlılıklarını
kapsar; D0.5 tüm uygulamayı tek komutla başlatma işi ayrı teslimdir.

Sonraki bağımsız iş frontend kaynaklarını değiştirmeden CI kontrollerini
hazırlamaktır. Backend CI, C'nin mevcut iskeleti üzerinden ayrıca entegre edilir.

Sonraki backend işi C'nin mevcut zemini üzerinden ortak incelemeyle yapılır.
Auth, puan, REST veya veri modeli varsayılarak yeni uygulama yazılmaz.
