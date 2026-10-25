import { useEffect, useState } from 'react'
import './Accountmodals.css'

const peso = (n) => '₱' + Number(n).toLocaleString('en-PH')

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

const daysBetween = (a, b) =>
  Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000))

// The day after a YYYY-MM-DD date, as YYYY-MM-DD
const nextDay = (d) => {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + 1)
  return x.toISOString().slice(0, 10)
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="am-backdrop" onClick={onClose}>
      <div
        className="am-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="am-close" onClick={onClose} aria-label="Close">×</button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

/* ---------------- PAYMENT ---------------- */
export function PaymentModal({ booking, vehicle, amount, onPay, onClose }) {
  const [method, setMethod] = useState('GCash')

  return (
    <Modal title="Pay for your booking" onClose={onClose}>
      <div className="am-summary">
        <div><span>{vehicle.brand} {vehicle.model}</span><span>{booking.id}</span></div>
        <div><span>{fmtDate(booking.start)} → {fmtDate(booking.end)}</span></div>
        <div className="total"><span>Amount to pay</span><span>{peso(amount)}</span></div>
      </div>

      <p className="am-label">Payment method</p>
      <div className="am-methods">
        {['GCash', 'Maya', 'Credit/debit card'].map((m) => (
          <label key={m} className={method === m ? 'on' : ''}>
            <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} />
            {m}
          </label>
        ))}
      </div>

      <p className="am-note">
        You'll be sent to PayMongo's secure page to finish paying. BHLRRide never sees your card or wallet details.
      </p>

      <div className="am-actions">
        <button className="ac-btn" onClick={() => onPay(method)}>Pay {peso(amount)}</button>
        <button className="ac-btn ghost" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  )
}

/* ---------------- RECEIPT ---------------- */
export function ReceiptModal({ payment, booking, vehicle, onClose }) {
  const days = daysBetween(booking.start, booking.end)

  return (
    <Modal title="Digital receipt" onClose={onClose}>
      <div className="am-receipt">
        <div className="am-receipt-head">
          <strong>BHLRRide</strong>
          <span>{payment.receiptNumber}</span>
        </div>
        <dl>
          <dt>Date paid</dt><dd>{new Date(payment.date).toLocaleString('en-PH')}</dd>
          <dt>Booking</dt><dd>{booking.id}</dd>
          <dt>Vehicle</dt><dd>{vehicle.brand} {vehicle.model}</dd>
          <dt>Shop</dt><dd>{vehicle.shop} · {vehicle.branch}</dd>
          <dt>Rental dates</dt><dd>{fmtDate(booking.start)} → {fmtDate(booking.end)}</dd>
          <dt>Rate</dt><dd>{peso(vehicle.rate)} × {days} {days === 1 ? 'day' : 'days'}</dd>
          <dt>Method</dt><dd>{payment.method}</dd>
          <dt>Type</dt><dd>{payment.type}</dd>
          <dt>Status</dt><dd>{payment.status}</dd>
        </dl>
        <div className="am-receipt-total">
          <span>Amount paid</span>
          <strong>{peso(payment.amount)}</strong>
        </div>
      </div>

      <div className="am-actions">
        <button className="ac-btn" onClick={() => window.print()}>Print receipt</button>
        <button className="ac-btn ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  )
}

/* ---------------- REVIEW ---------------- */
export function ReviewModal({ booking, vehicle, onSubmit, onClose }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (rating < 1) return setError('Please choose a rating from 1 to 5 stars.')
    if (!comment.trim()) return setError('Please write a short comment.')
    onSubmit(rating, comment.trim())
  }

  return (
    <Modal title="Rate your ride" onClose={onClose}>
      <p className="am-sub">{vehicle.brand} {vehicle.model} · {booking.id}</p>
      <form onSubmit={submit} noValidate>
        {error && <div className="am-error" role="alert">{error}</div>}

        <div className="am-stars" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className={n <= rating ? 'on' : ''}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>

        <label className="am-field">
          Comment
          <textarea
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the vehicle and the service?"
          />
        </label>

        <div className="am-actions">
          <button className="ac-btn" type="submit">Submit review</button>
          <button className="ac-btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

/* ---------------- EXTEND ---------------- */
export function ExtendModal({ booking, vehicle, bookings, onSubmit, onClose }) {
  const [newEnd, setNewEnd] = useState('')
  const [error, setError] = useState('')

  const valid = Boolean(newEnd && newEnd > booking.end)
  const extraDays = valid ? daysBetween(booking.end, newEnd) : 0
  const extra = extraDays * vehicle.rate

  // Another active booking of this vehicle that overlaps the extra days
  const clash =
    valid &&
    bookings.some(
      (b) =>
        b.id !== booking.id &&
        b.vehicleId === booking.vehicleId &&
        (b.status === 'Pending' || b.status === 'Approved') &&
        b.start <= newEnd &&
        b.end >= booking.end,
    )

  const submit = (e) => {
    e.preventDefault()
    if (!newEnd) return setError('Please choose a new return date.')
    if (newEnd <= booking.end) return setError('The new return date must be after your current return date.')
    if (clash) return setError('This ride is already booked for some of those extra days.')
    onSubmit(newEnd, extra)
  }

  return (
    <Modal title="Extend your rental" onClose={onClose}>
      <p className="am-sub">
        {vehicle.brand} {vehicle.model} · currently returns on {fmtDate(booking.end)}
      </p>
      <form onSubmit={submit} noValidate>
        {error && <div className="am-error" role="alert">{error}</div>}

        <label className="am-field">
          New return date
          <input
            type="date"
            min={nextDay(booking.end)}
            value={newEnd}
            onChange={(e) => setNewEnd(e.target.value)}
          />
        </label>

        {valid && (
          <div className="am-summary">
            <div>
              <span>{peso(vehicle.rate)} × {extraDays} extra {extraDays === 1 ? 'day' : 'days'}</span>
              <span>{peso(extra)}</span>
            </div>
            {clash && <p className="am-warn">Not available for those extra days.</p>}
          </div>
        )}

        <p className="am-note">The shop has to approve your extension request.</p>

        <div className="am-actions">
          <button className="ac-btn" type="submit">Request extension</button>
          <button className="ac-btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}