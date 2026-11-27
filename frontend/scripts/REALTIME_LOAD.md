# Gerçek zamanlı yayın yük denemesi

Bu deneme D'nin canlı yayın ve bağlantı altyapısını gerçek Spring Boot + PostgreSQL üzerinde sınar. Varsayılan 20 ayrı hesap, 20 STOMP bağlantısı ve onar kişilik iki oda kullanır: biri PRIVATE, biri PUBLIC. Yeni oda/mola/koltuk kuralları C'nin mevcut REST uçlarıyla uygulanır; test yeni iş kuralı eklemez.

## Çalıştırma

Node 24, Java 21, frontend bağımlılıkları ve paketlenmiş backend gerekir. Veritabanı ayrı ve geçici olmalıdır: test hesap/oda/oturum kayıtları oluşturur. Betik yalnızca yerel HTTP adreslerini kabul eder. Gerçek kullanıcı veritabanına veya canlı siteye yönlendirilmez.

Frontend'de `npm ci`, backend'de `./mvnw verify` (Windows: `.\mvnw.cmd verify`) çalıştırın. Backend'i geçici PostgreSQL bağlantı bilgileriyle açarken aynı IP'den 20 deneme hesabı oluşturulabilmesi için yalnızca bu deneme sürecinin kayıt sınırını yükseltin:

```sh
java -jar backend/target/backend-0.1.0-SNAPSHOT.jar \
  '--app.rate-limit.limits.[/api/v1/auth/register]=100'
```

`DB_URL`, `DB_USER`, `DB_PASSWORD` ve gerekirse `PORT` bu geçici veritabanını göstermelidir. `ROOM_SESSION_TIMEOUT_SECONDS=60` kullanın. Presence yayınını veya STOMP heartbeat aralığını kısaltmayın: bu deneme varsayılan iki saniyelik snapshot ve on saniyelik STOMP heartbeat aralıklarıyla ölçülür. Yayın yapılandırmasını veya `.env` dosyasını değiştirmek gerekmez.

Ayrı terminalde, depo kökünde:

```sh
node frontend/scripts/realtime-load.mjs http://127.0.0.1:8080 --users=20 --seconds=20
```

Varsayılan rapor `backend/target/realtime-load-report.json` dosyasına yazılır. `--out=...` ile farklı dosya seçilebilir. Betik 2–50 kullanıcı ve 5–300 saniye sabit yük bekleme süresi kabul eder. Oda başına en fazla 10 kullanıcıdır; oda türleri özel/açık olarak sırayla oluşturulur. 50 kullanıcı desteği tek başına 50 kişilik testin yapıldığı anlamına gelmez.

## Doğrulanan davranışlar

- Tüm kullanıcılar odaya girer ve kendi odalarının tam listesini alır; veri iki oda arasında karışmaz.
- Odak ve mola köşesi değişiklikleri tüm oda abonelerine ulaşır. Koltuklar benzersiz ve tutarlıdır.
- Her kullanıcı kendi kişisel sayaç olayını bir kez alır; başka kişinin sayaç bilgisi gelmez.
- Her beş kullanıcıdan birinin bağlantısı zorla kesilir (20 kullanıcıda dört bağlantı). Ortak istemci otomatik bağlanır, abonelikler geri kurulur ve sayaç REST'ten okunur.
- Oda sahipleri çıkar ve yeniden girer. Özel odada offline üye AWAY olarak kalır; açık odadan çıkan kişi listeden kaldırılır. Yeniden girişte önceki boş koltuk korunur.
- Sabit yük aşamasında tüm bağlantılar açık kalır ve snapshot almaya devam eder. Mevcut REST oturum heartbeat'i 20 saniyede bir gönderilir.

HTTP veya beklenmedik istemci hatası, eksik/yanlış snapshot, zaman aşımı ya da gecikme eşiğinin aşılması betiği başarısız bitirir. Kimlik bilgileri rapora yazılmaz. Deneme sonunda WebSocket bağlantıları/zamanlayıcıları kapanır; hesapların temizliği geçici veritabanının kaldırılmasıyla yapılır.

## Ölçümün anlamı

`p50Ms`, ölçümlerin ortanca değeridir; `p95Ms`, ölçümlerin en az yüzde 95'inin altında kaldığı süredir. Snapshot aşamalarında süre, REST işlem grubunun başlamasından her abonenin beklenen tam durumu görmesine kadar ölçülür. REST isteklerinin sıraya girmesi ve iki saniyelik yayın döngüsü bu süreye dahildir. Kişisel sayaç aşamasında her kullanıcının komut isteğinin başından kendi olayı gelene kadar ölçülür.

Varsayılan p95 sınırı 5000 ms'dir (`--p95-ms=...`). Bu bir test geçiş eşiğidir; kullanıcıya verilmiş hizmet garantisi değildir. Rapor aşama başına örnek sayısı, p50/p95/en büyük süre, HTTP hata sayısı ve sabit yükte alınan snapshot sayılarını içerir.

Bu deneme kısa süreli yerel/protokol yüküdür. Render/Neon ağ gecikmesini, saatler süren kararlılığı, tarayıcı/3D çizimini, CPU/RAM kullanımını veya çoklu sunucu dağıtımını ölçmez. Redis kararından önce bir başlangıç ölçümü sağlar; tek başına üretim kapasitesi kanıtı sayılmaz.

## CI

Backend CI önce mevcut hızlı STOMP ve istemci denemelerini çalıştırır. Ardından uygulamayı varsayılan yayın aralıklarıyla yeniden açıp 20 kullanıcılı denemeyi yapar. Yalnızca bu ikinci geçici sürecin kayıt sınırı yükseltilir; diğer auth limitleri etkin kalır. JSON raporu başarılı veya başarısız çalışmada `realtime-load-report` artifact'i olarak yedi gün saklanır. Başarısızlıkta uygulama logu da kaydedilir.

## İlk yerel ölçüm

27 Kasım 2026 tarihinde backend `5370c70` üzerinde, Windows'ta Java 21 uygulaması ve Docker PostgreSQL 16.15 ile alındı. 20 kullanıcı iki odaya dağıtıldı; sabit yük aşaması 20 saniye sürdü. Varsayılan yayın aralıkları kullanıldı.

| Aşama | Örnek sayısı | p95 (ms) |
| --- | ---: | ---: |
| İlk tam liste | 20 | 1274,34 |
| Odak durumuna geçiş | 20 | 2023,11 |
| Kişisel sayaç olayı | 20 | 64,68 |
| Mola köşesi | 20 | 1805,47 |
| Yeniden bağlantı ve liste | 4 | 1997,92 |
| Çıkış | 20 | 2011,53 |
| Yeniden giriş | 20 | 2019,07 |

141 HTTP isteğinde hata, kullanıcılar arasında mesaj karışması veya koltuk tutarsızlığı görülmedi. Sabit yük aşamasında her istemci 9 snapshot aldı. Bunlar bu kısa yerel koşunun sonuçlarıdır; yayın ortamı kapasite iddiası değildir. Sonraki koşuların ayrıntılı JSON çıktıları CI artifact'inde bulunur.
