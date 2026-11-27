import { useEffect, useRef, useState } from 'react'
import Dotted from './Dotted'
import { MAX_JOINED_ROOMS, MAX_OWNED_ROOMS } from './roomStore'

// Davet kodu penceresinin kabuğunu (code-dialog) kullanan iki pencere: oda silme / ayrılma onayı ve oda
// sınırına gelince hangi odanın silineceğini ya da hangisinden ayrılınacağını seçtiren pencere.

function useModal(open) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return ref
}

const CONFIRM_COPY = {
  deleteTitle: 'Oda silinsin mi?',
  deleteBody: (name) => `“${name}” kalıcı olarak silinir. İçeride olanlar Lobi’ye döner. Bu geri alınamaz.`,
  deleteYes: 'Odayı sil',
  leaveTitle: 'Odadan ayrılınsın mı?',
  leaveBody: (name) => `“${name}” odasının üyeliğinden çıkarsın. Yeniden girmek için davet kodu gerekir.`,
  leaveYes: 'Ayrıl',
  cancel: 'Vazgeç',
  busy: 'Bekle…',
}

/**
 * Oda silme ya da ayrılma onayı. ask: { kind: 'delete' | 'leave', room } | null. onConfirm: Promise döner;
 * hata metniyle reddedilirse pencerede gösterilir.
 */
export function RoomConfirmDialog({ ask, onClose, onConfirm }) {
  const ref = useModal(!!ask)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const close = () => {
    if (busy) return
    setError('')
    onClose()
  }
  const yes = async () => {
    setBusy(true)
    setError('')
    const problem = await onConfirm(ask)
    setBusy(false)
    if (problem) setError(problem)
    else onClose()
  }
  const del = ask?.kind === 'delete'
  return (
    <dialog
      ref={ref}
      className="code-dialog room-confirm"
      aria-labelledby="roomConfirmTitle"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      {ask && (
        <div className="code-dialog__panel">
          <h2 id="roomConfirmTitle">{del ? CONFIRM_COPY.deleteTitle : CONFIRM_COPY.leaveTitle}</h2>
          <p className="site-muted">{del ? CONFIRM_COPY.deleteBody(ask.room.name) : CONFIRM_COPY.leaveBody(ask.room.name)}</p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="code-dialog__foot">
            <button type="button" className="site-btn" onClick={close} disabled={busy}>
              {CONFIRM_COPY.cancel}
            </button>
            <button type="button" className="site-btn site-btn--primary room-confirm__yes" onClick={yes} disabled={busy} autoFocus>
              {busy ? CONFIRM_COPY.busy : del ? CONFIRM_COPY.deleteYes : CONFIRM_COPY.leaveYes}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}

const LIMIT_COPY = {
  ownedTitle: 'Oda sınırına geldin',
  ownedBody: `En fazla ${MAX_OWNED_ROOMS} oda kurabilirsin. Yeni oda için kurduğun odalardan birini sil.`,
  joinedTitle: 'Davetli oda sınırına geldin',
  joinedBody: `Başkalarının en fazla ${MAX_JOINED_ROOMS} davetli odasında olabilirsin. Yenisine katılmak için birinden ayrıl.`,
  delete: 'Sil',
  leave: 'Ayrıl',
  invite: 'Davetli',
  open: 'Herkese açık',
  close: 'Kapat',
  done: 'Yer açıldı. Şimdi tekrar deneyebilirsin.',
}

/**
 * Sınır penceresi. limit: { kind: 'owned' | 'joined', rooms } | null. rooms: silinebilecek (kurduğun) ya da
 * ayrılınabilecek (üyesi olduğun) odalar. onRemove(room): Promise<hata metni | null>.
 */
export function RoomLimitDialog({ limit, onClose, onRemove }) {
  const ref = useModal(!!limit)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [freed, setFreed] = useState(false)
  const close = () => {
    if (busyId) return
    setError('')
    setFreed(false)
    onClose()
  }
  const remove = async (room) => {
    setBusyId(room.id)
    setError('')
    const problem = await onRemove(room)
    setBusyId(null)
    if (problem) setError(problem)
    else setFreed(true)
  }
  const owned = limit?.kind === 'owned'
  return (
    <dialog
      ref={ref}
      className="code-dialog room-limit"
      aria-labelledby="roomLimitTitle"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      {limit && (
        <div className="code-dialog__panel">
          <h2 id="roomLimitTitle">{owned ? LIMIT_COPY.ownedTitle : LIMIT_COPY.joinedTitle}</h2>
          <p className="site-muted">{owned ? LIMIT_COPY.ownedBody : LIMIT_COPY.joinedBody}</p>
          <ul className="room-limit__list">
            {limit.rooms.map((room) => (
              <li key={room.id} className="room-limit__item">
                <span className="room-limit__name">
                  <Dotted text={room.name} />
                  <span className="room-limit__meta">{room.access === 'invite' ? LIMIT_COPY.invite : LIMIT_COPY.open}</span>
                </span>
                <button type="button" className="site-btn site-btn--small room-limit__remove" onClick={() => remove(room)} disabled={!!busyId}>
                  {busyId === room.id ? '…' : owned ? LIMIT_COPY.delete : LIMIT_COPY.leave}
                </button>
              </li>
            ))}
          </ul>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {freed && (
            <p className="room-limit__done" role="status">
              {LIMIT_COPY.done}
            </p>
          )}
          <div className="code-dialog__foot">
            <button type="button" className="site-btn" onClick={close} disabled={!!busyId}>
              {LIMIT_COPY.close}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
