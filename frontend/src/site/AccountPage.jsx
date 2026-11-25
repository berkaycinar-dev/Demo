import { useState } from 'react'
import { changeEmail, changePassword, deleteAccount, exportAccountData, updateProfile } from './auth'
import { Field, PasswordInput, PasswordRules } from './AuthPages'

// Hesap: header'daki kullanıcı adına tıklayınca açılır. Görünen ad / kullanıcı adı, e-posta ve
// şifre ayrı kartlarda değiştirilir. E-posta ve şifre için mevcut şifre istenir.
export default function AccountPage({ user, onUserChange, isDark, onToggleMode, onLogout, onDeleted }) {
  return (
    <div className="account">
      <div className="page-head">
        <h1>Hesap ayarları</h1>
        <p className="site-muted">Kullanıcı adını, e-postanı ve şifreni buradan değiştirebilirsin.</p>
      </div>
      <div className="account__grid">
        <ProfileCard user={user} onUserChange={onUserChange} />
        <EmailCard user={user} onUserChange={onUserChange} />
        {/* geniş ekranda: Profil | E-posta, altında Görünüm ve oturum | Şifre (sıra okuma sırasıyla aynı) */}
        <SessionCard isDark={isDark} onToggleMode={onToggleMode} onLogout={onLogout} />
        <PasswordCard user={user} />
        <DataCard user={user} onDeleted={onDeleted} />
      </div>
    </div>
  )
}

// Görünüm ve oturum: telefonda üst menüde yer olmadığı için koyu mod ve çıkış burada da durur.
function SessionCard({ isDark, onToggleMode, onLogout }) {
  return (
    <section className="site-card account__card" aria-labelledby="oturumBaslik">
      <h2 id="oturumBaslik">Görünüm ve oturum</h2>
      <div className="site-actions">
        <button type="button" className="site-btn" onClick={onToggleMode}>
          {isDark ? 'Açık moda geç' : 'Koyu moda geç'}
        </button>
        <button type="button" className="site-btn account__logout" onClick={onLogout}>
          Çıkış yap
        </button>
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
  noChange: 'Değişiklik yok. Bir alanı düzenleyince Kaydet açılır.',
}

function ProfileCard({ user, onUserChange }) {
  const f = useForm({ displayName: user.displayName, username: user.username })
  const changed = f.form.displayName.trim() !== user.displayName || f.form.username !== user.username

  const submit = (e) => {
    e.preventDefault()
    const res = updateProfile(user.username, f.form)
    if (res.error) {
      f.setErrors(res.error)
      return
    }
    onUserChange(res.user)
    f.setSaved('Profil bilgilerin kaydedildi.')
  }

  return (
    <section className="site-card account__card" aria-labelledby="profilBaslik">
      <h2 id="profilBaslik">Profil</h2>
      <form className="auth__form" onSubmit={submit} noValidate>
        <Field id="acc-displayName" label="Görünen ad" error={f.errors.displayName} hint="Sayfanda ve odalarda böyle görünürsün.">
          <input {...inputProps('acc-displayName', f.errors, 'displayName')} value={f.form.displayName} onChange={f.set('displayName')} autoComplete="name" maxLength={40} />
        </Field>
        <Field id="acc-username" label="Kullanıcı adı" error={f.errors.username} hint="Küçük harf, rakam, nokta ve alt çizgi. Girişte kullanılır.">
          <span className="prefixed">
            <span aria-hidden="true">@</span>
            <input
              {...inputProps('acc-username', f.errors, 'username')}
              value={f.form.username}
              onChange={f.set('username', (v) => v.toLowerCase())}
              autoComplete="username"
              maxLength={20}
              spellCheck={false}
            />
          </span>
        </Field>
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

function EmailCard({ user, onUserChange }) {
  const f = useForm({ email: '', password: '' })

  const submit = async (e) => {
    e.preventDefault()
    f.setBusy(true)
    const res = await changeEmail(user.username, f.form)
    f.setBusy(false)
    if (res.error) {
      f.setErrors(res.error)
      return
    }
    onUserChange(res.user)
    f.setForm({ email: '', password: '' })
    f.setSaved('E-postan güncellendi.')
  }

  return (
    <section className="site-card account__card" aria-labelledby="epostaBaslik">
      <h2 id="epostaBaslik">E-posta</h2>
      <p className="account__current">
        Şu anki e-postan <strong>{user.email}</strong>
      </p>
      <form className="auth__form" onSubmit={submit} noValidate>
        <Field id="acc-email" label="Yeni e-posta" error={f.errors.email}>
          <input {...inputProps('acc-email', f.errors, 'email')} type="email" value={f.form.email} onChange={f.set('email')} autoComplete="email" placeholder="ornek@posta.com" />
        </Field>
        <Field id="acc-email-pass" label="Şifren" error={f.errors.password} hint="Değişikliği onaylamak için.">
          <PasswordInput id="acc-email-pass" value={f.form.password} onChange={f.set('password')} autoComplete="current-password" invalid={!!f.errors.password} />
        </Field>
        {f.errors.form && <div className="form-alert" role="alert">{f.errors.form}</div>}
        <div className="account__actions">
          <button type="submit" className="site-btn site-btn--primary" disabled={f.busy || !f.form.email.trim() || !f.form.password}>
            {f.busy ? 'Kaydediliyor…' : 'E-postayı değiştir'}
          </button>
          <Saved text={f.saved} />
        </div>
      </form>
    </section>
  )
}

const EMPTY_PASS = { current: '', next: '', next2: '' }

function PasswordCard({ user }) {
  const f = useForm(EMPTY_PASS)

  const submit = async (e) => {
    e.preventDefault()
    f.setBusy(true)
    const res = await changePassword(user.username, f.form)
    f.setBusy(false)
    if (res.error) {
      f.setErrors(res.error)
      return
    }
    f.setForm(EMPTY_PASS)
    f.setSaved('Şifren değiştirildi.')
  }

  return (
    <section className="site-card account__card" aria-labelledby="sifreBaslik">
      <h2 id="sifreBaslik">Şifre</h2>
      <form className="auth__form" onSubmit={submit} noValidate>
        <Field id="acc-pass-current" label="Mevcut şifre" error={f.errors.current}>
          <PasswordInput id="acc-pass-current" value={f.form.current} onChange={f.set('current')} autoComplete="current-password" invalid={!!f.errors.current} />
        </Field>
        <Field id="acc-pass-next" label="Yeni şifre" error={f.errors.next}>
          <PasswordInput id="acc-pass-next" value={f.form.next} onChange={f.set('next')} autoComplete="new-password" invalid={!!f.errors.next} />
          <PasswordRules value={f.form.next} />
        </Field>
        <Field id="acc-pass-next2" label="Yeni şifre tekrarı" error={f.errors.next2}>
          <PasswordInput id="acc-pass-next2" value={f.form.next2} onChange={f.set('next2')} autoComplete="new-password" invalid={!!f.errors.next2} />
        </Field>
        {f.errors.form && <div className="form-alert" role="alert">{f.errors.form}</div>}
        <div className="account__actions">
          <button type="submit" className="site-btn site-btn--primary" disabled={f.busy || !f.form.current || !f.form.next}>
            {f.busy ? 'Kaydediliyor…' : 'Şifreyi değiştir'}
          </button>
          <Saved text={f.saved} />
        </div>
      </form>
    </section>
  )
}

// Verilerin: indir ve hesabı sil. Metinler tam cümle; çeviride birleştirilmez.
const DATA_COPY = {
  title: 'Verilerin',
  lead: 'Hesabın ve kayıtların yalnızca bu tarayıcıda tutuluyor. İstediğin an indirebilir ya da silebilirsin.',
  download: 'Verilerimi indir',
  downloaded: 'Dosya indirildi.',
  fileName: (username) => `odakhane-${username}.json`,
  delete: 'Hesabımı sil',
  confirmTitle: 'Hesabın kalıcı olarak silinsin mi?',
  confirmText: 'Hesabın, kişisel odan, girdiğin odaların listesi, avatarın ve odak sayın bu tarayıcıdan silinir. Bu geri alınamaz.',
  password: 'Şifren',
  passwordHint: 'Silmeyi onaylamak için.',
  confirm: 'Kalıcı olarak sil',
  busy: 'Siliniyor…',
  cancel: 'Vazgeç',
}

function DataCard({ user, onDeleted }) {
  const [saved, setSaved] = useState('')
  const [asking, setAsking] = useState(false)
  const f = useForm({ password: '' })

  const download = () => {
    const data = exportAccountData(user.username)
    if (!data) return
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = DATA_COPY.fileName(user.username)
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setSaved(DATA_COPY.downloaded)
  }

  // onay açılınca odak şifre alanına gelir
  const ask = () => {
    setAsking(true)
    requestAnimationFrame(() => document.getElementById('acc-del-pass')?.focus())
  }

  const cancel = () => {
    setAsking(false)
    f.setForm({ password: '' })
    f.setErrors({})
  }

  const submit = async (e) => {
    e.preventDefault()
    f.setBusy(true)
    const res = await deleteAccount(user.username, f.form.password)
    f.setBusy(false)
    if (res.error) {
      f.setErrors(res.error)
      return
    }
    onDeleted()
  }

  return (
    <section className="site-card account__card account__data" aria-labelledby="veriBaslik">
      <h2 id="veriBaslik">{DATA_COPY.title}</h2>
      <p className="site-muted account__lead">{DATA_COPY.lead}</p>
      <div className="account__actions">
        <button type="button" className="site-btn" onClick={download}>
          {DATA_COPY.download}
        </button>
        <Saved text={saved} />
      </div>
      {asking ? (
        <form className="auth__form account__confirm" onSubmit={submit} noValidate aria-labelledby="silBaslik">
          <p id="silBaslik" className="account__confirm-title">
            {DATA_COPY.confirmTitle}
          </p>
          <p className="account__confirm-text">{DATA_COPY.confirmText}</p>
          <Field id="acc-del-pass" label={DATA_COPY.password} error={f.errors.password} hint={DATA_COPY.passwordHint}>
            <PasswordInput id="acc-del-pass" value={f.form.password} onChange={f.set('password')} autoComplete="current-password" invalid={!!f.errors.password} />
          </Field>
          {f.errors.form && <div className="form-alert" role="alert">{f.errors.form}</div>}
          <div className="account__actions">
            <button type="submit" className="site-btn account__danger" disabled={f.busy || !f.form.password}>
              {f.busy ? DATA_COPY.busy : DATA_COPY.confirm}
            </button>
            <button type="button" className="link-btn" onClick={cancel}>
              {DATA_COPY.cancel}
            </button>
          </div>
        </form>
      ) : (
        <div className="account__actions">
          <button type="button" className="link-btn account__danger-link" onClick={ask}>
            {DATA_COPY.delete}
          </button>
        </div>
      )}
    </section>
  )
}
