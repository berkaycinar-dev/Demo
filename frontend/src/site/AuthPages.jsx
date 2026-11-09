import { useState } from 'react'
import { PASSWORD_RULES, lastLoginId, login, register, requestPasswordReset, validateRegistration } from './auth'
import { LegalDialog } from './LegalPages'
import RoomShot from './RoomShot'

// Marka paneli: madde listesi yerine odanın kendisi. Görsel süstür. Uzun formda (kayıt) panel de
// uzar; boş kalmasın diye ikinci bir oda eklenir. Telefonda panel formun üstünde ince bir satırdır.
function AuthShell({ rooms = ['cabin'], children }) {
  return (
    <div className="auth">
      <section className="auth__brand" aria-label="Odakhane hakkında">
        <div className={`auth__rooms${rooms.length > 1 ? ' auth__rooms--pair' : ''}`}>
          {rooms.map((theme, i) => (
            <RoomShot key={theme} theme={theme} className="auth__room" eager={i === 0} />
          ))}
        </div>
        <div className="auth__brand-top">
          <h2>Kamerasız, sessiz, birlikte.</h2>
          <p>Başkalarının da çalıştığını görmek odaklanmayı kolaylaştırır. Odana gir, sayacını başlat, gerisini birlikte hallederiz.</p>
        </div>
      </section>
      <section className="auth__card">{children}</section>
    </div>
  )
}

export function Field({ id, label, error, hint, children }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <span id={`${id}-err`} className="form-error">
          {error}
        </span>
      ) : (
        hint && <span className="site-muted auth-field__hint">{hint}</span>
      )}
    </div>
  )
}

// Şifre koşulları: yazarken her koşulun yanında sağlandı / sağlanmadı işareti.
export function PasswordRules({ value }) {
  return (
    <ul className="pass-rules" aria-label="Şifre koşulları">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value)
        return (
          <li key={r.id} className={ok ? 'is-ok' : undefined}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ok ? <path d="M5 12l5 5L20 7" /> : <circle cx="12" cy="12" r="4" />}
            </svg>
            {r.label}
            <span className="sr-only">{ok ? ' (sağlandı)' : ' (eksik)'}</span>
          </li>
        )
      })}
    </ul>
  )
}

// Şifre gücü: 4 parçalı çubuk ve tek satır açıklama. Seviye sağlanan koşul sayısından gelir;
// kayıt yalnızca "Güçlü" (bütün koşullar) olunca geçer.
const STRENGTH_WORDS = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü']

function strengthOf(password) {
  if (!password) return 0
  const met = PASSWORD_RULES.filter((r) => r.test(password)).length
  return met === PASSWORD_RULES.length ? 4 : met === 4 ? 3 : met === 3 ? 2 : 1
}

export function PasswordStrength({ value }) {
  const level = strengthOf(value)
  return (
    <span className={`strength strength--${level}`}>
      <span className="strength__bars" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={i <= level ? 'is-on' : undefined} />
        ))}
      </span>
      <span className="strength__text" aria-live="polite">
        {value ? `Şifre gücü: ${STRENGTH_WORDS[level]}` : 'Harf, rakam ve sembol karışımı daha güçlüdür.'}
      </span>
    </span>
  )
}

export function PasswordInput({ id, value, onChange, autoComplete, invalid, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <span className="pass">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-err` : undefined}
      />
      <button type="button" className="pass__toggle" onClick={() => setShow((v) => !v)} aria-pressed={show}>
        {show ? 'Gizle' : 'Göster'}
      </button>
    </span>
  )
}

export function LoginPage({ onDone, onGo }) {
  const [identifier, setIdentifier] = useState(lastLoginId)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [forgot, setForgot] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!identifier.trim() || !password) {
      setError('E-posta / kullanıcı adı ve şifreni yaz.')
      return
    }
    setBusy(true)
    const res = await login(identifier, password, remember)
    setBusy(false)
    if (res.error) setError(res.error)
    else onDone(res.user)
  }

  if (forgot) {
    // Kullanıcı adı yazılmışsa e-posta alanına taşınmaz; yalnızca e-posta biçimindeyse taşınır.
    return <ForgotPassword initialEmail={identifier.includes('@') ? identifier.trim() : ''} onBack={() => setForgot(false)} />
  }

  return (
    <AuthShell>
      <div className="auth__head">
        <h1>Tekrar hoş geldin</h1>
        <p className="site-muted">Kaldığın yerden devam etmek için giriş yap.</p>
      </div>
      <form className="auth__form" onSubmit={submit} noValidate>
        {error && (
          <div className="form-alert" role="alert">
            {error}
          </div>
        )}
        <Field id="loginId" label="E-posta veya kullanıcı adı">
          <input id="loginId" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder="ornek@posta.com ya da kullanici_adi" />
        </Field>
        <div className="auth-field">
          <span className="auth-field__label-row">
            <label htmlFor="loginPass">Şifre</label>
            <button type="button" className="link-btn" onClick={() => setForgot(true)}>
              Şifremi unuttum
            </button>
          </span>
          <PasswordInput id="loginPass" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Şifren" />
        </div>
        <label className="auth-check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>Beni hatırla</span>
        </label>
        <button type="submit" className="site-btn site-btn--primary site-btn--wide" disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
      <p className="auth__switch">
        Odakhane’de yeni misin?{' '}
        <button type="button" className="link-btn link-btn--strong" onClick={() => onGo('kayit')}>
          Hesap oluştur
        </button>
      </p>
    </AuthShell>
  )
}

// Şifremi unuttum: e-posta istenir. Bu sürümde e-posta gönderen sunucu olmadığı için bağlantı
// gönderildi denmez; durum açıkça yazılır (bkz. auth.requestPasswordReset).
function ForgotPassword({ initialEmail, onBack }) {
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    const res = await requestPasswordReset(email)
    if (res.error) {
      setError(res.error)
      return
    }
    setResult(res)
  }

  return (
    <AuthShell>
      <div className="auth__head">
        <button type="button" className="link-btn back-link" onClick={onBack}>
          ← Girişe dön
        </button>
        <h1>Şifreni mi unuttun?</h1>
        <p className="site-muted">Hesabının e-posta adresini yaz; şifreni sıfırlaman için sana bir bağlantı gönderelim.</p>
      </div>
      {result ? (
        <div className="form-note" role="status">
          <strong>Şifre sıfırlama e-postası henüz gönderilemiyor.</strong>
          <span>
            E-posta gönderimi sunucu bağlandığında açılacak. Bu sürümde hesaplar yalnızca bu tarayıcıda tutulduğu için şimdilik şifre sıfırlanamıyor. Şifreni hatırlıyorsan giriş yapıp Hesap ayarları sayfasından değiştirebilirsin.
          </span>
          <button type="button" className="site-btn site-btn--primary" onClick={onBack}>
            Girişe dön
          </button>
        </div>
      ) : (
        <form className="auth__form" onSubmit={submit} noValidate>
          <Field id="resetEmail" label="E-posta" error={error}>
            <input
              id="resetEmail"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              autoComplete="email"
              placeholder="ornek@posta.com"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'resetEmail-err' : undefined}
            />
          </Field>
          <button type="submit" className="site-btn site-btn--primary site-btn--wide" disabled={!email.trim()}>
            Sıfırlama bağlantısı gönder
          </button>
        </form>
      )}
    </AuthShell>
  )
}

const EMPTY = { displayName: '', username: '', email: '', password: '', password2: '', terms: false }

export function RegisterPage({ onDone, onGo }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [legal, setLegal] = useState(null)
  const acceptTerms = () => {
    setForm((f) => ({ ...f, terms: true }))
    setErrors((er) => ({ ...er, terms: undefined }))
  }
  // Yazıdaki bağlantılar: tıklayınca metin açılır, onay kutusu kendiliğinden değişmez.
  const openLegal = (kind) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLegal(kind)
  }

  const set = (key) => (e) => {
    const value = key === 'username' ? e.target.value.toLowerCase() : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validateRegistration(form)
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(`reg-${Object.keys(found)[0]}`)?.focus()
      return
    }
    setBusy(true)
    const res = await register(form)
    setBusy(false)
    if (res.error) setErrors(res.error)
    else onDone(res.user)
  }

  const input = (key, props) => (
    <input
      id={`reg-${key}`}
      value={form[key]}
      onChange={set(key)}
      aria-invalid={errors[key] ? true : undefined}
      aria-describedby={errors[key] ? `reg-${key}-err` : undefined}
      {...props}
    />
  )

  return (
    <AuthShell rooms={['cabin', 'library']}>
      <div className="auth__head">
        <h1>Hesap oluştur</h1>
        <p className="site-muted">Bir dakikanı alır. Avatarını kayıttan sonra hazırlarsın.</p>
      </div>
      <form className="auth__form" onSubmit={submit} noValidate>
        <Field id="reg-displayName" label="Görünen ad" error={errors.displayName} hint="Odalarda ve sayfanda böyle görünürsün.">
          {input('displayName', { autoComplete: 'name', placeholder: 'Berkay Çınar', maxLength: 40 })}
        </Field>
        <Field id="reg-username" label="Kullanıcı adı" error={errors.username} hint="Küçük harf, rakam, nokta ve alt çizgi.">
          {input('username', { autoComplete: 'username', placeholder: 'berkay', maxLength: 20, spellCheck: false })}
        </Field>
        <Field id="reg-email" label="E-posta" error={errors.email}>
          {input('email', { type: 'email', autoComplete: 'email', placeholder: 'ornek@posta.com' })}
        </Field>
        <Field id="reg-password" label="Şifre" error={errors.password}>
          <PasswordInput id="reg-password" value={form.password} onChange={set('password')} autoComplete="new-password" placeholder="En az 8 karakter" invalid={!!errors.password} />
          <PasswordStrength value={form.password} />
        </Field>
        <Field id="reg-password2" label="Şifre tekrar" error={errors.password2}>
          <input
            id="reg-password2"
            type="password"
            value={form.password2}
            onChange={set('password2')}
            autoComplete="new-password"
            placeholder="Şifreni tekrar yaz"
            aria-invalid={errors.password2 ? true : undefined}
            aria-describedby={errors.password2 ? 'reg-password2-err' : undefined}
          />
        </Field>
        <div className="auth-terms">
          <label>
            <input
              id="reg-terms"
              type="checkbox"
              checked={form.terms}
              onChange={(e) => {
                setForm((f) => ({ ...f, terms: e.target.checked }))
                if (errors.terms) setErrors((er) => ({ ...er, terms: undefined }))
              }}
              aria-invalid={errors.terms ? true : undefined}
              aria-describedby={errors.terms ? 'reg-terms-err' : undefined}
            />
            <span>
              <button type="button" className="inline-link" onClick={openLegal('kosullar')}>
                Kullanım koşullarını
              </button>{' '}
              ve{' '}
              <button type="button" className="inline-link" onClick={openLegal('gizlilik')}>
                gizlilik politikasını
              </button>{' '}
              okudum, kabul ediyorum.
            </span>
          </label>
          {errors.terms && (
            <span id="reg-terms-err" className="form-error">
              {errors.terms}
            </span>
          )}
        </div>
        <button type="submit" className="site-btn site-btn--primary site-btn--wide" disabled={busy}>
          {busy ? 'Hesap oluşturuluyor…' : 'Kayıt ol'}
        </button>
      </form>
      <LegalDialog kind={legal} onClose={() => setLegal(null)} onAccept={acceptTerms} />
      <p className="auth__switch">
        Zaten hesabın var mı?{' '}
        <button type="button" className="link-btn link-btn--strong" onClick={() => onGo('giris')}>
          Giriş yap
        </button>
      </p>
    </AuthShell>
  )
}
