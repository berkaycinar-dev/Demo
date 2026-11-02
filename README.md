# Odakhane

Kamerasız sanal birlikte çalışma odaları. Bu adım **D0.1 lokal bağımlılıklarını**
kurar: PostgreSQL ve Redis. Aşağıdaki komut backend veya frontend'i başlatmaz.
Tüm uygulamayı tek komutla çalıştırma, uygulamalar hazır olduğunda D0.5 kapsamındadır.

## Mevcut backend ile uyum

2 Kasım 2026 incelemesinde `origin/feature/backend-skeleton` dalının
`af1d00d` commit'inde Java 21, Spring Boot 4.1.1, Maven Wrapper, Flyway,
PostgreSQL 16 ayarları ve `RoomEventPublisher` arayüzü bulundu.
Bu, main'e birleşmiş olduğu veya testlerinin geçtiği anlamına gelmez.
Yeni backend iskeleti veya ikinci publisher arayüzü yazılmamalıdır.
Java/Spring/Maven sürümleri bu adımda değiştirilmez.

## Gereksinimler

- Docker Desktop, çalışan Linux container motoru ve Docker Compose.
- Bu bağımlılıkları çalıştırmak için bilgisayara ayrıca PostgreSQL, Redis,
  Java veya Node kurmak gerekmez.
- Backend ve frontend geliştirme gereksinimleri kendi sahipleri tarafından
  belirlenir; ilgili uygulama belgeleri esas alınır.

Sabit image etiketleri: PostgreSQL `16.15-bookworm`, Redis `7.4.12-bookworm`.
PostgreSQL'in ana sürümü C'nin mevcut dalıyla uyumludur. Etiketler resmi
[PostgreSQL](https://hub.docker.com/_/postgres) ve
[Redis](https://hub.docker.com/_/redis) image listelerinden doğrulanmıştır.
Etiketler digest kilidi değildir; kontrollü sürüm güncellemeleri ayrı PR yapılır.

## İlk kurulum

Komutları deponun kökünde çalıştırın. Docker Desktop açık ve Linux motoru
hazır olmalıdır.

PowerShell:

```powershell
# Yalnızca ilk kurulumda; mevcut .env dosyanızın üstüne yazmayın.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d --wait
```

macOS / Linux:

```sh
test -f .env || cp .env.example .env
docker compose up -d --wait
```

`.env.example` içindeki `demo` bilgileri yalnızca yerel örnek değerlerdir;
sunucuda kullanılmaz. Gerçek `.env` Git tarafından yok sayılır.
İlk başlangıçta image indirme süresi bağlantıya bağlıdır.

```sh
docker compose ps
docker compose exec -T postgres sh -c 'pg_isready -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker compose exec -T redis redis-cli ping
```

Beklenti: iki servis de `healthy`, PostgreSQL `accepting connections`, Redis `PONG`.
Healthcheck tek başına uygulama entegrasyonu veya migration testi değildir.

## Bağlantılar

| Servis | Bilgisayardan adres | Aynı Compose ağına sonradan eklenen uygulamadan |
|---|---|---|
| PostgreSQL | `127.0.0.1:5432`, DB/user: `demo` | `postgres:5432` |
| Redis | `127.0.0.1:6379` | `redis:6379` |

Portlar `.env` içindeki `POSTGRES_PORT` ve `REDIS_PORT` ile değiştirilebilir.
Yalnızca `127.0.0.1` üzerinde yayınlanırlar. Redis bu lokal kurulumda parola
kullanmaz; bu Compose dosyası üretim dağıtımı için tasarlanmamıştır.

C'nin backend'i bilgisayarda çalışırken varsayılan DB adresi
`jdbc:postgresql://localhost:5432/demo`, kullanıcı/parola `demo` ile uyumludur.
Yerel değerleri değiştirirseniz backend sürecinde de `DB_URL`, `DB_USER`,
`DB_PASSWORD` ayarlayın. Compose `.env` dosyasını okur; bilgisayarda başlatılan
Java süreci bu dosyayı kendiliğinden okumaz.

**C'nin dalındaki `backend/docker-compose.yml` ile kökteki Compose'u aynı anda
başlatmayın.** İkisi 5432 portunu kullanabilir ve farklı volume'lere sahiptir.
Mevcut backend verileri bu dosyaya otomatik taşınmaz. Ortak dosyanın kökte
kullanılması, C'nin dalı birleştirilirken birlikte kararlaştırılmalıdır.
Bu adım C'nin Compose dosyasını silmez veya değiştirmez.

## Veri politikası ve durdurma

- PostgreSQL verisi adlandırılmış `postgres-data` volume'ünde kalır. Varsayılan
  proje adı `odakhane-local` olduğu için volume adı genellikle
  `odakhane-local_postgres-data` olur.
- `docker compose stop` / `start` ve `down` / `up` PostgreSQL volume'ünü korur.
- Redis yalnızca geçici durum içindir: RDB ve AOF kapalıdır, Compose içinde kalıcı volume tanımlanmaz.
  Yeniden başlatıldığında durumun kaybolması beklenir. Kazanılmış puan veya
  kalıcı webhook tekilleştirme kaydı yalnızca Redis'te tutulmamalıdır.
- Lokal volume yedek değildir. Sunucu dışı yedekleme alfa tesliminde ayrıca kurulur.

```sh
# Container'ları ve ağı kaldırır; PostgreSQL verisi kalır.
docker compose down

# Yeniden başlatır ve sağlık kontrollerini bekler.
docker compose up -d --wait
```

**Aşağıdaki sıfırlama PostgreSQL dahil bu Compose projesinin volume verilerini
kalıcı olarak siler. Yalnızca verilerin silinmesini istiyorsanız kullanın.**

```sh
docker compose down --volumes
```

PostgreSQL DB/user/parola ilk kez boş volume hazırlanırken uygulanır.
Sonradan `.env` parolasını değiştirmek mevcut veritabanının parolasını değiştirmez.
Veri korunacaksa SQL ile yetkili parola değişikliği yapılmalıdır; volume sıfırlama
bir parola değiştirme yöntemi olarak kullanılmamalıdır.

## Sorun giderme

- **Docker motoruna bağlanılamıyor / pipe bulunamadı:** Docker Desktop'ı açın,
  Linux motoru hazır olana kadar bekleyin, `docker info` ile kontrol edin.
  WSL/virtualization hatası varsa Docker Desktop'ın hata açıklamasını izleyin.
- **Port kullanımda:** Önce başka PostgreSQL/Redis veya C'nin Compose'u çalışıyor
  mu kontrol edin. Mevcut sistemi kapatmak yerine `.env` portlarını değiştirebilirsiniz;
  uygulamanın bağlantı adresini de güncelleyin.
- **DB_PASSWORD eksik:** Kök `.env` dosyasını `.env.example` üzerinden oluşturun.
- **PostgreSQL unhealthy:** `docker compose logs --tail 80 postgres` ile inceleyin.
  Eski volume/parola uyumsuzluğunda veri silmeden önce nedenini doğrulayın.
- **Redis durumu kayboldu:** Bu lokal kurulumun beklenen geçici veri politikasıdır.
- **Image indirilemiyor:** Ağ/Docker registry erişimini kontrol edin; hatayı geçmek
  için sürümü rastgele `latest` ile değiştirmeyin.

`docker compose config` yerel parolaları ekrana basabilir. Yalnızca doğrulamak
için `docker compose config --quiet` kullanın; `.env` veya secret içeren çıktıları
issue/sohbete eklemeyin.

## Bu adımın kabul kontrolü

1. Temiz checkout'ta örnekten `.env` oluşturulur.
2. `docker compose config --quiet` geçer.
3. `docker compose up -d --wait` sonrası iki servis sağlıklıdır.
4. PostgreSQL'e yazılan deneme kaydı `down` / `up` sonrasında okunur.
5. Redis yeniden başlatıldığında yalnızca geçici durumun kaybı beklenir.
6. `.env` Git tarafından ignore edilir; uygulama kaynakları değişmez.

Bu liste doğrulama ölçütüdür; çalıştırma sonucu ayrıca raporlanmalıdır.
