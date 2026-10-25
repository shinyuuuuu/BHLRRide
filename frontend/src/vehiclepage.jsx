import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './auth/auth.js'
import { useVehicles } from './data/vehiclestore.js'
import { useBookings, useAvailability } from './data/bookingstore.js'
import { useVehicleReviews } from './data/reviewstore.js'
import AvailabilityCalendar from './Availabilitycalendar.jsx'
import './vehiclepage.css'

const peso = (n) => '₱' + n.toLocaleString('en-PH')

const pad = (n) => String(n).padStart(2, '0')
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const TODAY = todayStr()

const daysBetween = (a, b) =>
  Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000))

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

function VehiclePage() {
  const { id } = useParams()
  const { vehicles, loading } = useVehicles()
  const vehicle = vehicles.find((v) => v.id === Number(id))
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addBooking } = useBookings()
  const { taken, refresh } = useAvailability(vehicle?.id)


  const { reviews: vehicleReviews } = useVehicleReviews(vehicle?.id)

  const averageRating = vehicleReviews.length
    ? (
        vehicleReviews.reduce((sum, review) => sum + Number(review.rating), 0) /
        vehicleReviews.length
      ).toFixed(1)
    : null


  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const [saving, setSaving] = useState(false)

  if (!vehicle && loading) {
    return (
      <div className="vp">
        <div className="vp-notfound">
          <h1>Loading…</h1>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="vp">
        <div className="vp-notfound">
          <h1>Ride not found</h1>
          <p>We couldn't find that vehicle.</p>
          <Link className="vp-btn" to="/browse">Back to fleet</Link>
        </div>
      </div>
    )
  }

  const validDates = Boolean(start && end && end >= start)
  const days = validDates ? daysBetween(start, end) : 0
  const total = days * vehicle.rate

  // Availability check: any Pending or Approved booking that overlaps these dates
  const clash =
    validDates &&
    taken.some(
      (b) =>
        b.vehicleId === vehicle.id &&
        (b.status === 'Pending' || b.status === 'Approved') &&
        b.start < end &&
        b.end > start,
    )

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    setError('')

    if (!user) {
      navigate('/login', { state: { from: `/vehicles/${vehicle.id}` } })
      return
    }
    if (user.role !== 'customer') return setError('Only customer accounts can book a ride.')
    if (!vehicle.available) return setError('This ride is not available right now.')
    if (!start || !end) return setError('Please choose your pick-up and return dates.')
    if (start < TODAY) return setError('Pick-up date cannot be in the past.')
    if (end < start) return setError('Return date must be on or after the pick-up date.')
    if (clash) return setError('This ride is already booked for some of those dates. Please try other dates.')

    setSaving(true)
    try {
      const booking = await addBooking({
        vehicleId: vehicle.id,
        start,
        end,
        customer: user.firstName + ' ' + user.lastName,
      })
      setDone(booking)
      refresh()
    } catch (err) {
      setError(err.message)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  const specs = [
    ['Type', `${vehicle.kind} · ${vehicle.style}`],
    ['Transmission', vehicle.transmission],
    ['Seats', `${vehicle.seats} seats`],
    ['Fuel', vehicle.fuel],
    ['Rating', `★ ${vehicle.rating}`],
    ['Pick-up branch', vehicle.branch],
  ]

  return (
    <div className="vp">
      <header className="vp-nav">
        <Link className="vp-brand" to="/browse">
          BHLR<span>Ride</span>
        </Link>
        <Link className="vp-back" to="/browse">← Back to fleet</Link>
      </header>

      <div className="vp-body">
        {/* LEFT SIDE: the vehicle!! */}
        <section>
          <div className="vp-photo">
            <span>{vehicle.emoji}</span>
            <img
              src={vehicle.image}
              alt={`${vehicle.brand} ${vehicle.model}`}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            {vehicle.badge && <em className="vp-badge">{vehicle.badge}</em>}
          </div>

          <p className="vp-eyebrow">{vehicle.kind.toUpperCase()} · {vehicle.style.toUpperCase()}</p>
          <h1>{vehicle.brand} {vehicle.model}</h1>
          <p className="vp-where">🏪 {vehicle.shop} &nbsp;·&nbsp; 📍 {vehicle.branch}</p>

          <div className="vp-specs">
            {specs.map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="vp-note">
            <strong>Before you rent</strong>
            <p>
              Your booking is sent to {vehicle.shop} for approval. Upload your driver's license and a
              valid ID in your account so the shop can verify you before pick-up.
            </p>
          </div>


          {/* FOR THE REVIEWS */}
          <div className="vp-reviews">
              <div className="vp-reviews-head">
                <div>
                  <p className="vp-review-eyebrow">CUSTOMER FEEDBACK</p>
                  <h2>Reviews</h2>
                  <p className="vp-review-subtitle">
                    Hear from customers who rented this vehicle.
                  </p>
                </div>

                {vehicleReviews.length > 0 && (
                  <div className="vp-review-overview">
                    <strong>★ {averageRating}</strong>
                    <span>
                      {vehicleReviews.length}{' '}
                      {vehicleReviews.length === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                )}
              </div>

              {vehicleReviews.length === 0 ? (
                <div className="vp-review-empty">
                  <span className="vp-review-empty-star">☆</span>
                  <strong>No reviews yet</strong>
                  <p>Be the first to share your experience with this vehicle.</p>
                </div>
              ) : (
                <div className="vp-review-list">
                  {vehicleReviews.map((review) => (
                    <article className="vp-review-item" key={review.id}>
                      <div className="vp-review-top">
                        <div className="vp-review-avatar">✓</div>

                        <div className="vp-review-author">
                          <strong>{review.customer || 'Verified renter'}</strong>
                          <span>
                            {review.date
                              ? new Date(review.date).toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Date unavailable'}
                          </span>
                        </div>
                      </div>

                      <div
                        className="vp-review-stars"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        {'★'.repeat(Math.max(0, Math.min(5, Number(review.rating) || 0)))}
                        <span>
                          {'★'.repeat(
                            5 - Math.max(0, Math.min(5, Number(review.rating) || 0))
                          )}
                        </span>
                      </div>

                      <p className="vp-review-comment">
                        {review.comment || 'No written comment provided.'}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
        </section>

        {/* RIGHT SIDE: booking card */}
        <aside className="vp-card">
          {done ? (
            <div className="vp-done">
              <span className="vp-check">✓</span>
              <h2>Request sent!</h2>
              <p>
                Booking <strong>{done.id}</strong> is waiting for approval from {vehicle.shop}.
              </p>
              <dl>
                <dt>Dates</dt>
                <dd>{fmtDate(done.start)} → {fmtDate(done.end)}</dd>
                <dt>Total</dt>
                <dd>{peso(daysBetween(done.start, done.end) * vehicle.rate)}</dd>
                <dt>Status</dt>
                <dd>Pending</dd>
              </dl>
              <Link className="vp-btn" to="/account">View my bookings</Link>
              <Link className="vp-btn ghost" to="/browse">Keep browsing</Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <p className="vp-price">
                <strong>{peso(vehicle.rate)}</strong> <span>/ day</span>
              </p>

              {error && <div className="vp-error" role="alert">{error}</div>}

              <AvailabilityCalendar
                  vehicleId={vehicle.id}
                  bookings={taken}
                  start={start}
                  end={end}
                  onStartChange={setStart}
                  onEndChange={setEnd}
                  minDate={TODAY}
              />

              {validDates && (
                <div className="vp-summary">
                  <div>
                    <span>{peso(vehicle.rate)} × {days} {days === 1 ? 'day' : 'days'}</span>
                    <span>{peso(total)}</span>
                  </div>
                  <div className="total">
                    <span>Total</span>
                    <span>{peso(total)}</span>
                  </div>
                </div>
              )}

              {!vehicle.available && (
                <p className="vp-warn">This ride is not available right now.</p>
              )}
              {vehicle.available && clash && (
                <p className="vp-warn">Not available for those dates. Please pick other dates.</p>
              )}
              {vehicle.available && validDates && !clash && (
                <p className="vp-ok">✓ Available for your dates</p>
              )}

              <button className="vp-btn" type="submit" disabled={!vehicle.available || saving}>
                {saving ? 'Sending…' : user ? 'Request booking' : 'Log in to book'}
              </button>
              <p className="vp-small">You won't be charged yet. The shop reviews every request.</p>
            </form>
          )}
        </aside>
      </div>
    </div>
  )
}

export default VehiclePage