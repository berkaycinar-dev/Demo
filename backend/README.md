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
| `JWT_SECRET` | yerel geliştirme değeri | JWT imza anahtarı, **en az 32 bayt**. Sunucuda mutlaka değiştir; kısaysa uygulama açılmaz |

## Paket yapısı

Paketler özelliğe göre ayrılır, her özelliğin içinde katmanlar bulunur:

```
com.demo.backend
├── common/
│   ├── config/      Clock, CORS
│   └── error/       GlobalExceptionHandler, NotFoundException, BusinessRuleException, UnauthorizedException (401)
├── realtime/        RoomEventPublisher (arayüz). STOMP uygulamasını D yazar
├── ping/            H1 örneği: Controller → Service → DTO
├── auth/            H2: kayıt, giriş, JWT, refresh token, güvenlik ayarı
├── user/            H2: User entity, UserRepository, UserResponse
├── room/            H3: oda, üyelik ve roller, RoomAccessChecker. H4: oturumlar (room_sessions), ayrılma
├── timer/           H5: kişisel pomodoro sayacı (timer_states), komutlar ve olaylar
├── point/           H6: puan servisi (point_events), toplam ve geçmiş uçları
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
| `TokenServiceTest` | JWT alanları, refresh token döndürme ve yeniden kullanım algılama | Hiçbir şey (repository sahte) |
| `AuthServiceTest` | Kayıt/giriş iş kuralları (e-posta küçük harf, tekrar eden kayıt, 72 bayt sınırı) | Hiçbir şey |
| `AuthControllerTest` | Auth uçlarının durum kodu ve JSON alanları | Hiçbir şey (standalone MockMvc) |

## Kimlik doğrulama (H2)

- Korumalı uçlara `Authorization: Bearer <accessToken>` başlığı ile istek atılır. Token URL'ye yazılmaz.
- **Access token:** JWT, HS256, 15 dakika. İçinde `sub` (kullanıcı id), `username`, `jti`, `iss`, `iat`, `exp` var. Rol yok; oda rolleri veritabanından okunur.
- **Refresh token:** rastgele, 14 gün, **tek kullanımlık**. Veritabanında yalnızca SHA-256 özeti durur. Kullanılmış bir token tekrar gelirse o kullanıcının tüm refresh token'ları iptal edilir.
- Herkese açık uçlar: `ping`, `auth/register`, `auth/login`, `auth/refresh`, `auth/logout`, `actuator/health`. Gerisi token ister.
- `JwtDecoder` bean'i ortaktır. STOMP CONNECT kontrolü (D) aynı bean'i enjekte edip `Authorization` başlığındaki token'ı doğrular.
- Bruno: `bruno/auth/` altında sırayla Register → Login → Me → Refresh → Logout. Token'lar ortam değişkenine otomatik yazılır.
| `RoomServiceTest` | Oda kuralları: varsayılanlar, özel oda gizleme, davet kodu, doluluk, tekrar katılma | Hiçbir şey |
| `RoomControllerTest` | Oda uçlarının durum kodu ve JSON alanları (leave dahil) | Hiçbir şey (standalone MockMvc) |
| `RoomSessionServiceTest` | Oturum kuralları: girme, tekrar girme, heartbeat, çıkma, odadakiler, zaman aşımı | Hiçbir şey |
| `RoomSessionControllerTest` | Oturum uçlarının durum kodu ve JSON alanları | Hiçbir şey (standalone MockMvc) |
| `RoomSessionSweeperTest`, `RoomSessionTest` | Zaman aşımı temizleyicisi ve oturum nesnesinin kuralları | Hiçbir şey |
| `AfterCommitTest` | Olay yalnızca commit'ten sonra çıkar, geri alınırsa çıkmaz | Hiçbir şey |
| `TimerStateTest` | Sayaç kuralları: başlat, duraklat, devam, atla, sıfırla, ön ayar, süre dolunca geçiş | Hiçbir şey |
| `TimerServiceTest` | Tekrar eden komut, eski sürüm, olayın yalnızca açık oturumlu odalara ve commit'ten sonra gitmesi | Hiçbir şey |
| `TimerControllerTest`, `TimerCommandCleanupTest` | Sayaç uçlarının durum kodu ve JSON alanları, eski komut temizliği | Hiçbir şey (standalone MockMvc) |
| `PointRulesTest` | Puan hesabı: dakika başına puan, blok bonusu, ayar boşken davranış | Hiçbir şey |
| `PointServiceTest` | Puan yazma (uygunluk, tekrar, sıfır puan), özet ve "bugün" sınırı, geçmiş sayfalama | Hiçbir şey |
| `PointControllerTest`, `RoomSessionPointEligibilityTest` | Puan uçlarının durum kodu ve JSON alanları, odada olma kontrolü | Hiçbir şey (standalone MockMvc) |

## Odalar (H3)

- **Roller:** `OWNER` (odayı oluşturan, odada tek) ve `MEMBER`. Roller JWT'de değil, `room_members` tablosunda durur ve her denetimde veritabanından okunur.
- **Görünürlük:** `PUBLIC` odalar listelenir, `PRIVATE` odalar listelenmez ve davet kodu ister. Üye olmayan biri için özel oda "yok" gibi görünür (404 `ROOM_NOT_FOUND`).
- **Kapasite:** `maxMembers` 2 ile 10 arası, varsayılan 8. Dolu odaya katılmak 409 `ROOM_FULL` verir. Son koltuk iki kişiye birden verilmesin diye oda satırı kilitlenir.
- **Olay:** İlk katılmada `RoomEventPublisher` ile `MEMBER_JOINED` yayınlanır. Gövde: `{roomId, userId, username, role}`.
- **`RoomAccessChecker`:** `isMember(userId, roomId)` ve `roleOf(userId, roomId)`. D'nin STOMP SUBSCRIBE/SEND denetimi bunu çağırır. Üyelik kuralının tek sahibi budur.
- Bruno: `bruno/rooms/` altında. Önce `auth/Login` çalıştır.

## Oturumlar ve ayrılma (H4)

- **Üyelik ile oturum farklıdır.** Üyelik (`room_members`) odaya ait olmaktır. Oturum (`room_sessions`) şu an odanın içinde olmaktır. Oturuma yalnızca üyeler girebilir.
- **Uçlar:** `POST /rooms/{id}/sessions` (gir), `POST /rooms/{id}/sessions/current/heartbeat` (canlı tut), `DELETE /rooms/{id}/sessions/current` (çık), `GET /rooms/{id}/sessions/active` (odadakiler), `POST /rooms/{id}/leave` (üyelikten ayrıl).
- **Tekrar girme zararsız:** Açık oturumun varsa yeni satır açılmaz, aynı oturum döner. Bir odada en fazla bir açık oturum olur (veritabanı da bunu zorlar).
- **Zaman aşımı:** 60 saniye heartbeat gelmezse arka plan işi oturumu `TIMEOUT` ile kapatır. `ended_at` son heartbeat anı olur, kopuk geçen süre sayılmaz. Değer `app.room-sessions.timeout-seconds` (ortam değişkeni `ROOM_SESSION_TIMEOUT_SECONDS`). Bu değer D'nin gerçek zamanlı tarafıyla ortaktır, yalnızca D ile birlikte değiştir. Temizleyici 15 saniyede bir çalışır.
- **Sahip ayrılamaz:** Oda sahibi `leave` çağırırsa 409 `OWNER_CANNOT_LEAVE`. Ayrılan üyenin açık oturumu `LEFT_ROOM` ile kapanır ve `MEMBER_LEFT` yayınlanır.
- **Olaylar commit'ten sonra çıkar:** `MEMBER_JOINED` ve `MEMBER_LEFT`, veritabanı işlemi başarıyla bittikten sonra `RoomEventPublisher` ile yayınlanır (`realtime/AfterCommit`). İşlem geri alınırsa olay çıkmaz.
- **`RoomAccessChecker.hasActiveSession(userId, roomId)`:** Kullanıcının odada açık oturumu var mı. D'nin gerçek zamanlı tarafı bunu kullanabilir.
- **Süre ve puan:** Hiçbir oturum satırı silinmez. Süre ve puan ileride bu satırlardan hesaplanır.
- Bruno: `bruno/rooms/` altında `EnterRoom`, `Heartbeat`, `ListActiveMembers`, `ExitRoom`, `LeaveRoom`.

## Kişisel sayaç (H5)

- **Sayaç tiklemez.** Sunucu yalnızca bitiş anını (`endsAt`) saklar. İstemci kalan süreyi `endsAt` ve `serverTime` farkından kendi çizer. Süre dolduysa sunucu bunu bir sonraki okumada veya komutta işler.
- **Durum:** Kullanıcı başına tek satır (`timer_states`). `phase` (`FOCUS`, `BREAK`) ve `status` (`IDLE`, `RUNNING`, `PAUSED`). Ön ayarlar: `25-5` (varsayılan), `50-10`, `90-15`.
- **Uçlar:** `GET /api/v1/timer` (durumu oku) ve `POST /api/v1/timer/commands` (komut gönder). Komutlar: `START`, `PAUSE`, `RESUME`, `SKIP`, `RESET`, `SET_PRESET`.
- **Geçişler:** Odak bitince mola, mola bitince yeni odak otomatik başlar. Süre dolarken kimse yoksa sayaç, biten aşamalar hesaplandıktan sonra `IDLE` olur. Biten her odak `completedFocusBlocks` değerini artırır. `SKIP` ile atlanan odak sayılmaz.
- **Komut kimliği (`commandId`):** Her komut yeni bir UUID taşır. Aynı kimlik tekrar gelirse komut yeniden uygulanmaz, ilk sonuç döner. Ağ yeniden denemesi bu yüzden güvenlidir. Kimlikler 24 saat tutulur (`app.timer.command-retention-hours`), temizleme işi saatte bir çalışır.
- **Sürüm (`expectedVersion`):** Her değişiklik `version` değerini bir artırır. İstemcinin bildiği sürüm eskiyse 409 `STALE_VERSION` gelir. Çözüm: `GET /timer` ile oku, sonra yeni kimlikle tekrar dene. Geçersiz geçişte 409 `INVALID_TIMER_TRANSITION`, bilinmeyen ön ayarda 409 `INVALID_PRESET`.
- **Olaylar:** `TIMER_STARTED`, `TIMER_PAUSED`, `TIMER_RESET`, `TIMER_FINISHED`. Kullanıcının açık oturumu olan her odaya, commit'ten sonra `RoomEventPublisher` ile gider. Hiçbir odada değilse olay çıkmaz. Gövde: `{userId, preset, phase, endsAt, remainingSeconds, version, occurredAt}`.
- **Eşzamanlılık:** Komutlar sayaç satırını kilitler. Aynı kullanıcının iki komutu sırayla işlenir.
- Bruno: `bruno/timer/` altında `GetTimer`, `StartTimer`, `PauseTimer`, `ResumeTimer`, `SkipTimer`, `ResetTimer`, `SetPreset`. `timerVersion` çalışma anı değişkenidir, ortam dosyasını değiştirmez.

## Puanlar (H6)

- **Puanı sayaç verir.** İstemci puan yazamaz. Odak aşaması kendi kendine bitince (`TimerService` bunu okuma veya komut sırasında fark eder) `PointService.awardFocusBlock` çağrılır. Blok ve puanı aynı veritabanı işleminde yazılır: ikisi birden kaydolur ya da hiçbiri (`STALE_VERSION` geri almasında puan da geri alınır).
- **Ne puan getirmez:** `SKIP`, `RESET`, `SET_PRESET` ile yarıda bırakılan blok ve biten mola.
- **Formül (`PointRules`):** blok başına tam odak dakikası x `app.points.per-focus-minute` (1) + ön ayara göre bonus (`app.points.block-bonus`: `25-5` 0, `50-10` 10, `90-15` 25). Yani 25, 60 ve 115 puan. Sayılar `application.yml`'den değişir, sözleşmede sabit değildir.
- **Odada olma şartı:** Blok bittiği anda kullanıcının açık oturumu (`room_sessions`) varsa puan yazılır. Kontrol "geç fark edilen" bloklarda da bitiş anına göre yapılır (`RoomSessionRepository.existsActiveAt`). Odada değilse puan yok, ama sayaç yine de `completedFocusBlocks` değerini artırır.
- **Uygunluk arayüzü:** `PointEligibility`. Şimdiki uygulama `RoomSessionPointEligibility`. D'nin masada mı kuralı (H8) bu arayüzün yeni bir uygulaması olarak bağlanır, `PointService` ve API değişmez.
- **Bir blok bir kez:** `point_events` tablosunda `(user_id, kind, source_key)` benzersizdir. `source_key` = `timer:` + bloğun bitiş anı (epoch milisaniye). Tekrar denemeler ve geç okumalar çift puan yazmaz.
- **Uçlar:** `GET /api/v1/points/me` (toplam, bugün, blok sayısı, odak süresi) ve `GET /api/v1/points/me/events?page&size` (geçmiş, en yeni üstte; `size` 1 ile 100 arasına sıkıştırılır).
- **"Bugün":** `app.points.day-zone` saat diliminin gece yarısından başlar (varsayılan `Europe/Istanbul`).
- **Satırlar silinmez.** Toplamlar `point_events` satırlarından toplanır. Lig ve sıralama sonraki haftalarda bu satırlardan hesaplanır.
- **Bu hafta olay yayınlanmaz.** Puan yazıldığında `RoomEventPublisher` ile bir şey gitmez. Canlı "puan kazandı" bildirimi gerekirse yeni olay türü olarak sonra eklenir.
- Bruno: `bruno/points/` altında `GetMyPoints` ve `ListMyPointEvents`. Puanı 25 dakika beklemeden görmek için `GetMyPoints` açıklamasındaki SQL ile süreyi geçmişe çek.
