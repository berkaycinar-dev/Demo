import { useState } from 'react'
import { Field } from './AuthPages'

// Yardım ve geri bildirim: header'daki hesap menüsünden açılır. Solda sık sorulan sorular (açılır kapanır),
// sağda geri bildirim formu.
// Geri bildirim ucu sunucuda henüz yok (contracts/openapi.yaml): form doğrular, gönderince durumu dürüstçe
// söyler; yazılan mesaj silinmez (kullanıcı kopyalayabilsin). Uç gelince submit içinde istek atılır.
const HELP_COPY = {
  title: 'Yardım ve geri bildirim',
  faq: 'Sık sorulan sorular',
  feedback: 'Geri bildirim gönder',
  kind: 'Konu',
  message: 'Mesajın',
  messagePlaceholder: 'Ne oldu, ne bekliyordun? Hangi sayfadaydın?',
  tooShort: (min) => `Biraz daha anlat: en az ${min} karakter.`,
  submit: 'Gönder',
  pending: 'Geri bildirim gönderme henüz açık değil; mesajın gönderilmedi. Yazdığın burada duruyor, bu özellik açılınca gönderebileceksin.',
  legal: 'Kullanım koşulları',
  privacy: 'Gizlilik politikası',
}

const KINDS = [
  { id: 'idea', label: 'Öneri' },
  { id: 'bug', label: 'Hata' },
  { id: 'other', label: 'Diğer' },
]

const MIN_LENGTH = 10
const MAX_LENGTH = 1000

const FAQ = [
  {
    q: 'Pomodoro ile Kronometre arasındaki fark ne?',
    a: 'Pomodoro seçtiğin süre kadar odaklanıp sonra mola verdirir (ör. 25 dk odak, 5 dk mola). Kronometre ise sen durdurana kadar sayar. İkisinde de çalıştığın süre bugünkü odağına eklenir. Seçimini odadaki kutulardan ya da Ayarlar’dan değiştirebilirsin.',
  },
  {
    q: 'Bir odaya nasıl katılırım?',
    a: 'Lobi’de bir odaya bas, önizlemesi açılsın; “odasına gir” ile içeri geç. Herkese açık odalara doğrudan girilir.',
  },
  {
    q: 'Davet kodum var, nereye yazacağım?',
    a: 'Lobi’deki “Anahtarın var mı?” kutusuna kodu yaz ve gir. Kilitli bir odayı seçtiğinde önizlemedeki düğmeyle de kodla girebilirsin.',
  },
  {
    q: 'Günlük ve haftalık hedefimi nasıl değiştiririm?',
    a: 'Odam’daki hedef kartından ya da Ayarlar’daki “Çalışma hedefleri” bölümünden değiştirebilirsin. Sayfam ilerlemeni bu hedeflere göre gösterir.',
  },
  {
    q: 'Avatarımı nasıl değiştiririm?',
    a: 'Sağ üstteki adına gel, menüden Avatarım’ı seç. Yaptığın değişiklik odalarda da görünür.',
  },
  {
    q: 'Çalışma sürelerim nerede tutuluyor?',
    a: 'Odak süren, haftalık grafiğin ve hedeflerin bu tarayıcıda saklanır. Başka bir cihazdan girersen orada sıfırdan başlar.',
  },
  {
    q: 'Koyu ya da açık görünümü nasıl seçerim?',
    a: 'Sağ üstteki adına gelip menüden Görünüm’ü seç ya da Ayarlar’daki Tema satırını kullan.',
  },
]

export default function HelpPage({ onGo }) {
  return (
    <div className="account help">
      <div className="page-head">
        <h1>{HELP_COPY.title}</h1>
      </div>
      <div className="account__grid">
        <section className="site-card account__card" aria-labelledby="yardimSss">
          <h2 id="yardimSss">{HELP_COPY.faq}</h2>
          <div className="help__faq">
            {FAQ.map((item) => (
              <details key={item.q} className="help__item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <p className="site-muted help__legal">
            <button type="button" className="link-btn" onClick={() => onGo('kosullar')}>
              {HELP_COPY.legal}
            </button>
            {' · '}
            <button type="button" className="link-btn" onClick={() => onGo('gizlilik')}>
              {HELP_COPY.privacy}
            </button>
          </p>
        </section>
        <FeedbackCard />
      </div>
    </div>
  )
}

function FeedbackCard() {
  const [kind, setKind] = useState('idea')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (message.trim().length < MIN_LENGTH) {
      setError(HELP_COPY.tooShort(MIN_LENGTH))
      setPending(false)
      document.getElementById('help-message')?.focus()
      return
    }
    // TODO(geri bildirim): sunucuda uç açılınca isteği burada at ({ kind, message }); başarıda formu
    // temizle ve "Teşekkürler, mesajın bize ulaştı." göster.
    setError('')
    setPending(true)
  }

  return (
    <section className="site-card account__card" aria-labelledby="yardimGeri">
      <h2 id="yardimGeri">{HELP_COPY.feedback}</h2>
      <form className="auth__form" onSubmit={submit} noValidate>
        <fieldset className="help__kinds">
          <legend>{HELP_COPY.kind}</legend>
          <div className="mode-choice">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                aria-pressed={kind === k.id}
                onClick={() => {
                  setKind(k.id)
                  setPending(false)
                }}
              >
                {k.label}
              </button>
            ))}
          </div>
        </fieldset>
        <Field id="help-message" label={HELP_COPY.message} error={error} hint={`${message.length} / ${MAX_LENGTH}`}>
          <textarea
            id="help-message"
            className="help__message"
            rows={6}
            maxLength={MAX_LENGTH}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setError('')
              setPending(false)
            }}
            placeholder={HELP_COPY.messagePlaceholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'help-message-err' : undefined}
          />
        </Field>
        <p className="form-note form-note--inline" role="status" hidden={!pending}>
          {pending && HELP_COPY.pending}
        </p>
        <div className="account__actions">
          <button type="submit" className="site-btn site-btn--primary" disabled={!message.trim()}>
            {HELP_COPY.submit}
          </button>
        </div>
      </form>
    </section>
  )
}
