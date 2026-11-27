# Canlı bağlantı yöneticisi

D'nin ortak bağlantı katmanı `createSiteRealtimeConnection` ile oluşturulur. A, kendi ekranındaki veriyi ve hata gösterimini yönetir. Bu teslim ekranlara otomatik bağlantı eklemez; mevcut oda oturumu heartbeat'i ve sayaç arayüzü kendi akışında kalır.

## Ekrana bağlama

Giriş yapmış kullanıcı için React effect'i içinde bir yönetici oluşturun. Abonelikleri `start()` öncesinde kaydedin; effect temizliğinde `stop()` çağırın. Kullanıcı/oda değiştiğinde yeni bir örnek oluşturun. `stop()` abonelikleri ve zamanlayıcıları temizler; çıkıştan sonra eski kullanıcı adına yeniden bağlanılmaz.

```js
import { api } from '../site/api.js'
import { createSiteRealtimeConnection } from './siteConnection.js'

const live = createSiteRealtimeConnection({
  onResync: async ({ isCurrent }) => {
    const state = await api('/api/v1/timer')
    if (isCurrent()) applyTimer(state)
  },
  onStateChange: (state) => showConnectionState(state),
  onError: ({ code }) => showConnectionError(code),
})
live.subscribe('/user/queue/timers', () => live.wake())
live.subscribe(`/topic/rooms/${roomId}/presence`, (event) => replaceMembers(event.payload.members))
live.start()

// Effect cleanup:
// void live.stop()
```

Örnekteki `applyTimer`, `showConnectionState`, `showConnectionError`, `replaceMembers` ve `roomId` ekran tarafından sağlanır. `applyTimer`, mevcut durumdan daha düşük `version` uygulamamalıdır. Aynı bağlantı içinde birden fazla REST okuması çakışabileceği için ekran gerekirse okumaları birleştirir. `isCurrent()` yalnızca bağlantı neslinin hâlâ geçerli olduğunu söyler; çıkıştan/yeniden bağlantıdan önce başlatılmış geç yanıtların uygulanmasını önler.

`subscribe()` bir kaldırma fonksiyonu döndürür. Kaldırılmış abonelik yeniden bağlantıda kurulmaz. Abone olunan kanallar yalnızca STOMP sözleşmesindeki oda `events`, `presence` ve kişisel `timers` kanallarıdır. İstemciye yayın yapma metodu sunulmaz.

## Bağlantı davranışı

- Tek bir yeniden deneme döngüsü vardır. Ağ hatalarında yaklaşık 1, 2, 4, 8, 16 ve en fazla 30 saniyelik bekleme uygulanır; küçük rastgele gecikme farkı eklenir.
- Her denemede güncel kimlik bilgisi alınır. REST ve STOMP mevcut tek token yenileme isteğini paylaşır. JWT süresi yaklaşınca yenilenmiş token ile yeniden bağlantı kurulur.
- STOMP `UNAUTHENTICATED` için bir kez zorunlu token yenilemesi denenir. Tekrar reddedilirse veya oda yetkisi `FORBIDDEN` dönerse döngü durur. Ekran kullanıcıya uygun sonraki adımı sunar.
- Her başarılı bağlantıda abonelikler yeniden kurulur ve `onResync` çağrılır. Presence yeni tam listeyi bekler; sayaç REST'ten okunur. Mesaj tekrarı veya kalıcı teslim garantisi yoktur.
- Sekme görünür olduğunda ve ağ geri geldiğinde bağlantı uyandırılır. Çıkış veya başka hesaba geçiş bağlantıyı durdurur. Sekme görünürlüğünden puan/çalışma kuralı üretilmez.
- `state`: `idle`, `connecting`, `connected`, `reconnecting`, `stopped`, `unauthenticated`, `forbidden`, `error`. Callback'ler ve hata kodları token/ham STOMP çerçevesi içermez.

## Test

`npm test`, bağlantı döngüsü, aboneliklerin geri kurulması, token yenileme, yetki hatası, çıkış/hesap değişimi ve geç yanıt senaryolarını sınar. Bu testler frontend CI'da çalışır.

Geçici yerel backend üzerinde gerçek bağlantı denemesi:

```sh
node frontend/scripts/realtime-smoke.mjs http://127.0.0.1:8080
```

Bu komut depo kökünde çalıştırılır; tek bir deneme hesabı ve özel oda oluşturur. Gerçek WebSocket zorla kesilir; otomatik yeniden bağlantı, geri kurulan abonelikler ve kesinti sırasında değişen sayacın REST'ten toparlanması doğrulanır. Backend CI, mevcut backend STOMP denemesinden sonra bu istemciyi de çalıştırır.

20 kullanıcılı, özel/açık oda ve durum/koltuk doğrulaması içeren ölçüm: [yük testi kılavuzu](../../scripts/REALTIME_LOAD.md). Bu ölçüm varsayılan yayın aralıklarıyla çalışır ve CI'da JSON raporu üretir.
