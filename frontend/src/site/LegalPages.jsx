import { useEffect, useRef } from 'react'
import { LEGAL_DOCS, LEGAL_UPDATED } from './legalText'

function LegalBody({ doc, headingId }) {
  return (
    <>
      <div className="legal__head">
        <span className="eyebrow">Son güncelleme: {LEGAL_UPDATED}</span>
        <h1 id={headingId}>{doc.title}</h1>
        <p className="legal__intro">{doc.intro}</p>
      </div>
      {doc.sections.map((s, i) => (
        <section key={s.heading} className="legal__section">
          <h2>
            {i + 1}. {s.heading}
          </h2>
          {s.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
    </>
  )
}

// Ayrı sayfa (#kosullar, #gizlilik): footer'dan açılır.
export function LegalPage({ kind, onGo }) {
  const doc = LEGAL_DOCS[kind]
  const other = kind === 'kosullar' ? 'gizlilik' : 'kosullar'
  return (
    <article className="site-card legal" aria-labelledby="legalTitle">
      <LegalBody doc={doc} headingId="legalTitle" />
      <p className="legal__other">
        <button type="button" className="link-btn link-btn--strong" onClick={() => onGo(other)}>
          {LEGAL_DOCS[other].title} →
        </button>
      </p>
    </article>
  )
}

// Kayıt formunun üstünde açılan pencere: form kapanmaz, yazılanlar kaybolmaz. Esc ya da Kapat ile
// kapanır; "Okudum, kabul ediyorum" onay kutusunu da işaretler.
export function LegalDialog({ kind, onClose, onAccept }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (kind && !dialog.open) dialog.showModal()
    if (!kind && dialog.open) dialog.close()
  }, [kind])

  const doc = kind ? LEGAL_DOCS[kind] : null

  return (
    <dialog
      ref={ref}
      className="legal-dialog"
      aria-labelledby="legalDialogTitle"
      onClose={onClose}
      onClick={(e) => {
        // pencerenin dışına (arka plana) tıklayınca kapanır
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {doc && (
        <div className="legal-dialog__panel">
          <div className="legal-dialog__scroll">
            <LegalBody doc={doc} headingId="legalDialogTitle" />
          </div>
          <div className="legal-dialog__foot">
            <button type="button" className="site-btn" onClick={onClose}>
              Kapat
            </button>
            <button
              type="button"
              className="site-btn site-btn--primary"
              onClick={() => {
                onAccept()
                onClose()
              }}
            >
              Okudum, kabul ediyorum
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
