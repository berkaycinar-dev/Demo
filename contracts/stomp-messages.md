# STOMP mesaj sözleşmesi

Sürüm 4 · Sahip D · Oda olayları, aktif katılımcı listesi, kişisel sayaç ve bağlantı heartbeat'i

## Bağlantı ve yetki

- WebSocket adresi `/ws`. Yayın ortamında WSS kullanılır. Tarayıcı bağlantıları aynı origin veya `CORS_ORIGINS` içindeki açıkça belirtilen origin üzerinden açılır.
- İstemci STOMP 1.2 `CONNECT` çerçevesinde `Authorization: Bearer <accessToken>` başlığını gönderir. Token URL'ye yazılmaz. HTTP el sıkışmasından sonra kimlik doğrulanır.
- REST ve STOMP aynı `JwtDecoder` kullanır. JWT imzası, `iss` ve süre doğrulanır. Kimlik `sub` alanındaki kullanıcı UUID'sidir. Claim ve refresh davranışı [REST sözleşmesinde](openapi.yaml) tanımlanır.
- Oda kanallarını yalnızca `RoomAccessChecker` tarafından üye olduğu doğrulanan kullanıcı dinleyebilir. Oda kimliği küçük harfli UUID olarak yazılır. Kişisel sayaç için yalnızca `/user/queue/timers` adresi açıktır; kimlik JWT'den gelir. Wildcard, ham `/queue/...`, başka kullanıcı kimliği içeren ve diğer abonelik adresleri reddedilir.
- İstemci `CONNECT`, `SUBSCRIBE`, `UNSUBSCRIBE` ve `DISCONNECT` kullanır. Odaya katılma ve oturum heartbeat'i REST üzerinden yapılır. İstemciden `SEND` kabul edilmez.
- Token süresi dolduğunda açık aboneliğe olay teslimi durur. Sonraki abonelik işlemi de reddedilir. İstemci access token'ı REST üzerinden yenileyip tekrar bağlanır ve abone olur. Üyelik teslim anında yeniden kontrol edilir.
- Hatalı işlemde `ERROR` çerçevesinin `message` başlığı `UNAUTHENTICATED`, `FORBIDDEN` veya `INVALID_FRAME` olur ve bağlantı kapanır.

## Bağlantı sağlığı ve yeniden bağlantı

Sunucu STOMP `CONNECTED` çerçevesinde varsayılan `heart-beat:10000,10000` ilan eder. Bu süre `app.websocket.heartbeat-ms` ile ayarlanır; en az 100 ms olmalıdır. İstemci de `CONNECT` sırasında örneğin `heart-beat:10000,10000` gönderir. STOMP'un uzlaşmasına göre iki tarafın desteklediği aralıklardan büyük olan kullanılır. Bir yönde 0 varsa o yönde heartbeat beklenmez; mevcut `0,0` istemcileri çalışmaya devam eder.

Sessizken heartbeat bir satır sonudur (`\n`); JSON veya yeni bir olay tipi değildir. Normal STOMP trafiği de bağlantının canlı olduğunu gösterir. Spring, zamanlama gecikmelerine tolerans tanır ve heartbeat göndermeyi kabul ettiği hâlde veri göndermeyen bağlantıyı bir süre sonra kapatır. İstemci de sunucudan trafik kesilmesini izlemelidir. Bu, kullanıcının ekran başında olduğunun veya çalıştığının kanıtı değildir.

| Sinyal | Amaç | Sonuç |
| --- | --- | --- |
| STOMP heartbeat | WebSocket/STOMP bağlantısının canlı olması | Sessiz bağlantının kapatılması ve bellekteki aboneliklerinin temizlenmesi |
| REST `sessions/current/heartbeat` | Mevcut oda oturumunun sürmesi | C'nin oturum timeout'u ve aktif katılımcı listesi |

STOMP heartbeat, REST oturum heartbeat'inin yerine geçmez ve veritabanındaki `lastSeenAt` değerini değiştirmez. Bağlantı kapanması tek başına çalışma oturumunu bitirmez. Sekmenin gizlenmesi de bu sinyallerden doğrudan çalışma/puan kararı üretmez; aktif/pasif iş kuralı ayrı entegrasyondur.

Frontend bağlantı yöneticisinin uygulayacağı akış:

1. Bağlantı veya heartbeat kaybında tek bir yeniden deneme döngüsü kullanın; artan bekleme ve rastgele küçük gecikme ekleyin (örneğin 1, 2, 4, 8, en fazla 30 saniye). Kullanıcı çıkış yaptığında veya bileşen kapandığında döngüyü durdurun.
2. Her bağlantıda güncel access token'ı `CONNECT` başlığında gönderin. Gerekirse mevcut REST yenileme akışını kullanın. Heartbeat, JWT süresini uzatmaz. Yetki reddini kesintisiz tekrar denemeyin.
3. Başarılı bağlantıda abonelikleri yeniden kurun. Presence sıradaki tam listeden, sayaç `GET /api/v1/timer` ile toparlanır. Kaçırılmış olayların tekrar gönderildiğini varsaymayın.
4. Telefon/tarayıcı arka planda zamanlayıcıları yavaşlatabilir. Sekme yeniden görünür olduğunda bağlantıyı ve REST durumunu kontrol edin.

Bu teslim sunucu heartbeat'ini ve test istemcisindeki sessiz bağlantı temizliği/yeniden bağlantı doğrulamasını içerir. Ürün arayüzüne otomatik yeniden bağlanan istemci bu teslimde eklenmez.

## Oda olayları

Oda üyeleri `/topic/rooms/{roomId}/events` adresine abone olur. Sunucu, ilk katılım kaydı PostgreSQL'e başarıyla yazıldıktan sonra `MEMBER_JOINED` yayınlar. Aynı üyelik için yinelenen katılım isteği yeni olay üretmez.

```json
{
  "schemaVersion": 1,
  "eventId": "e864643e-e35b-4dfb-a5a6-cdf3f491cc18",
  "type": "MEMBER_JOINED",
  "roomId": "d7aa307f-34e1-4435-bc7f-7338520b552d",
  "occurredAt": "2026-11-09T12:00:00Z",
  "payload": {
    "roomId": "d7aa307f-34e1-4435-bc7f-7338520b552d",
    "userId": "21711231-00d4-4ffc-bc72-c96190465cf3",
    "username": "arda",
    "role": "MEMBER"
  }
}
```

`eventId` ve UTC zamanını sunucu üretir. `MEMBER_JOINED` kalıcı oda üyeliği olayıdır. Spring'in bellek içi broker'ı mevcut abonelere yayın yapar. Yeniden bağlanınca güncel üyelik REST'ten okunabilir.

## Aktif katılımcı listesi

Üyeler `/topic/rooms/{roomId}/presence` kanalına abone olur. Odayı dinleyen en az bir abonelik varsa sunucu varsayılan olarak iki saniyede bir tam liste yayınlar. Süre `app.presence.publish-interval-ms` ile ayarlanır. Aynı odayı çok kişi dinlerken liste bir kez okunup odaya yayınlanır. Abone olmayan odalar için liste sorgulanmaz.

Mesaj, oda olaylarıyla aynı zarfı kullanır. `type` alanı `PRESENCE_SNAPSHOT`, `payload` alanı `{ "members": [...] }` olur. Her katılımcıda REST `ActiveMemberResponse` ile aynı `userId`, `username`, `role` ve `startedAt` alanları bulunur. Son kişi çıktığında `members` boş dizi olur. İstemci her snapshot geldiğinde mevcut listeyi yenisiyle değiştirir. Tam liste kullanıldığı için delta tamponu veya sıra numarası gerekmiyor. Bir bağlantıda yayın sırası korunur.

Bu sürümün veri kaynağı C'nin mevcut `room_sessions` modelidir. REST üzerinden `POST /api/v1/rooms/{roomId}/sessions` ile girilir, 15–20 saniyede bir `POST .../sessions/current/heartbeat` gönderilir ve `DELETE .../sessions/current` ile çıkılır. Giriş/çıkış bir sonraki snapshot'ta görünür. Ağ kesilince heartbeat durur. Varsayılan 60 saniyelik timeout ve 15 saniyelik temizleme aralığından sonra katılımcı listeden çıkar. WebSocket aboneliğinin kapanması tek başına çalışma oturumunu bitirmez, böylece diğer sekmelerde devam eden oturum korunur.

Bağlantı yenilendiğinde kanal aboneliği yeniden kurulur ve sıradaki tam listeyle durum toparlanır. Kanalın hem abonelik hem teslim aşamasında mevcut oda üyeliği ve JWT süresi kontrol edilir. Bu teslim tek Spring uygulaması için mevcut PostgreSQL oturum kayıtlarını kullanır. Redis üzerinden geçici durum ve çoklu sunucu dağıtımı ilerleyen aşamalarda değerlendirilir.

## Kişisel sayaç

Kimliği doğrulanmış istemci `/user/queue/timers` adresine abone olur. Kullanıcı kimliği adrese eklenmez; Spring JWT kimliğiyle aynı kullanıcının bağlı ve abone olan tüm sekmelerine yayın yapar. Odada aktif oturum gerekmiyor. Başka kullanıcılar ve oda kanalları kişisel sayaç olayını almaz. Oda içindeki ortak çalışma/mola göstergesi bu kanalın kapsamı dışındadır.

Komutlar mevcut REST `POST /api/v1/timer/commands` üzerinden gider. `UserEventPublisher`, başarılı veritabanı commit'inden sonra tek kişisel olay yayınlar. Sayaç, puan, ön ayar, `commandId` ve `expectedVersion` kuralları C'nin mevcut servisindedir. Tekrarlanan komut ve reddedilen eski sürüm yeni olay üretmez. JWT süresi teslim sırasında da kontrol edilir; token yenilendikten sonra yeni bağlantı kurulur.

```json
{
  "schemaVersion": 1,
  "eventId": "31e92432-286c-43f9-a0f2-63c7f1b31a77",
  "type": "TIMER_STARTED",
  "userId": "21711231-00d4-4ffc-bc72-c96190465cf3",
  "occurredAt": "2026-11-26T12:00:00Z",
  "payload": {
    "userId": "21711231-00d4-4ffc-bc72-c96190465cf3",
    "preset": "25-5",
    "phase": "FOCUS",
    "endsAt": "2026-11-26T12:25:00Z",
    "remainingSeconds": 1500,
    "version": 1,
    "occurredAt": "2026-11-26T12:00:00Z"
  }
}
```

Kişisel zarfta `roomId` yerine `userId` bulunur. Olay tipleri:

| Tip | Tetikleyen işlem |
| --- | --- |
| `TIMER_STARTED` | START, RESUME, SKIP; `phase` başlayan fazdır |
| `TIMER_PAUSED` | PAUSE |
| `TIMER_RESET` | RESET, SET_PRESET |
| `TIMER_FINISHED` | Süresi dolan fazın REST okuması veya komut sırasında işlenmesi; `phase` biten faz, `endsAt` bitiş anı, kalan süre 0 |

Frontend entegrasyonu:

1. Bağlanıp kişisel kanala abone olun, ardından `GET /api/v1/timer` ile tam durumu okuyun. Her yeniden bağlantıda bu adımı tekrarlayın. Bellek içi broker kaçırılan olayları saklamaz.
2. Komutun REST yanıtındaki güncel durumu kullanın. Diğer sekmeler gelen olayı güncel durumu tekrar okuma sinyali olarak kullanır. Bu olay bir snapshot değildir: `status`, `totalSeconds` ve tamamlanan blok sayısı tam REST yanıtındadır. Özellikle `TIMER_FINISHED`, sıradaki fazın tam durumunu taşımaz.
3. `eventId` aynı olayı tanımlar; birden çok olay aynı `version` değerini taşıyabilir. Tam REST yanıtında daha düşük bir sürümü mevcut duruma uygulamayın. Bir sürüm boşluğu veya yeniden bağlantı olduğunda REST'ten toparlayın.
4. Saniyeleri tarayıcıda `endsAt` ve REST `serverTime` değerlerinden hesaplayın. Sunucu her saniye yayın yapmaz. Süre bittiğinde `GET /timer` çağırın; mevcut servis ancak okuma veya komut geldiğinde faz geçişini işler. Bu teslim otomatik arka plan faz geçişi eklemez.

Bu sürümle `TIMER_*` olayları oda `/events` kanalından kişisel kanala taşındı. REST uçları ve DTO'lar aynı kaldı. Eski oda kanalı tüketicileri kişisel sayaç için bu aboneliğe geçmelidir.

## Yerel doğrulama

Java backend'i ayrı bir yerel deneme veritabanıyla başlatıp depo kökünde çalıştırın:

```sh
node backend/scripts/stomp-smoke.mjs http://127.0.0.1:8080
```

Node 24 ile çalışan bu istemci, deneme hesapları ve özel bir oda oluşturur. İki oda üyesinin aynı `MEMBER_JOINED` olayını aldığını ve üye olmayan birinin abone olamadığını kontrol eder. Eksik ve geçersiz JWT ile bağlantı, jokerli abonelik ve istemcinin oda kanalına yayın yapma denemesi de sınanır. Kişisel sayaçta iki sekmeye aynı olay, odasız kullanım, başlat/duraklat/devam/faz değişimi/sıfırla/ön ayar, tekrarlanan komut, eski sürüm, kullanıcılar arası ayrım ve yeniden bağlantı doğrulanır. Presence kanalında ilk boş liste, giriş, heartbeat, yeniden bağlantı, çıkış ve heartbeat kesilince timeout doğrulanır. Varsayılan timeout ile deneme yaklaşık 1–2 dakika sürer.

İstemci ayrıca STOMP heartbeat aralığının ilanını, heartbeat gönderen bağlantının açık kalmasını, göndermeyen bağlantının kapanmasını ve aynı JWT ile yeniden bağlanmayı doğrular. Varsayılan STOMP aralığıyla bu aşama yaklaşık 30–50 saniye daha sürer.

Backend CI bu istemciyi PostgreSQL üzerinde otomatik çalıştırır. Yalnızca geçici CI sürecinde oturum timeout'u 4 saniye; STOMP heartbeat, presence ve temizleme aralıkları 200 ms olarak kısaltılır. Yerel ve yayın varsayılanları aynı kalır.

## Sonraki teslimler

- Ortak çalışma veya mola göstergesi, kişisel sayaç akışından ayrı oda olayı olarak ele alınır.
- Frontend bağlantı yöneticisi, sekme aktif/pasif bildirimi, hareket, sohbet ve kalıcı olay teslimi kendi aşamalarında eklenir.
