import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './auth/auth.js'
import { useVehicles } from './data/vehiclestore.js'
import { api } from './api.js'
import { useBookings } from './data/bookingstore.js'
import { usePayments } from './data/paymentstore.js'
import { useReviews } from './data/reviewstore.js'
import { cleanName, cleanEmail } from './utils/text.js'
import { ExtendModal, PaymentModal, ReceiptModal, ReviewModal } from './Accountmodals.jsx'
import './Accountpage.css'


const peso = (n) => '₱' + n.toLocaleString('en-PH')

const tabs = [
  { key: 'profile', label: 'My Profile', icon: '♙' },
  { key: 'bookings', label: 'My Bookings', icon: '▣' },
  { key: 'documents', label: 'ID & License', icon: '▤' },
  { key: 'settings', label: 'Account Settings', icon: '⚙' },
]

const daysBetween = (a, b) =>
  Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000))

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const phoneOk = (v) => /^(09\d{9}|\+639\d{9})$/.test(v.replace(/[\s-]/g, ''))




// ACCOUNT PAGE FUNCTION 
function AccountPage() {
  const [tab, setTab] = useState('profile')

  // Profile
  const [profileErrors, setProfileErrors] = useState({})
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwDone, setPwDone] = useState(false)
  const [editing, setEditing] = useState(false)
  const { user, logout, updateUser } = useAuth()
  const [profile, setProfile] = useState({
    firstName: user.firstName,
    middleName: user.middleName || '',
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
  })

  // Bookings, payments, reviews
  const { vehicles } = useVehicles()
  const { bookings, updateBooking } = useBookings()
  const { payments, addPayment, startPayment, verifyPayment } = usePayments()
  const { addReview } = useReviews()
  const [statusFilter, setStatusFilter] = useState('All')
  const [payNotice, setPayNotice] = useState('')
  const [modal, setModal] = useState(null) // { type: 'pay' | 'receipt' | 'review' | 'extend', booking }

  const findVehicle = (id) => vehicles.find((v) => v.id === id)
  const paymentOf = (bookingId) => payments.find((p) => p.bookingId === bookingId)
  const totalOf = (b) => {
    const v = findVehicle(b.vehicleId)
    return v ? v.rate * daysBetween(b.start, b.end) : 0
  }

  // Documents
  const [docs, setDocs] = useState({
    license: { name: '', status: 'Not uploaded' },
    id: { name: 'passport-scan.jpg', status: 'Verified' },
  })

  // Settings
  const [notify, setNotify] = useState({ email: true, sms: false })

const updateProfile = (field) => (e) => {
  setProfile({ ...profile, [field]: e.target.value })
  if (profileErrors[field]) setProfileErrors({ ...profileErrors, [field]: '' })
}


const cancelBooking = (id) => {
  if (!window.confirm('Cancel this booking?')) return

  updateBooking(id, { status: 'Cancelled' })
}


const saveProfile = async () => {
  const found = {}
  if (!profile.firstName.trim()) found.firstName = 'Please enter your first name.'
  if (!profile.lastName.trim()) found.lastName = 'Please enter your last name.'
  if (!emailOk(profile.email.trim())) found.email = 'Please enter a valid email.'
  if (!phoneOk(profile.phone)) found.phone = 'Please enter a valid mobile number.'
  setProfileErrors(found)
  if (Object.keys(found).length > 0) return

  const cleaned = {
    firstName: cleanName(profile.firstName),
    middleName: cleanName(profile.middleName),
    lastName: cleanName(profile.lastName),
    email: cleanEmail(profile.email),
    phone: profile.phone.trim(),
  }

  // real accounts save to the database; demo accounts just change the screen
  if (!user.demo) {
    try {
      const { user: updated } = await api('/profile', { method: 'PATCH', body: cleaned })
      updateUser(updated)
    } catch (error) {
      const fromServer = {}
      Object.entries(error.errors || {}).forEach(([field, messages]) => {
        fromServer[field] = messages[0]
      })
      if (Object.keys(fromServer).length === 0) fromServer.email = error.message
      setProfileErrors(fromServer)
      return
    }
  } else {
      updateUser({ ...user, ...cleaned })
  }

  setProfile({ ...profile, ...cleaned })
  setEditing(false)
  }

  const setPwField = (field) => (e) => {
  setPw({ ...pw, [field]: e.target.value })
  if (pwErrors[field]) setPwErrors({ ...pwErrors, [field]: '' })
  }

  const changePassword = async () => {
  const found = {}
  if (!pw.current) found.current = 'Please enter your current password.'
  if (pw.next.length < 8) found.next = 'New password must be at least 8 characters.'
  else if (pw.next === pw.current) found.next = 'New password must be different from the current one.'
  if (pw.confirm !== pw.next) found.confirm = 'Passwords do not match.'
  setPwErrors(found)
  setPwDone(false)
  if (Object.keys(found).length > 0) return

  if (!user.demo) {
    try {
      await api('/password', { method: 'PUT', body: { current: pw.current, password: pw.next } })
    } catch (error) {
      const message = error.errors?.current?.[0] || error.errors?.password?.[0] || error.message
      setPwErrors({ [error.errors?.current ? 'current' : 'next']: message })
      return
    }
  }

  setPw({ current: '', next: '', confirm: '' })
  setPwDone(true)
}

  const closeModal = () => setModal(null)

  const pay = async (booking, method) => {
    // real accounts: go to PayMongo's secure page (the page leaves, then comes back)
    if (!user.demo) {
      try {
        await startPayment(booking.id, method)
      } catch (error) {
        window.alert(error.message)
      }
      return
    }

    addPayment({
      id: 'PAY-' + Date.now().toString().slice(-6),
      bookingId: booking.id,
      amount: totalOf(booking),
      type: 'Full payment',
      method,
      date: new Date().toISOString(),
      status: 'Paid',
      receiptNumber: 'RC-' + Date.now().toString().slice(-8),
    })
    setModal({ type: 'receipt', booking })
  }

  // Coming back from PayMongo: ?paid=<payment id> (or ?cancelled=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paidId = params.get('paid')
    const cancelled = params.get('cancelled')
    if (!paidId && !cancelled) return

    window.history.replaceState({}, '', window.location.pathname)
    setTab('bookings')

    if (cancelled) {
      setPayNotice('Payment was cancelled. You have not been charged.')
      return
    }

    setPayNotice('Checking your payment…')
    verifyPayment(paidId)
      .then((payment) => {
        setPayNotice(
          payment.status === 'Paid'
            ? 'Payment received. Thank you! You can open your receipt below.'
            : 'We have not received the payment yet. If you already paid, refresh this page in a minute.',
        )
      })
      .catch((error) => setPayNotice(error.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitReview = async (booking, rating, comment) => {
    try {
      await addReview({
        id: 'RV-' + Date.now().toString().slice(-6),
        bookingId: booking.id,
        rating,
        comment,
        date: new Date().toISOString(),
      })
      updateBooking(booking.id, { reviewed: true })
      closeModal()
    } catch (error) {
      window.alert(error.message)
    }
  }

  const requestExtension = (booking, newEnd, additional) => {
    updateBooking(booking.id, {
      extension: { newEnd, additional, status: 'Pending', requestedAt: new Date().toISOString() },
    })
    closeModal()
  }

  const uploadDoc = (key) => (e) => {
    const file = e.target.files?.[0]
    if (file) setDocs({ ...docs, [key]: { name: file.name, status: 'Pending review' } })
  }

  const shown = bookings.filter((b) => statusFilter === 'All' || b.status === statusFilter)

  const modalVehicle = modal ? findVehicle(modal.booking.vehicleId) : null
  // Always use the latest copy of the booking, so the modal never shows old data
  const modalBooking = modal ? bookings.find((b) => b.id === modal.booking.id) || modal.booking : null

  return (
    <div className="ac">
      <header className="ac-nav">
        <Link className="ac-brand" to="/browse">
          <img className="ac-logo" src="/BHLRRideLogo - Edited.png" alt="BHLRRide" />
        </Link>
        <Link className="ac-back" to="/browse">← Back to fleet</Link>
      </header>

      <div className="ac-body">
        {/* SIDEBAR */}
        <aside className="ac-side">
          <div className="ac-user">
            <span className="ac-avatar">{profile.firstName[0]}</span>
            <div>
              <strong>{profile.firstName} {profile.lastName}</strong>
              <small>{profile.email}</small>
            </div>
          </div>

          <nav>
            {tabs.map((t) => (
              <button
                key={t.key}
                className={'ac-tab' + (tab === t.key ? ' on' : '')}
                onClick={() => setTab(t.key)}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </nav>

          <button className="ac-tab logout" onClick={logout}>
            <span>↪</span> Log Out
          </button>
        </aside>

        {/* CONTENT */}
        <main className="ac-main">
          {tab === 'profile' && (
            <section>
              <div className="ac-head">
                <div>
                  <h1>My Profile</h1>
                  <p>Your personal details used for bookings.</p>
                </div>
                  <button className="ac-btn ghost" onClick={editing ? saveProfile : () => setEditing(true)}>                    {editing ? 'Save changes' : 'Edit profile'}
                </button>
              </div>

              <div className="ac-card ac-form">
                {[
                  ['firstName', 'First name'],
                  ['middleName', 'Middle name'],
                  ['lastName', 'Last name'],
                  ['email', 'Email address'],
                  ['phone', 'Phone number'],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      value={profile[key]}
                      onChange={updateProfile(key)}
                      disabled={!editing}
                      autoCapitalize={['firstName', 'middleName', 'lastName'].includes(key) ? 'words' : 'none'}
                    />

                    {profileErrors[key] && <small className="lg-field-error">{profileErrors[key]}</small>}
                  </label>
                ))}
              </div>
            </section>
          )}

          {tab === 'bookings' && (
            <section>
              <div className="ac-head">
                <div>
                  <h1>My Bookings</h1>
                  <p>Pay, extend, cancel, or rate your rentals.</p>
                </div>
              </div>

              <div className="ac-chips">
                {['All', 'Pending', 'Approved', 'Completed', 'Cancelled'].map((s) => (
                  <button
                    key={s}
                    className={statusFilter === s ? 'on' : ''}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {payNotice && <div className="ac-card" role="status">{payNotice}</div>}

              {shown.length === 0 && <div className="ac-card ac-empty">No bookings here yet.</div>}

              {shown.map((b) => {
                const v = findVehicle(b.vehicleId)
                if (!v) return null
                const days = daysBetween(b.start, b.end)
                const payment = paymentOf(b.id)
                const ext = b.extension
                return (
                  <article key={b.id} className="ac-card ac-booking">
                    <div className="ac-thumb">
                      <span>{v.emoji}</span>
                      <img
                        src={v.image}
                        alt={`${v.brand} ${v.model}`}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    </div>

                    <div className="ac-booking-info">
                      <div className="ac-booking-top">
                        <h3>{v.brand} {v.model}</h3>
                        <span className={'ac-status ' + b.status.toLowerCase()}>{b.status}</span>
                        {payment && <span className="ac-status paid">Paid</span>}
                      </div>
                      <p>{b.id} · 🏪 {v.shop} · 📍 {v.branch}</p>
                      <p>{fmtDate(b.start)} → {fmtDate(b.end)} ({days} {days === 1 ? 'day' : 'days'})</p>
                      {ext?.status === 'Pending' && (
                        <p className="ac-ext">Extension requested until {fmtDate(ext.newEnd)}. Waiting for the shop.</p>
                      )}
                      {ext?.status === 'Approved' && (
                        <p className="ac-ext">Extended. {peso(ext.additional)} extra is due on return.</p>
                      )}
                      {ext?.status === 'Rejected' && (
                        <p className="ac-ext">Your extension request was not approved.</p>
                      )}
                      <strong>{peso(v.rate * days)}</strong>
                    </div>

                    <div className="ac-actions">
                      {b.status === 'Approved' && !payment && (
                        <button className="ac-btn" onClick={() => setModal({ type: 'pay', booking: b })}>
                          Pay now
                        </button>
                      )}
                      {b.status === 'Approved' && ext?.status !== 'Pending' && (
                        <button className="ac-btn ghost" onClick={() => setModal({ type: 'extend', booking: b })}>
                          Extend
                        </button>
                      )}
                      {(b.status === 'Pending' || (b.status === 'Approved' && !payment)) && (
                        <button className="ac-btn danger" onClick={() => cancelBooking(b.id)}>
                          Cancel
                        </button>
                      )}
                      {payment && (
                        <button className="ac-btn ghost" onClick={() => setModal({ type: 'receipt', booking: b })}>
                          Receipt
                        </button>
                      )}
                      {b.status === 'Completed' && !b.reviewed && (
                        <button className="ac-btn" onClick={() => setModal({ type: 'review', booking: b })}>
                          Rate ride
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </section>
          )}

          {tab === 'documents' && (
            <section>
              <div className="ac-head">
                <div>
                  <h1>ID & License</h1>
                  <p>Upload your driver's license and a valid ID so vendors can verify you before renting.</p>
                </div>
              </div>

              {[
                ['license', "Driver's license"],
                ['id', 'Valid ID'],
              ].map(([key, label]) => (
                <div key={key} className="ac-card ac-doc">
                  <div>
                    <h3>{label}</h3>
                    <p>{docs[key].name || 'No file uploaded yet'}</p>
                  </div>
                  <span className={'ac-status ' + docs[key].status.toLowerCase().replace(' ', '-')}>
                    {docs[key].status}
                  </span>
                  <label className="ac-btn ghost ac-upload">
                    {docs[key].name ? 'Replace file' : 'Upload file'}
                    <input type="file" accept="image/*,.pdf" onChange={uploadDoc(key)} hidden />
                  </label>
                </div>
              ))}
            </section>
          )}

          {tab === 'settings' && (
            <section>
              <div className="ac-head">
                <div>
                  <h1>Account Settings</h1>
                  <p>Manage your password and notifications.</p>
                </div>
              </div>

              <div className="ac-card ac-form">
                <h2>Change password</h2>
                <label>
                  Current password
                  <input type="password" value={pw.current} onChange={setPwField('current')} autoComplete="current-password" />
                  {pwErrors.current && <small className="lg-field-error">{pwErrors.current}</small>}  
                </label>

                <label>
                  Confirm new password
                  <input type="password" value={pw.confirm} onChange={setPwField('confirm')} autoComplete="new-password" />
                  {pwErrors.confirm && <small className="lg-field-error">{pwErrors.confirm}</small>}
                  </label>
                
                  <button className="ac-btn" onClick={changePassword}>Update password</button>
                  {pwDone && <p style={{ gridColumn: '1 / -1', margin: 0, color: '#2f7a4d' }}>Password updated.</p>}

                  
                <label>
                  New password
                  <input type="password" autoComplete="new-password" />
                </label>
                <button
                  className="ac-btn"
                  onClick={() => alert('Password change will be connected to the backend later.')}
                >
                  Update password
                </button>
              </div>

              <div className="ac-card ac-toggles">
                <h2>Notifications</h2>
                {[
                  ['email', 'Email me about booking updates'],
                  ['sms', 'Text me about booking updates'],
                ].map(([key, label]) => (
                  <label key={key} className="ac-check">
                    <input
                      type="checkbox"
                      checked={notify[key]}
                      onChange={(e) => setNotify({ ...notify, [key]: e.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* POP-UPS */}
      {modal?.type === 'pay' && (
        <PaymentModal
          booking={modalBooking}
          vehicle={modalVehicle}
          amount={totalOf(modalBooking)}
          onPay={(method) => pay(modalBooking, method)}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'receipt' && paymentOf(modalBooking.id) && (
        <ReceiptModal
          payment={paymentOf(modalBooking.id)}
          booking={modalBooking}
          vehicle={modalVehicle}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'review' && (
        <ReviewModal
          booking={modalBooking}
          vehicle={modalVehicle}
          onSubmit={(rating, comment) => submitReview(modalBooking, rating, comment)}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'extend' && (
        <ExtendModal
          booking={modalBooking}
          vehicle={modalVehicle}
          bookings={bookings}
          onSubmit={(newEnd, additional) => requestExtension(modalBooking, newEnd, additional)}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

export default AccountPage
