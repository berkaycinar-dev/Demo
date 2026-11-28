# API logları ve istek takibi

Prod profilinde Spring Boot'un yerleşik Logstash JSON çıktısı kullanılır. Her log olayı tek JSON satırıdır; uygulama banner'ı kapalıdır. Loglar konsola çıkar ve yayın sağlayıcısının mevcut log ekranından okunur. Yerel geliştirmede mevcut metin formatı korunur; HTTP tamamlanma satırı aynı takip numarasını okunabilir biçimde içerir. Yeni bir log sunucusu veya paket gerekmez.

## Bir isteği bulma

`/api/*` isteklerinin yanıtında sunucunun ürettiği UUID `X-Request-ID` başlığında bulunur. Gelen istekteki aynı başlık kullanılmaz; her istek yeni kimlik alır. Tarayıcı geliştirici araçlarının Network bölümünde ilgili yanıtın başlığı okunabilir. İzin verilen frontend origin'lerinde JavaScript'in de okuyabilmesi için CORS expose listesine eklenmiştir. Arayüzde kullanıcıya gösterme işi ayrı entegrasyondur.

Bu numarayı Render log ekranında aratarak ilgili HTTP kaydına ulaşın. Dışarı alınmış JSON log dosyasında örnek:

```sh
jq 'select(.requestId == "00000000-0000-4000-8000-000000000000")' application.log
```

Örnek tamamlanma kaydının ilgili alanları:

```json
{
  "event": "http.request.completed",
  "requestId": "00000000-0000-4000-8000-000000000000",
  "http_method": "GET",
  "http_route": "/api/v1/rooms/{roomId}",
  "http_status": 404,
  "duration_ms": 12,
  "completion": "completed",
  "level": "WARN"
}
```

- `http_route` gerçek yolun yerine Spring'in eşleşen şablonudur. Controller'a ulaşmadan reddedilen isteklerde `unmapped` yazılır.
- `duration_ms`, senkron API zincirinin başlangıcından tamamlanmasına kadar geçen süredir; sunucunun monoton saatiyle ölçülür.
- 2xx/3xx kayıtları INFO, 4xx kayıtları WARN, 5xx kayıtları ERROR düzeyindedir.
- `completion=exception`, zincirden yakalanmamış hata çıktığını gösterir. Bu durumda yanıt henüz hata durumuna geçmemişse logdaki durum 500 olarak tahmin edilir; filtre hata yanıtını yazmaz ve hatayı yutmaz.
- Filtre güvenlik zincirinden önce çalışır; 401 ve hız sınırı yanıtları da kimlik alır. Thread'in önceki log bağlamı istek sonunda geri yüklenir.

Bu HTTP kaydı parola, JWT, cookie, istek/yanıt gövdesi, query string, gerçek yol parametreleri veya IP içermez. Kimlik/yetki kuralları ve hata DTO'ları aynı kalır. Başka logger'ların çıktısı bu filtrenin alanlarından ayrı değerlendirilir.

`/actuator/health` ve WebSocket mesajları bu HTTP tamamlanma filtresinin kapsamı dışındadır. Sağlık yoklamaları logu doldurmaz. STOMP olaylarındaki mevcut `eventId` ayrı bir olay kimliğidir; bu teslim dağıtık tracing, kalıcı log saklama, alarm veya WebSocket başına izleme eklemez.

## Doğrulama

`./mvnw verify` takip numarasının üretimini, aynı thread'de kimlik karışmamasını, hata durumlarını ve filtre kaydının hassas verileri içermemesini sınar.

Geçici PostgreSQL ile, prod profilinin gerekli DB/JWT/origin ayarlarını vererek uygulamayı açın. Test origin'i `https://observability.example.test` olmalıdır. Uygulamanın stdout çıktısını dosyaya yönlendirin:

```sh
java -jar backend/target/backend-0.1.0-SNAPSHOT.jar --spring.profiles.active=prod > backend/target/backend-observability.log 2>&1
```

Ayrı terminalde depo kökünde:

```sh
node backend/scripts/observability-smoke.mjs http://127.0.0.1:8080 backend/target/backend-observability.log
```

Bu betik yalnızca yerel backend'i kabul eder ve tek bir deneme hesabı oluşturur. Gerçek 200/201/401/404 yanıtları, CORS, yanıt/log kimliği eşleşmesi, JSON çıktısı ve deneme token/parola değerlerinin logda bulunmaması doğrulanır. Backend CI aynı denemeyi ayrı prod sürecinde, rastgele geçici JWT anahtarıyla çalıştırır. Başarısızlıkta prod uygulama logu mevcut hata raporuna eklenir.

Bu PR yayınlandığında Render'ın mevcut prod profili JSON formatını kullanır. Bu çalışmada canlı ortam ayarı veya harici servis hesabı değiştirilmez.
