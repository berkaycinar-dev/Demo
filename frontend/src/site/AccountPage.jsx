import { useState } from 'react'
import { passwordProblem, updateProfile } from './auth'
import { Field, PasswordInput, PasswordRules } from './AuthPages'

// Hesap: header'daki hesap menüsünden (Profilim) açılır. Tek sütun, okuma sırasıyla: kim olduğun (ad,
// kullanıcı adı), giriş bilgileri (e-posta), şifre ve oturum. Görünüm ve dil Ayarlar sayfasında.
// Şifre değiştirme formu hazırdır ama sunucuda ucu henüz yok (gönderince durum söylenir). E-posta
// değiştirme ucu da yok: form gösterilmez, durum sessiz bir notla yerinde söylenir.
const ACCOUNT_COPY = {
  title: 'Hesap ayarları',
}

export default function AccountPage({ user, onUserChange, onLogout }) {
  return (
    <div className="account account--profile">
      <div className="page-head">
        <h1>{ACCOUNT_COPY.title}</h1>
      </div>
      <div className="account__stack">
        <ProfileCard user={user} onUserChange={onUserChange} />
        <LoginCard user={user} />
        <PasswordCard user={user} />
        <SessionCard onLogout={onLogout} />
      </div>
    </div>
  )
}

const SESSION_COPY = {
  title: 'Oturum',
  session: 'Bu cihazda oturumun açık',
  logout: 'Çıkış yap',
}

function SessionCard({ onLogout }) {
  return (
    <section className="site-card account__card" aria-labelledby="oturumBaslik">
      <h2 id="oturumBaslik">{SESSION_COPY.title}</h2>
      <div className="account__rows">
        <div className="account__row">
          <div className="account__row-text">
            <span className="account__row-label">{SESSION_COPY.session}</span>
          </div>
          <button type="button" className="site-btn" onClick={onLogout}>
            {SESSION_COPY.logout}
          </button>
        </div>
      </div>
    </section>
  )
}

// Kaydedildi mesajı: bir sonraki düzenlemede temizlenir.
function Saved({ text }) {
  if (!text) return null
  return (
    <p className="account__saved" role="status">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12l5 5L20 7" />
      </svg>
      {text}
    </p>
  )
}

function useForm(initial) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key, transform = (v) => v) => (e) => {
    setForm((f) => ({ ...f, [key]: transform(e.target.value) }))
    setErrors((er) => (er[key] || er.form ? { ...er, [key]: undefined, form: undefined } : er))
    setSaved('')
  }
  return { form, setForm, errors, setErrors, saved, setSaved, busy, setBusy, set }
}

function inputProps(id, errors, key) {
  return {
    id,
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `${id}-err` : undefined,
  }
}

const PROFILE_COPY = {
  title: 'Profil',
  displayName: 'Görünen ad',
  username: 'Kullanıcı adı',
  noChange: 'Değişiklik yok. Adı düzenleyince Kaydet açılır.',
  saved: 'Görünen adın kaydedildi.',
}

function ProfileCard({ user, onUserChange }) {
  const f = useForm({ displayName: user.displayName })
  const changed = f.form.displayName.trim() !== user.displayName

  const submit = (e) => {
    e.preventDefault()
    const res = updateProfile(f.form)
    if (res.error) {
      f.setErrors(res.error)
      return
    }
    onUserChange(res.user)
    f.setSaved(PROFILE_COPY.saved)
  }

  return (
    <section className="site-card account__card" aria-labelledby="profilBaslik">
      <h2 id="profilBaslik">{PROFILE_COPY.title}</h2>
      <form className="auth__form" onSubmit={submit} noValidate>
        <Field id="acc-displayName" label={PROFILE_COPY.displayName} error={f.errors.displayName}>
          <input {...inputProps('acc-displayName', f.errors, 'displayName')} value={f.form.displayName} onChange={f.set('displayName')} autoComplete="name" maxLength={40} />
        </Field>
        {/* kullanıcı adı değişmez: alan değil, okunan bir satır */}
        <dl className="account__facts">
          <div>
            <dt>{PROFILE_COPY.username}</dt>
            <dd>@{user.username}</dd>
          </div>
        </dl>
        {f.errors.form && <div className="form-alert" role="alert">{f.errors.form}</div>}
        <div className="account__actions">
          <button type="submit" className="site-btn site-btn--primary" disabled={!changed} aria-describedby={!changed && !f.saved ? 'profilNoChange' : undefined}>
            Kaydet
          </button>
          {f.saved ? (
            <Saved text={f.saved} />
          ) : (
            !changed && (
              <p id="profilNoChange" className="account__nochange">
                {PROFILE_COPY.noChange}
              </p>
            )
          )}
        </div>
      </form>
    </section>
  )
}

// Giriş bilgileri ve şifre metinleri.
// Şifre değiştirme ucu sunucuda henüz yok (contracts/openapi.yaml): form doğrular, gönderince durumu
// söyler ve şifre alanlarını temizler (yazılan şifre ekranda kalmaz). Uç gelince submit içinde istek atılır.
const LOGIN_COPY = {
  title: 'Giriş bilgileri',
  email: 'E-posta',
  passwordTitle: 'Şifreyi değiştir',
  current: 'Mevcut şifre',
  next: 'Yeni şifre',
  next2: 'Yeni şifre tekrar',
  currentEmpty: 'Mevcut şifreni yaz.',
  same: 'Yeni şifre mevcut şifrenden farklı olmalı.',
  mismatch: 'Şifreler aynı değil.',
  submit: 'Şifreyi değiştir',
  pending: 'Şifre değiştirme henüz açık değil; şifren değişmedi. Bu özellik açılınca buradan değiştirebileceksin.',
}

const PASSWORD_ORDER = ['current', 'next', 'next2']
const EMPTY_PASSWORDS = { current: '', next: '', next2: '' }

function validatePasswords({ current, next, next2 }) {
  const errors = {}
  if (!current) errors.current = LOGIN_COPY.currentEmpty
  const weak = passwordProblem(next)
  if (weak) errors.next = weak
  else if (current && next === current) errors.next = LOGIN_COPY.same
  if (next2 !== next) errors.next2 = LOGIN_COPY.mismatch
  return errors
}

// Giriş bilgileri: e-posta okunur; değiştirme ucu yok, durum altında kısa bir notla söylenir.
function LoginCard({ user }) {
  return (
    <section className="site-card account__card" aria-labelledby="girisBaslik">
      <h2 id="girisBaslik">{LOGIN_COPY.title}</h2>
      <dl className="account__facts">
        <div>
          <dt>{LOGIN_COPY.email}</dt>
          <dd>{user.email}</dd>
        </div>
      </dl>
    </section>
  )
}

function PasswordCard({ user }) {
  const f = useForm(EMPTY_PASSWORDS)
  const [pending, setPending] = useState(false)
  const filled = f.form.current && f.form.next && f.form.next2
  const set = (key) => (e) => {
    f.set(key)(e)
    setPending(false)
  }

  const submit = (e) => {
    e.preventDefault()
    const errors = validatePasswords(f.form)
    const first = PASSWORD_ORDER.find((k) => errors[k])
    if (first) {
      f.setErrors(errors)
      setPending(false)
      document.getElementById(`acc-pass-${first}`)?.focus()
      return
    }
    // TODO(şifre değiştirme): sunucuda uç açılınca isteği burada at (mevcut + yeni şifre); başarıda
    // "Şifren değişti." (Saved), yanlış mevcut şifrede errors.current.
    f.setForm(EMPTY_PASSWORDS)
    f.setErrors({})
    setPending(true)
  }

  return (
    <section className="site-card account__card" aria-labelledby="sifreBaslik">
      <h2 id="sifreBaslik">{LOGIN_COPY.passwordTitle}</h2>
      <form className="auth__form" onSubmit={submit} noValidate aria-labelledby="sifreBaslik">
        {/* parola yöneticisi hangi hesabın şifresi olduğunu bilsin */}
        <input type="text" name="username" autoComplete="username" value={user.email} readOnly hidden />
        <Field id="acc-pass-current" label={LOGIN_COPY.current} error={f.errors.current}>
          <PasswordInput
            id="acc-pass-current"
            value={f.form.current}
            onChange={set('current')}
            autoComplete="current-password"
            invalid={!!f.errors.current}
            describedBy={f.errors.current ? 'acc-pass-current-err' : undefined}
          />
        </Field>
        <Field id="acc-pass-next" label={LOGIN_COPY.next} error={f.errors.next}>
          <PasswordInput
            id="acc-pass-next"
            value={f.form.next}
            onChange={set('next')}
            autoComplete="new-password"
            placeholder="En az 8 karakter"
            invalid={!!f.errors.next}
            describedBy={f.errors.next ? 'acc-pass-next-err' : undefined}
          />
          <PasswordRules value={f.form.next} />
        </Field>
        <Field id="acc-pass-next2" label={LOGIN_COPY.next2} error={f.errors.next2}>
          <PasswordInput
            id="acc-pass-next2"
            value={f.form.next2}
            onChange={set('next2')}
            autoComplete="new-password"
            invalid={!!f.errors.next2}
            describedBy={f.errors.next2 ? 'acc-pass-next2-err' : undefined}
          />
        </Field>
        <p className="form-note form-note--inline" role="status" hidden={!pending}>
          {pending && LOGIN_COPY.pending}
        </p>
        <div className="account__actions">
          <button type="submit" className="site-btn site-btn--primary" disabled={!filled}>
            {LOGIN_COPY.submit}
          </button>
        </div>
      </form>
    </section>
  )
}
