// Ad alanının altındaki not ve karakter sayacı; durum nameRules.js'deki nameStatus'tan gelir.
// Not canlı bölgede (eşik geçilince ya da hata değişince duyurulur); sayaç her tuşta okunmasın diye
// ekran okuyucudan gizli, adı ise alanın aria-describedby'ı ile not birlikte okunur.
export default function NameHint({ id, status, max, className = '' }) {
  return (
    <div className={`name-hint ${className}`} data-tone={status.tone}>
      <span id={id} className="name-hint__msg" role="status">
        {status.message}
      </span>
      <span className="name-hint__count" aria-hidden="true">
        {status.n}/{max}
      </span>
    </div>
  )
}
