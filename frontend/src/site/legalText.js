// Kullanım koşulları ve gizlilik politikası metinleri. Sitenin bugün gerçekte yaptığını anlatır:
// hesaplar ve ayarlar bu tarayıcıda tutulur, sunucuya veri gönderilmez (backend henüz yok).
// Backend devreye girince "Verileri nerede saklıyoruz" bölümleri güncellenmeli.
// NOT: Yayından önce hukuki inceleme gerekir; [köşeli parantezli] yerler doldurulmalı.

export const LEGAL_UPDATED = '5 Kasım 2026'

// TODO(iletişim): gerçek iletişim adresi gelince bu satırı değiştir. Adres uydurulmaz; kişisel
// e-posta kullanılmaz. Yayına çıkmadan önce doldurulmalı.
const CONTACT_EMAIL = '[TODO: iletişim e-posta adresi]'

export const LEGAL_DOCS = {
  kosullar: {
    title: 'Kullanım koşulları',
    intro: 'Odakhane’yi kullanarak aşağıdaki koşulları kabul etmiş olursun. Kısa ve anlaşılır tutmaya çalıştık.',
    sections: [
      {
        heading: 'Hizmet',
        body: [
          'Odakhane, kamera ve mikrofon olmadan başkalarıyla aynı sanal odada çalışma hissi veren bir odaklanma aracıdır. Pomodoro sayacı, kişisel oda, ortak odalar ve avatar özellikleri sunar.',
          'Hizmet geliştirme aşamasındadır; özellikler önceden haber verilmeden değişebilir, eklenebilir ya da kaldırılabilir.',
        ],
      },
      {
        heading: 'Hesabın',
        body: [
          'Kayıt olurken verdiğin bilgilerin doğru olmasından ve şifreni gizli tutmaktan sen sorumlusun.',
          'Başkasının adına hesap açmak, başkasının hesabını kullanmak ya da kullanıcı adını başkasını taklit edecek şekilde seçmek yasaktır.',
        ],
      },
      {
        heading: 'Kullanım kuralları',
        body: [
          'Oda adlarında, görünen adlarda ve paylaştığın her şeyde hakaret, nefret söylemi, taciz, yasa dışı ya da müstehcen içerik kullanmamalısın.',
          'Hizmeti bozmaya, başkalarının hesaplarına erişmeye ya da sıralamayı hileyle değiştirmeye çalışmamalısın.',
          'Davet koduyla girilen gizli odaların kodlarını, oda sahibinin izni olmadan paylaşmamalısın.',
        ],
      },
      {
        heading: 'Sorumluluğun sınırı',
        body: [
          'Odakhane olduğu gibi sunulur. Kesintisiz ya da hatasız çalışacağını garanti etmiyoruz.',
          'Bu sürümde verilerin yalnızca kendi tarayıcında tutulur; tarayıcı verilerini silersen hesabın ve ayarların da silinir. Bu kayıptan doğan zararlardan sorumlu değiliz.',
        ],
      },
      {
        heading: 'Hesabın kapatılması',
        body: [
          'Bu koşulları ihlal eden hesapları uyarmadan askıya alabilir ya da kapatabiliriz.',
          'Hesabını istediğin zaman kullanmayı bırakabilirsin; bu sürümde tarayıcı verilerini silmen hesabını da siler.',
        ],
      },
      {
        heading: 'Değişiklikler',
        body: [
          'Bu koşulları güncelleyebiliriz. Önemli değişikliklerde sitede duyururuz; güncellemeden sonra kullanmaya devam etmen yeni koşulları kabul ettiğin anlamına gelir.',
          `Sorular için: ${CONTACT_EMAIL}`,
        ],
      },
    ],
  },

  gizlilik: {
    title: 'Gizlilik politikası',
    intro:
      'Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hangi verileri neden işlediğimizi ve haklarını anlatır.',
    sections: [
      {
        heading: 'Hangi verileri topluyoruz',
        body: [
          'Hesap bilgileri: görünen ad, kullanıcı adı, e-posta adresi ve şifren. Şifren düz metin olarak saklanmaz; geri çevrilemeyen bir özeti (PBKDF2-SHA256, kullanıcıya özel tuzla) saklanır.',
          'Kullanım tercihleri: avatarın, kişisel odanın tasarımı ve ortam sesi ayarı, açık/koyu mod seçimi, bugünkü pomodoro sayın ve odak süren.',
          'Kamera, mikrofon, konum ya da rehber verisi toplamıyoruz. Ortam sesleri cihazında üretilir; ses kaydı yapılmaz.',
        ],
      },
      {
        heading: 'Verileri nerede saklıyoruz',
        body: [
          'Bu sürümde bütün veriler yalnızca kullandığın tarayıcının yerel depolamasında (localStorage) tutulur; bizim sunucularımıza gönderilmez.',
          'Bu yüzden başka bir cihazdan ya da tarayıcıdan hesabına erişemezsin; tarayıcı verilerini silersen verilerin de silinir.',
        ],
      },
      {
        heading: 'Neden işliyoruz',
        body: [
          'Hesabını oluşturmak ve giriş yapmanı sağlamak, odalarda seni görünen adınla ve avatarınla göstermek, ayarlarını hatırlamak ve sana odak istatistiklerini göstermek için.',
          'Verilerini reklam, profilleme ya da satış amacıyla kullanmıyoruz ve üçüncü kişilerle paylaşmıyoruz.',
        ],
      },
      {
        heading: 'Üçüncü taraf hizmetler',
        body: [
          'Sitenin yazı tipleri Google Fonts üzerinden yüklenir. Bu sırada tarayıcın Google sunucularına bağlanır ve IP adresin gibi teknik bilgiler Google’a iletilebilir. Bunun dışında analiz, reklam ya da takip aracı kullanmıyoruz.',
        ],
      },
      {
        heading: 'Çerezler',
        body: ['Çerez kullanmıyoruz. Tercihlerin yalnızca tarayıcının yerel depolamasında tutulur.'],
      },
      {
        heading: 'Hakların',
        body: [
          'KVKK’nın 11. maddesi uyarınca verilerinin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltilmesini ya da silinmesini isteme ve itiraz etme hakların vardır.',
          `Bilgilerini Hesap ayarları sayfasından kendin düzeltebilirsin. Diğer talepler için: ${CONTACT_EMAIL}`,
          'Veri sorumlusu: [şirket / kişi adı ve adresi]',
        ],
      },
    ],
  },
}
