import { useEffect, useRef } from 'react'
import Icon from './AvatarIcons'

const COPY = {
  title: 'Avatarın kaydedilmedi',
  body: 'Kaydetmeden çıkarsan değişiklikler kaydedilmeyecek ve avatarın son kaydettiğin hâline döner.',
  stay: 'Vazgeç',
  discard: 'Kaydetmeden çık',
  save: 'Kaydet ve çık',
  saving: 'Kaydediliyor…',
}

/**
 * Avatar sayfasından kaydetmeden çıkarken sorulan pencere. open: gösterilsin mi. saving / error:
 * "Kaydet ve çık" sürüyor mu, hata metni. onStay: sayfada kal (Esc, dışarı tıklama da). onDiscard:
 * değişiklikleri at ve çık. onSave: kaydet, başarılıysa çık.
 */
export default function UnsavedAvatarDialog({ open, saving, error, onStay, onDiscard, onSave }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="code-dialog unsaved-dialog"
      aria-labelledby="unsavedTitle"
      aria-describedby="unsavedBody"
      onCancel={(e) => {
        e.preventDefault()
        if (!saving) onStay()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onStay()
      }}
    >
      {open && (
        <div className="code-dialog__panel">
          <span className="code-dialog__icon unsaved-dialog__icon" aria-hidden="true">
            <Icon name="save" size={22} />
          </span>
          <h2 id="unsavedTitle">{COPY.title}</h2>
          <p id="unsavedBody" className="site-muted">
            {COPY.body}
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="code-dialog__foot unsaved-dialog__foot">
            <button type="button" className="site-btn" onClick={onStay} disabled={saving}>
              {COPY.stay}
            </button>
            <button type="button" className="site-btn unsaved-dialog__discard" onClick={onDiscard} disabled={saving}>
              {COPY.discard}
            </button>
            <button type="button" className="site-btn site-btn--primary" onClick={onSave} disabled={saving} aria-busy={saving || undefined} autoFocus>
              {saving ? COPY.saving : COPY.save}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
