import { useEffect, useId, useRef, useState } from 'react'
import { DAILY_OPTIONS, GOAL_LIMITS, WEEKLY_OPTIONS, goalPercent } from './goals'
import { formatMinutes } from './usePomodoro'

const COPY = {
  today: 'Bugün',
  week: 'Bu hafta',
  ringLabel: (what, pct) => `${what}: hedefin yüzde ${pct}'i`,
  edit: 'Hedefleri düzenle',
  title: 'Hedeflerin',
  daily: 'Günlük hedef',
  weekly: 'Haftalık hedef',
  custom: 'Özel',
  hours: 'saat',
  customDaily: 'Özel günlük hedef, saat',
  customWeekly: 'Özel haftalık hedef, saat',
  range: (min, max) => `${min} ile ${max} arasında bir süre yaz.`,
  tip: (daily, week) => `Günde ${daily}, haftada 5 gün çalışırsan ${week} eder. Hedeflerin Sayfam'da da görünür.`,
  cancel: 'Vazgeç',
  save: 'Kaydet',
  close: 'Kapat',
}

// "2:35" (saat:dakika) — küçük kartta dar yer
const clockOf = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

function MiniRing({ pct, tone, label }) {
  const r = 18
  const len = 2 * Math.PI * r
  const filled = Math.min(1, pct / 100) * len
  return (
    <svg className="goal-mini__ring" data-tone={tone} width="44" height="44" viewBox="0 0 44 44" role="img" aria-label={label}>
      <circle className="goal-mini__track" cx="22" cy="22" r={r} />
      {filled > 0 && <circle className="goal-mini__fill" cx="22" cy="22" r={r} strokeDasharray={`${filled} ${len}`} transform="rotate(-90 22 22)" />}
    </svg>
  )
}

/** Paneldeki iki küçük hedef kartı (bugün / bu hafta) ve "Hedefleri düzenle". */
export function GoalSummary({ today, week, goals, onEdit }) {
  const dayPct = goalPercent(today, goals.daily)
  const weekPct = goalPercent(week, goals.weekly)
  return (
    <section className="goal-summary" aria-label={COPY.title}>
      <div className="goal-summary__cards">
        <div className="goal-mini">
          <MiniRing pct={dayPct} tone="day" label={COPY.ringLabel(COPY.today, dayPct)} />
          <span className="goal-mini__text">
            <span className="goal-mini__label">
              {COPY.today} · %{dayPct}
            </span>
            <span className="goal-mini__value">
              {clockOf(today)} / {formatMinutes(goals.daily)}
            </span>
          </span>
        </div>
        <div className="goal-mini">
          <MiniRing pct={weekPct} tone="week" label={COPY.ringLabel(COPY.week, weekPct)} />
          <span className="goal-mini__text">
            <span className="goal-mini__label">
              {COPY.week} · %{weekPct}
            </span>
            <span className="goal-mini__value">
              {clockOf(week)} / {formatMinutes(goals.weekly)}
            </span>
          </span>
        </div>
      </div>
      <button type="button" className="link-btn goal-summary__edit" onClick={onEdit} aria-haspopup="dialog">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
        </svg>
        {COPY.edit}
      </button>
    </section>
  )
}

// Seçeneklerden biri ya da "Özel" (saat yazılır). Özel değer saat olarak tutulur, kaydederken dakikaya döner.
function GoalField({ legend, options, value, onChange, custom, onCustom, step, limits, customLabel, error }) {
  const id = useId()
  const isCustom = custom !== null
  return (
    <fieldset className="goal-field">
      <legend className="goal-field__legend">{legend}</legend>
      <div className="goal-field__opts">
        {options.map((m) => (
          <button key={m} type="button" className="goal-opt" aria-pressed={!isCustom && value === m} onClick={() => onChange(m)}>
            {formatMinutes(m)}
          </button>
        ))}
        <button type="button" className="goal-opt" aria-pressed={isCustom} onClick={() => onCustom(String(value / 60))}>
          {COPY.custom}
        </button>
      </div>
      {isCustom && (
        <span className="goal-field__custom">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={limits[0] / 60}
            max={limits[1] / 60}
            step={step}
            value={custom}
            onChange={(e) => onCustom(e.target.value)}
            aria-label={customLabel}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : undefined}
          />
          <span aria-hidden="true">{COPY.hours}</span>
        </span>
      )}
      {error && (
        <span id={`${id}-err`} className="form-error">
          {error}
        </span>
      )}
    </fieldset>
  )
}

const parseHours = (text) => Math.round(parseFloat(String(text).replace(',', '.')) * 60)

function GoalForm({ goals, onSave, onClose }) {
  const [daily, setDaily] = useState(goals.daily)
  const [weekly, setWeekly] = useState(goals.weekly)
  // Özel alan açıkken yazılan metin (saat); kapalıyken null. Kayıtlı değer hazır seçeneklerde yoksa açık başlar.
  const [dailyCustom, setDailyCustom] = useState(DAILY_OPTIONS.includes(goals.daily) ? null : String(goals.daily / 60))
  const [weeklyCustom, setWeeklyCustom] = useState(WEEKLY_OPTIONS.includes(goals.weekly) ? null : String(goals.weekly / 60))
  const [errors, setErrors] = useState({})

  const resolve = (custom, fallback, limits) => {
    if (custom === null) return { value: fallback }
    const v = parseHours(custom)
    if (!Number.isFinite(v) || v < limits[0] || v > limits[1]) return { error: COPY.range(formatMinutes(limits[0]), formatMinutes(limits[1])) }
    return { value: v }
  }

  const submit = (e) => {
    e.preventDefault()
    const d = resolve(dailyCustom, daily, GOAL_LIMITS.daily)
    const w = resolve(weeklyCustom, weekly, GOAL_LIMITS.weekly)
    if (d.error || w.error) {
      setErrors({ daily: d.error, weekly: w.error })
      return
    }
    onSave({ daily: d.value, weekly: w.value })
    onClose()
  }

  const tipDaily = resolve(dailyCustom, daily, GOAL_LIMITS.daily).value ?? daily

  return (
    <form className="goal-dialog__panel" method="dialog" onSubmit={submit} noValidate>
      <div className="goal-dialog__head">
        <h2 id="goalDialogTitle">{COPY.title}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label={COPY.close}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <GoalField
        legend={COPY.daily}
        options={DAILY_OPTIONS}
        value={daily}
        onChange={(m) => {
          setDaily(m)
          setDailyCustom(null)
          setErrors((er) => ({ ...er, daily: undefined }))
        }}
        custom={dailyCustom}
        onCustom={(t) => {
          setDailyCustom(t)
          setErrors((er) => ({ ...er, daily: undefined }))
        }}
        step="0.5"
        limits={GOAL_LIMITS.daily}
        customLabel={COPY.customDaily}
        error={errors.daily}
      />
      <GoalField
        legend={COPY.weekly}
        options={WEEKLY_OPTIONS}
        value={weekly}
        onChange={(m) => {
          setWeekly(m)
          setWeeklyCustom(null)
          setErrors((er) => ({ ...er, weekly: undefined }))
        }}
        custom={weeklyCustom}
        onCustom={(t) => {
          setWeeklyCustom(t)
          setErrors((er) => ({ ...er, weekly: undefined }))
        }}
        step="1"
        limits={GOAL_LIMITS.weekly}
        customLabel={COPY.customWeekly}
        error={errors.weekly}
      />
      <p className="goal-dialog__tip">{COPY.tip(formatMinutes(tipDaily), formatMinutes(tipDaily * 5))}</p>
      <div className="goal-dialog__foot">
        <button type="button" className="site-btn" onClick={onClose}>
          {COPY.cancel}
        </button>
        <button type="submit" className="site-btn site-btn--primary">
          {COPY.save}
        </button>
      </div>
    </form>
  )
}

/** Hedef penceresi: open iken modal açılır; Esc, Vazgeç ya da arka plana tıklama kapatır. */
export function GoalDialog({ open, goals, onSave, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="goal-dialog"
      aria-labelledby="goalDialogTitle"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* her açılışta taslak kayıtlı hedeflerden yeniden başlar */}
      {open && <GoalForm goals={goals} onSave={onSave} onClose={onClose} />}
    </dialog>
  )
}
