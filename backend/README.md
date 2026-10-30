# Demo Backend

Spring Boot 4.1 · Java 21 · PostgreSQL 16 · Flyway

Uygulamanın iş kuralları (giriş, oda, sayaç, puan, lig, ödül) burada yaşar.
REST sözleşmesi: [`../contracts/openapi.yaml`](../contracts/openapi.yaml)

---

## Gereksinimler

| Araç | Sürüm | Kontrol |
|---|---|---|
| JDK | 21+ | `java -version` |
| Maven | 3.9+ (ya da IntelliJ'in gömülü Maven'ı) | `mvn -v` |
| Docker Desktop | güncel | `docker -v` |
| Bruno (isteğe bağlı) | güncel | API isteklerini elle denemek için |

## Çalıştırma

```bash
cd backend

# 1. Veritabanını başlat
docker compose up -d

# 2. (Bir kez) Maven Wrapper oluştur, sonra herkes ./mvnw kullanır
mvn -N wrapper:wrapper

# 3. Testleri çalıştır
./mvnw test

# 4. Uygulamayı başlat
./mvnw spring-boot:run
```

Windows'ta `./mvnw` yerine `mvnw.cmd` kullan.

Kontrol:

```bash
curl http://localhost:8080/api/v1/ping
# {"message":"pong","serverTime":"2026-..."}

curl http://localhost:8080/actuator/health
# {"status":"UP"}
```

Bruno ile: Bruno'da **Open Collection** → `backend/bruno` → ortam olarak **local** seç.

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/demo` | Veritabanı adresi |
| `DB_USER` | `demo` | |
| `DB_PASSWORD` | `demo` | Sunucuda mutlaka değiştir |
| `PORT` | `8080` | |
| `CORS_ORIGINS` | `http://localhost:5173` | Frontend adresleri (virgülle ayrılır) |

## Paket yapısı

Paketler özelliğe göre ayrılır, her özelliğin içinde katmanlar bulunur:

```
com.demo.backend
├── common/
│   ├── config/      Clock, CORS
│   └── error/       GlobalExceptionHandler, NotFoundException, BusinessRuleException
├── realtime/        RoomEventPublisher (arayüz). STOMP uygulamasını D yazar
├── ping/            H1 örneği: Controller → Service → DTO
├── auth/            H2
├── room/            H3
└── ...
```

Her özellik paketi aynı kalıbı izler:

| Dosya | Katman | Kural |
|---|---|---|
| `XController` | Controller | HTTP alır, DTO döner. İş kuralı içermez |
| `XService` | Service | **Tüm iş kuralları burada.** HTTP bilmez |
| `XRepository` | Repository | `JpaRepository` arayüzü |
| `X` | Entity | Tabloyu temsil eder. API'den asla dönmez |
| `dto/` | DTO | API giriş/çıkış modelleri (`record`) |

## Kurallar

1. **Önce sözleşme.** Yeni uç önce `contracts/openapi.yaml` dosyasına yazılır ve PR açılır.
2. **Zaman için `Clock`.** Servislerde `Instant.now()` kullanılmaz, `Clock` enjekte edilir. Böylece testlerde zaman sabitlenebilir.
3. **Hatalar fırlatılır.** Servis `NotFoundException` (404) ya da `BusinessRuleException("ROOM_FULL", ...)` (409) fırlatır. JSON gövdesini `GlobalExceptionHandler` üretir.
4. **Şema = Flyway.** Tablolar yalnızca `db/migration/V<n>__aciklama.sql` dosyalarıyla değişir. Main'e giren migration dosyası bir daha düzenlenmez.
5. **Gerçek zamanlı yayın** yalnızca `RoomEventPublisher.publish(...)` üzerinden yapılır.
6. **Her servis** birim testi ve bir Bruno isteğiyle gelir.

## Testler

| Test | Ne kontrol eder | Gerekenler |
|---|---|---|
| `PingServiceTest` | İş kuralı (saf birim testi) | Hiçbir şey |
| `PingControllerTest` | HTTP sözleşmesi (yol, durum kodu, JSON alanları) | Hiçbir şey (`@WebMvcTest`, veritabanı yok) |
