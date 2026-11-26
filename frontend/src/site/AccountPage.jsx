import { useState } from 'react'
import { exportAccountData, updateProfile } from './auth'
import { Field } from './AuthPages'

// Hesap: header'daki kullanıcı adına tıklayınca açılır. Bugün yalnızca görünen ad değişir. Sunucuda
// henüz ucu olmayan işlemler (e-posta, şifre, hesabı silme) form göstermez: durum sessiz bir notla
// yerinde söylenir, kullanıcı şifresini boşuna yazmaz.
const ACCOUNT_COPY = {
  title: 'Hesap ayarları',
  lead: 'Görünen adını buradan değiştirebilir, verilerini indirebilirsin.',
}

export default function AccountPage({ user, onUserChange, isDark, onToggleMode, onLogout }) {
  return (
    <div className="account">
      <div className="page-head">
        <h1>{ACCOUNT_COPY.title}</h1>
        <p className="site-muted">{ACCOUNT_COPY.lead}</p>
      </div>
      <div className="account__grid">
        {/* geniş ekranda iki sütun: Profil | Giriş bilgileri, altında Verilerin | Görünüm ve oturum */}
        <ProfileCard user={user} onUserChange={onUserChange} />
        <LoginCard user={user} />
        <DataCard user={user} />
        <SessionCard isDark={isDark} onToggleMode={onToggleMode} onLogout={onLogout} />
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
  title: 'Profil',
  displayName: 'Görünen ad',
  displayNameHint: 'Sayfanda ve avatarının adında böyle görünür.',
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
        <Field id="acc-displayName" label={PROFILE_COPY.displayName} error={f.errors.displayName} hint={PROFILE_COPY.displayNameHint}>
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

// Giriş bilgileri: e-posta okunur; değiştirme ve şifre ucu sunucuda henüz yok, form gösterilmez.
const LOGIN_COPY = {
  title: 'Giriş bilgileri',
  email: 'E-posta',
  password: 'Şifre',
  passwordValue: 'Giriş yaparken kullandığın şifre',
  notYet: 'E-postanı ya da şifreni değiştirmek henüz mümkün değil.',
}

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
      <div className="empty-note">
        <p>{LOGIN_COPY.notYet}</p>
      </div>
    </section>
  )
}

// Verilerin: indir ve hesabı sil. Metinler tam cümle; çeviride birleştirilmez.
const DATA_COPY = {
  title: 'Verilerin',
  lead: 'Hesabın ve kayıtların yalnızca bu tarayıcıda tutuluyor. İstediğin an indirebilir ya da silebilirsin.',
  download: 'Verilerimi indir',
  downloaded: 'Dosya indirildi.',
  fileName: (username) => `samedesk-${username}.json`,
  // hesabı silme ucu sunucuda henüz yok: onay formu yerine durum
  deleteNotYet: 'Hesabını buradan silmek henüz mümkün değil.',
}

function DataCard({ user }) {
  const [saved, setSaved] = useState('')

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
      <div className="empty-note">
        <p>{DATA_COPY.deleteNotYet}</p>
      </div>
    </section>
  )
}
