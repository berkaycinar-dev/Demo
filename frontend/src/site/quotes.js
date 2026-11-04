// Ana sayfadaki söz: her açılışta değişir, aynı söz art arda gelmez; ziyaretçi değiştiremez.
// [söz, kaynak, odakla bağı]
export const QUOTES = [
  ['Bin millik bir yolculuk tek bir adımla başlar.', 'Lao Tzu', 'Senin adımın 25 dakika. İlk pomodoronu başlattığın an yolculuk da başlamış olur.'],
  ['Damlaya damlaya göl olur.', 'Türk atasözü', 'Her 25 dakikalık blok bir damla. Tek başına küçük görünür; haftanın sonunda göl olur.'],
  ['Bugünün işini yarına bırakma.', 'Türk atasözü', 'Ertelemenin ilacı küçük başlamaktır: bütün işi değil, sadece sıradaki 25 dakikayı düşün.'],
  ['Sabırla koruk helva olur.', 'Türk atasözü', 'Odak bir günde gelmez; her gün biraz, düzenli bloklarla büyür.'],
  ['Az olsun, öz olsun.', 'Türk atasözü', 'Dağınık geçen üç saat yerine, gerçekten odaklandığın bir pomodoro.'],
  ['Emek olmadan yemek olmaz.', 'Türk atasözü', 'Puanın, serin ve bahçen; hepsi masada geçirdiğin emeğin karşılığı.'],
  ['Hayatta en hakiki mürşit ilimdir.', 'Mustafa Kemal Atatürk', 'Bugünkü çalışman, yarın yolunu aydınlatacak bilginin bir parçası.'],
  ['Odaklanmak, hayır demek demektir.', 'Steve Jobs', 'Sayaç çalışırken bildirimlere, sekmelere ve "bir bakayım"lara hayır de.'],
  ['Zaman en kıt kaynaktır; o yönetilemezse başka hiçbir şey yönetilemez.', 'Peter Drucker', 'Pomodoro zamanı küçük, yönetilebilir parçalara böler.'],
  ['İyi başlamak, işin yarısıdır.', 'Aristoteles’e atfedilir', 'Masana otur, sayacını başlat. Gerisi kendiliğinden gelir.'],
  ['İşleyen demir ışıldar.', 'Türk atasözü', 'Her gün birkaç blok; zihnin pas tutmaz, gitgide keskinleşir.'],
  ['Bir elin nesi var, iki elin sesi var.', 'Türk atasözü', 'Yalnız çalışmak zor gelir; aynı odada başkaları da çalışınca iş kolaylaşır.'],
  ['İlim ilim bilmektir, ilim kendin bilmektir.', 'Yunus Emre', 'Hangi saatte, ne kadar sürede en iyi odaklandığını da zamanla öğrenirsin.'],
  ['Bilmek yetmez, uygulamak gerekir; istemek yetmez, yapmak gerekir.', 'Johann Wolfgang von Goethe', 'Plan yapmak güzel; ama işi asıl başlattığın sayaç bitirir.'],
  ['Mükemmel, iyinin düşmanıdır.', 'Voltaire', 'Kusursuz anı bekleme; şimdiki 25 dakika yeterince iyi.'],
  ['Dahi, yüzde bir ilham ve yüzde doksan dokuz terdir.', 'Thomas Edison’a atfedilir', 'İlham gelmeyebilir; masada geçirdiğin blok yine de sayılır.'],
  ['Ne kadar yavaş gittiğin önemli değil, yeter ki durma.', 'Konfüçyüs’e atfedilir', 'Kısa bir blok bile seriyi korur; önemli olan her gün masaya oturmak.'],
  ['Başlamanın yolu, konuşmayı bırakıp yapmaya başlamaktır.', 'Walt Disney’e atfedilir', 'Listeyi bir kenara bırak ve sadece Başlat’a bas.'],
  ['Bitirilene kadar her şey imkânsız görünür.', 'Nelson Mandela’ya atfedilir', 'Büyük işi blok blok böl; her biten pomodoro imkânsızı biraz küçültür.'],
  ['Bilgi güçtür.', 'Francis Bacon', 'Bugün biriktirdiğin her odak dakikası, yarın kullanacağın bilgiye dönüşür.'],
]

const KEY = 'odakhane-quote'
let visitQuote = null

/** Bu sayfa açılışının sözü: açılış başına bir kez seçilir, bir önceki açılıştakiyle aynı olmaz. */
export function quoteForVisit() {
  if (visitQuote !== null) return visitQuote
  let last = -1
  try {
    last = parseInt(localStorage.getItem(KEY), 10)
  } catch {
    /* depolama kapalı olabilir */
  }
  let i = Math.floor(Math.random() * QUOTES.length)
  if (i === last) i = (i + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length
  try {
    localStorage.setItem(KEY, String(i))
  } catch {
    /* yok say */
  }
  visitQuote = i
  return i
}
