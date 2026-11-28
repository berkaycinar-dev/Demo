# Veritabanı yedeği geri yükleme doğrulaması

Bu teslim, `pg_dump` ile alınan bir yedeğin boş bir veritabanına `pg_restore` ile yüklenip aynı uygulamada kullanılabildiğini otomatik sınar. CI'da her ilgili değişiklikte çalışır. Canlı veritabanı yedeği veya zamanlanmış harici yedekleme hizmeti kurmaz.

## Çalıştırma

Docker çalışmalı, `JAVA_HOME` Java 21'i göstermeli ve backend paketlenmiş olmalıdır. Backend klasöründe `./mvnw verify` (Windows: `.\mvnw.cmd verify`), ardından depo kökünde:

```sh
node backend/scripts/backup-restore-smoke.mjs
```

Betik dış veritabanı adresi, mevcut veritabanı adı veya harici arşiv almaz. Kendi PostgreSQL 16.15 konteynerinde `source` ve `restored` veritabanlarını oluşturur. Mevcut geliştirme veya canlı veritabanı kullanılmaz.

## Kontrol edilen akış

1. Ayrı prod profili uygulaması açılır; Flyway kaynak veritabanını hazırlar.
2. Gerçek API'lerle bir hesap, özel oda, mola konumunda oda oturumu ve duraklatılmış sayaç oluşturulur.
3. Uygulama kapatılır. Kaynak veritabanı `pg_dump --format=custom` ile alınır; dosya host'a kopyalanır. Arşivin başlığı, SHA-256 değeri ve `pg_restore --list` çıktısı kontrol edilir.
4. Kaynaktaki odanın adı özellikle değiştirilir. Böylece sonraki kontrolün mevcut kaynaktan değil eski yedekten geldiği ayırt edilir.
5. Host'taki dosya geri kopyalanır ve yeni, boş hedefe `pg_restore --exit-on-error --single-transaction --no-owner --no-acl` ile yüklenir. `--clean` kullanılmaz; mevcut veritabanı silinmez.
6. Hesap/oda/oturum/sayaç ve Flyway geçmişi satır sayıları karşılaştırılır. Uygulama hedef veritabanıyla açılır; oda adı, sayaç sürümü/kalan süresi, mola konumu ve refresh token akışı API'den doğrulanır.
7. Uygulama, geçici konteyner ve ona ait anonim veri volume'ü kaldırılır.

Sayaç testte duraklatılır; geçen süre veri farkı üretmez. Yalnızca geçici uygulamanın oturum timeout'u on dakikadır; yeniden uygulama açılması sırasında fixture'ın zaman aşımına uğramasını önler. Ürün ayarları değişmez. Global roller/izinler bu tek uygulama veritabanı denemesinin kapsamı dışındadır.

## Çıktılar

- `backend/target/backup-restore-report.json`: başarılı/başarısız sonuç, kontrol adımları, satır sayıları, arşiv boyutu/SHA-256 ve yerel dump/restore süreleri.
- `backend/target/samedesk-backup-*/database.dump`: yalnızca bu denemede üretilmiş sahte verinin arşivi.
- Aynı klasördeki `source.log` ve `restored.log`: geçici uygulamaların logları.

`target/` ve `.dump` dosyaları Git'e alınmaz. CI artifact'ine yalnızca test raporu eklenir; arşiv dosyası yüklenmez. Custom format sıkıştırılmış bir yedektir, şifreleme değildir. Gerçek kullanıcı verisi için şifreli harici depolama, erişim ve saklama düzeni ayrı canlı yedekleme tesliminde kurulmalıdır.

Bu küçük fixture'ın süreleri üretim yedeğinin süresi veya kapasitesi hakkında garanti vermez. Restore doğrulaması; büyük veri, sunucu tamamen kaybı, provider snapshot'ı ve belirli bir zamana geri dönüş testlerinden ayrıdır.

Kaynaklar: [PostgreSQL 16 pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html), [PostgreSQL 16 pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html).
