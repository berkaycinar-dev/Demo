# STOMP mesaj sözleşmesi

Sürüm 2 · Sahip D · Oda olayları ve aktif katılımcı listesi

## Bağlantı ve yetki

- WebSocket adresi `/ws`. Yayın ortamında WSS kullanılır. Tarayıcı bağlantıları aynı origin veya `CORS_ORIGINS` içindeki açıkça belirtilen origin üzerinden açılır.
- İstemci STOMP 1.2 `CONNECT` çerçevesinde `Authorization: Bearer <accessToken>` başlığını gönderir. Token URL'ye yazılmaz. HTTP el sıkışmasından sonra kimlik doğrulanır.
- REST ve STOMP aynı `JwtDecoder` kullanır. JWT imzası, `iss` ve süre doğrulanır. Kimlik `sub` alanındaki kullanıcı UUID'sidir. Claim ve refresh davranışı [REST sözleşmesinde](openapi.yaml) tanımlanır.
- Odayı yalnızca `RoomAccessChecker` tarafından üye olduğu doğrulanan kullanıcı dinleyebilir. Oda kimliği küçük harfli UUID olarak yazılır. Wildcard ve diğer abonelik adresleri reddedilir.
- İstemci `CONNECT`, `SUBSCRIBE`, `UNSUBSCRIBE` ve `DISCONNECT` kullanır. Odaya katılma ve oturum heartbeat'i REST üzerinden yapılır. İstemciden `SEND` kabul edilmez.
- Token süresi dolduğunda açık aboneliğe olay teslimi durur. Sonraki abonelik işlemi de reddedilir. İstemci access token'ı REST üzerinden yenileyip tekrar bağlanır ve abone olur. Üyelik teslim anında yeniden kontrol edilir.
- Hatalı işlemde `ERROR` çerçevesinin `message` başlığı `UNAUTHENTICATED`, `FORBIDDEN` veya `INVALID_FRAME` olur ve bağlantı kapanır.

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

## Yerel doğrulama

Java backend'i ayrı bir yerel deneme veritabanıyla başlatıp depo kökünde çalıştırın:

```sh
node backend/scripts/stomp-smoke.mjs http://127.0.0.1:8080
```

Node 24 ile çalışan bu istemci, deneme hesapları ve özel bir oda oluşturur. İki oda üyesinin aynı `MEMBER_JOINED` olayını aldığını ve üye olmayan birinin abone olamadığını kontrol eder. Eksik ve geçersiz JWT ile bağlantı, jokerli abonelik ve istemcinin oda kanalına yayın yapma denemesi de sınanır. Presence kanalında ilk boş liste, giriş, heartbeat, yeniden bağlantı, çıkış ve heartbeat kesilince timeout doğrulanır. Varsayılan timeout ile deneme yaklaşık 1–2 dakika sürer.

## Sonraki teslimler

- H5 sayaç komutları ve durum sürümü C'nin REST akışından gelir. D, kişisel sayaç olaylarını kullanıcının kendi aboneliğine yayınlar. Ortak çalışma veya mola göstergesi ayrı oda olayıdır.
- Uygulama heartbeat'i, yeniden bağlanma, hareket, sohbet ve kalıcı olay teslimi kendi aşamalarında eklenir.
