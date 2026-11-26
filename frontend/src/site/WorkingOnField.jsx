import { useEffect, useId, useRef, useState } from 'react'
import useWorkingOn, { WORKING_ON_MAX } from './workingOn'

// Metinler: sayılar ayrı değişken, çeviride sıra değişebilir.
const WORKING_COPY = {
  add: 'Ne üzerinde çalışıyorsun?',
  label: 'Üzerinde çalıştığın',
  field: 'Ne üzerinde çalışıyorsun?',
  placeholder: 'Örn. sunum taslağı',
  count: (n, max) => `${n}/${max}`,
  save: 'Kaydet',
  cancel: 'Vazgeç',
  edit: 'Düzenle',
  remove: 'Sil',
  saved: 'Kaydedildi.',
  removed: 'Silindi.',
}

/**
 * "Ne üzerinde çalışıyorum" satırı (lobi başı ve oda paneli). İsteğe bağlı: boşken sessiz bir düğme,
 * yazılmışsa metin + Düzenle / Sil. Düzenlerken Enter kaydeder, Esc vazgeçer; odak açan düğmeye döner.
 */
export default function WorkingOnField({ username, className = '' }) {
  const [text, save] = useWorkingOn(username)
  // null: düzenlenmiyor
  const [draft, setDraft] = useState(null)
  const [said, setSaid] = useState('')
  const inputId = useId()
  const countId = useId()
  const backRef = useRef(null)
  const refocus = useRef(false)
  useEffect(() => {
    if (draft !== null || !refocus.current) return
    refocus.current = false
    backRef.current?.focus()
  }, [draft, text])

  const close = () => {
    refocus.current = true
    setDraft(null)
  }
  const submit = (e) => {
    e.preventDefault()
    save(draft)
    setSaid(draft.trim() ? WORKING_COPY.saved : WORKING_COPY.removed)
    close()
  }
  const remove = () => {
    save('')
    setSaid(WORKING_COPY.removed)
    refocus.current = true
  }

  let body
  if (draft !== null) {
    body = (
      <form className="working-on__form" onSubmit={submit}>
        <label className="sr-only" htmlFor={inputId}>
          {WORKING_COPY.field}
        </label>
        <input
          id={inputId}
          className="working-on__input"
          type="text"
          value={draft}
          maxLength={WORKING_ON_MAX}
          placeholder={WORKING_COPY.placeholder}
          aria-describedby={countId}
          autoComplete="off"
          // kullanıcı açtı: odak doğrudan alana
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return
            // odak modundan çıkış gibi sayfa kısayolları tetiklenmesin
            e.stopPropagation()
            close()
          }}
        />
        <span id={countId} className="working-on__count">
          {WORKING_COPY.count(draft.length, WORKING_ON_MAX)}
        </span>
        <span className="working-on__actions">
          <button type="submit" className="site-btn site-btn--small site-btn--primary">
            {WORKING_COPY.save}
          </button>
          <button type="button" className="link-btn" onClick={close}>
            {WORKING_COPY.cancel}
          </button>
        </span>
      </form>
    )
  } else if (text) {
    body = (
      <div className="working-on__row">
        <p className="working-on__head">
          <span className="working-on__label">{WORKING_COPY.label}</span>
          <span className="working-on__actions">
            <button ref={backRef} type="button" className="link-btn" onClick={() => setDraft(text)}>
              {WORKING_COPY.edit}
            </button>
            <button type="button" className="link-btn" onClick={remove}>
              {WORKING_COPY.remove}
            </button>
          </span>
        </p>
        <p className="working-on__text">{text}</p>
      </div>
    )
  } else {
    body = (
      <button ref={backRef} type="button" className="working-on__add" onClick={() => setDraft('')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {WORKING_COPY.add}
      </button>
    )
  }

  return (
    <div className={`working-on ${className}`}>
      {body}
      <span className="sr-only" role="status">
        {said}
      </span>
    </div>
  )
}
