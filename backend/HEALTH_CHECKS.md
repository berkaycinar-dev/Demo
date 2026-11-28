# Canlılık ve hazır olma kontrolleri

İki sağlık kontrolü farklı sorulara cevap verir:

| Uç | Kontrol | Veritabanı kesildiğinde |
| --- | --- | --- |
| `/actuator/health/liveness` | Uygulamanın yaşam durumu | Uygulama açıkken 200 / UP |
| `/actuator/health/readiness` | Uygulamanın hazır durumu ve PostgreSQL bağlantısı | 503 / DOWN veya bağlantı bekleme süresince timeout |

Bu uçlar mevcut sunucu portunda çalışır ve token gerektirmez. JSON yalnızca `status` alanını içerir; bağlantı adresi, kullanıcı adı, hata detayı ve bileşen listesi gösterilmez. Mevcut `/actuator/health` ucu da kullanılmaya devam edebilir. Bu kontrol, tablo/iş kuralı doğrulamasının veya uçtan uca testin yerine geçmez.

`liveness` veritabanını içermez. Bir veritabanı sorunu uygulama prosesinin öldüğü anlamına gelmez. `readiness`, `readinessState` ve `db` göstergelerini birlikte kullanır; veritabanı geri geldiğinde aynı uygulama yeniden hazır olabilir. İki kontrol de Spring Boot Actuator'ın yerleşik özellikleridir.

## Yayın ortamı

`render.yaml` sağlık yolu `/actuator/health/readiness` olarak ayarlandı. Blueprint senkronizasyonu/yayın sonrasında Render hazır olma kontrolünü bu uçtan yapabilir. Render tek bir sağlık yolu kullanır; uzun süren readiness hatalarında sağlayıcının kendi trafik kesme ve yeniden başlatma politikası geçerlidir. Ayrı liveness ucu bu politikayı değiştirmez.

Bu çalışmada Render Dashboard'a veya canlı veritabanına işlem yapılmaz. Hazırlanan değişiklikler depoya aittir.

## Yerel doğrulama

Docker çalışıyor ve `JAVA_HOME` Java 21'i gösteriyor olmalıdır. Önce backend'de `./mvnw verify` (Windows: `.\mvnw.cmd verify`) ile jar'ı paketleyin. Ardından depo kökünde:

```sh
node backend/scripts/health-probes-smoke.mjs
```

Betik kendi rastgele isimli PostgreSQL 16.15 konteynerini ve yerel portunu oluşturur. Mevcut veritabanı adı/adresi almaz. Ayrı bir prod profili uygulaması başlatır ve şu sırayı doğrular:

1. Liveness ve readiness 200 / UP döner; ayrıntılar gizlidir.
2. Tek bir deneme hesabı ve odası oluşturulur.
3. Yalnızca betiğin kendi PostgreSQL konteyneri durdurulur. Uygulama açık kalırken liveness 200 / UP, readiness 503 / DOWN döner.
4. Aynı konteyner tekrar açılır. Readiness yeniden UP olur ve önce oluşturulan oda okunabilir; veriler korunmuştur.
5. Uygulama, geçici konteyner ve ona ait anonim veri volume'ü kaldırılır.

Rapor `backend/target/health-probes-report.json`, uygulama logu `backend/target/samedesk-health-*/app.log` altında oluşur. Betik uygulamanın mevcut veritabanı bağlantı bekleme sürelerini değiştirmez; kesinti sırasında readiness yanıtı bağlantı havuzunun hata vermesini bekleyebilir. Rapor süreleri hizmet garantisi değildir.

Backend CI aynı denemeyi kendi oluşturduğu ayrı konteynerle çalıştırır; diğer testlerin veritabanını durdurmaz. Rapor ve uygulama logu `health-probes-report` artifact'i olarak yedi gün saklanır.

Kaynaklar: [Spring Boot Actuator sağlık grupları](https://docs.spring.io/spring-boot/4.1/reference/actuator/endpoints.html), [Render sağlık kontrolleri](https://render.com/docs/health-checks).
