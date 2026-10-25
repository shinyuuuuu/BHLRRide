import { useState } from "react"
import { Link } from 'react-router-dom'
import { useAuth } from "./auth/auth.js"
import { useVehicles } from './data/vehiclestore.js'
import { useBookings } from "./data/bookingstore.js"
import { useConditionLogs } from './data/conditionstore.js'
import './Vendorpage.css'

const peso = (n) => '₱' + Number(n).toLocaleString('en-PH')

const daysBetween = (a, b) =>
  Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000))

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

const BRANCHES = ['Tagbilaran City', 'Panglao', 'Loboc', 'Maribojoc']
const STATUSES = ['Available', 'Rented', 'Under maintenance']
const FUEL_LEVELS = ['Full', '3/4', '1/2', '1/4', 'Empty']

const statusOf = (v) => v.status ?? (v.available ? 'Available' : 'Rented')

const emptyVehicle = {
    brand: '',
    model: '',
    plateNumber: '',
    kind: 'Car',
    style: '',
    transmission: 'Automatic',
    seats: '5',
    fuel: 'Petrol',
    rate: '',
    branch: 'Tagbilaran City',
    image: '',
}

const emptyLog = {
    bookingId: '',
    stage: 'Before rental',
    odometer: '',
    fuel: 'Full',
    notes: '',
    photos: [],
    damage: false,
    charge: '',
}

const tabs = [
  { key: 'overview', label: 'Overview', icon: 'layout-dashboard' },
  { key: 'vehicles', label: 'My Vehicles', icon: 'car-front' },
  { key: 'bookings', label: 'Booking Requests', icon: 'calendar-check' },
  { key: 'condition', label: 'Condition Logs', icon: 'clipboard-check' },
]

// Small inline SVG icon set keeps the dashboard consistent without adding a dependency.
function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const paths = {
    'layout-dashboard': <><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>,
    'car-front': <><path d="m5 11 1.5-5h11L19 11"/><path d="M3 11h18v7H3z"/><path d="M6 18v2m12-2v2M6 14h2m8 0h2"/><path d="m5 11-2 2v3m16-5 2 2v3"/></>,
    'calendar-check': <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-13 5 2 2 4-4"/></>,
    'clipboard-check': <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8 11h8m-8 4 2 2 4-4"/></>,
    'check-circle': <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    'wallet': <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 14h2"/><path d="M6 5V3h11"/></>,
    'calendar-days': <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></>,
    'circle-help': <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.3 2c-1.2 1-1.8 1.2-1.8 2.5M12 17h.01"/></>,
    wrench: <><path d="M14.5 6.5a4 4 0 0 0-5-5l2.2 2.2-2.8 2.8-2.2-2.2a4 4 0 0 0 5 5L19 16.5a2 2 0 0 1-2.8 2.8z"/></>,
    'map-pin': <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  }
  return <svg className="vd-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths['layout-dashboard']}</svg>
}

function VendorPage() {
    const { user, logout } = useAuth()

    const shop = user.shop || 'Bohol Wheels' // THIS LATER BECOMES THE VENDOR'S BUSINESSNAME IN THE DATABASE!!!! (ONCE MACONNECT)

    const { vehicles, addVehicle, updateVehicles, removeVehicle, resetVehicles } = useVehicles()
    const { bookings, updateBooking} = useBookings()
    const { logs, addLog } = useConditionLogs()

    const [completionTarget, setCompletionTarget] = useState(null)

    const [tab, setTab] = useState('overview')


    // VEHICLE FORM SECTION 
    const [editing, setEditing] = useState(null) // null | 'new' | vehicle id 
    const [form, setForm] = useState(emptyVehicle)
    const[formError, setFormError] = useState('')
    const[notice, setNotice] = useState('')


    // BOOKINGS SECTION 
    const [filter, setFilter] = useState('Pending')


    // CONDITION LOGS
    const [logForm, setLogForm] = useState(emptyLog)
    const [logError, setLogError] = useState('')

    const myVehicles = vehicles.filter((v) => v.shop === shop)
    const myIds = myVehicles.map((v) => v.id)
    const vehicleById = (id) => vehicles.find((v) => v.id === id)
    const myBookings = bookings.filter((b) => myIds.includes(b.vehicleId))
    const myLogs = logs.filter((l) => myBookings.some((b) => b.id === l.bookingId)) 
    
    const total = (b) => {
        const v = vehicleById(b.vehicleId)
        return v ? v.rate * daysBetween(b.start, b.end) : 0
    }

    const pending = myBookings.filter((b) => b.status === 'Pending')
    const approved = myBookings.filter((b) => b.status === 'Approved')
    const earnings = myBookings
                    .filter((b) => b.status === 'Completed')
                    .reduce((sum, b) => sum + total(b), 0)

    const set = (field) => (e) => setForm({... form, [field]: e.target.value })
    const setLog = (field) => (e) => setLogForm({... logForm, [field]: e.target.value})


    /* VEHICLES VEHICLES VEHICLES VEHICLES SECTION */

    const startNew = () => {
        setForm(emptyVehicle)
        setFormError('')
        setEditing('new')
    }

    const startEdit= (v) => {
        setForm({
            brand: v.brand, 
            model: v.model,
            plateNumber: v.plateNumber,
            kind: v.kind,
            style: v.style,
            transmission: v.transmission,
            seats: String(v.seats),
            fuel: v.fuel,
            rate: String(v.rate),
            branch: v.branch,
            image: v.image || '',
        })

        setFormError('')
        setEditing(v.id)
    }


    // with validations for plate number, brand, number (rate), and seats. 
    const saveVehicle = async (e) => {
        e.preventDefault()
        if (!form.brand.trim() || !form.model.trim())
            return setFormError('Please enter the brand and model.')
        if(!form.plateNumber.trim())
            return setFormError('Please enter the plate number.')
        if(!(Number(form.rate) > 0 ))
            return setFormError('Please enter a daily rate above 0.')
        if(!(Number(form.seats) > 0))
            return setFormError('Please enter the number of seats.')

        const details = {
            brand: form.brand.trim(),
            model: form.model.trim(),
            plateNumber: form.plateNumber.trim().toUpperCase(),
            kind: form.kind,
            style: form.style.trim() || form.kind,
            transmission: form.transmission,
            seats: Number(form.seats),
            fuel: form.fuel,
            rate: Number(form.rate),
            branch: form.branch,
            image: form.image.trim(),
        }

        try {
            if (editing === 'new') {
                await addVehicle({
                    ...details,
                    shop,
                    rating: 0,
                    badge: '',
                    status: 'Available',
                    available: true,
                })

                setNotice(`${details.brand} ${details.model} was added.`)
            } else {
                await updateVehicles(editing, details)
                setNotice(`${details.brand} ${details.model} was updated.`)
            }
            setEditing(null)
        } catch (error) {
            setFormError(error.message)
        }
    }

    const setStatus = async (v, status) => {
        try {
            await updateVehicles(v.id, { status, available: status === 'Available' })
        } catch (error) {
            setNotice(error.message)
        }
    }

    const remove = async (v) => {
        if (bookings.some((b) => b.vehicleId === v.id)) {
            return setNotice(
               `${v.brand} ${v.model} has booking records, so it can't be removed. Set it to "Under maintenance" instead.`,  
            )
        }

        if(!window.confirm(`Remove ${v.brand} ${v.model}?`))
            return

        try {
            await removeVehicle(v.id)
            setNotice(`${v.brand} ${v.model} was removed.`)
        } catch (error) {
            setNotice(error.message)
        }
    }


    /* BOOKING SECTIONS PT 2 */
    const approve = (b) => updateBooking(b.id, { status: 'Approved'})

    const reject = (b) => {
        if (!window.confirm('Reject this booking request?'))
            return
        updateBooking(b.id, { status: 'Cancelled', cancelledBy: 'vendor'})
    }

    const complete = (b) => {
          setCompletionTarget(b)
      }

     const confirmComplete = () => {
         if (!completionTarget) return

        updateBooking(completionTarget.id, { status: 'Completed' })
        setCompletionTarget(null)
    }

    const shownBookings = myBookings.filter((b) => filter === 'All' || b.status === filter)



    /* CONDITION LOGS SECTION PT 2 !!! */

    const loggable = myBookings.filter((b) => b.status === 'Approved' || b.status === 'Completed')

    const saveLog = (e) => {
        e.preventDefault()

        if(!logForm.bookingId)
            return setLogError('Please choose a booking.')

        if(logForm.odometer === '' || Number(logForm.odometer) < 0)
            return setLogError('Please enter the odometer reading in km.')

        if(logForm.damage && !(Number(logForm.charge) >= 0))
            return setLogError('Please enter the damage charge.')

        addLog({
            id: 'CL-' + Date.now().toString().slice(-6),
            bookingId: logForm.bookingId,
            stage: logForm.stage,
            odometer: Number(logForm.odometer),
            fuel: logForm.fuel,
            notes: logForm.notes.trim(),
            photos: logForm.photos,
            damage: logForm.damage,
            charge: logForm.charge ? Number(logForm.charge || 0) : 0,
            loggedAt: new Date().toISOString(),
        })

        setLogForm(emptyLog)
        setLogError('')
    }

    const pickPhotos = (e) => 
        setLogForm({...logForm, photos: Array(e.target.files || []) })

 return (
    <div className="vd">
      <header className="vd-nav">
        <Link className="vd-brand" to="/browse">
          BHLR<span>Ride</span> <small>Vendor</small>
        </Link>
        <div className="vd-nav-right">
          <Link to="/browse">View site</Link>
          <span className="vd-who">{shop}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>
 
      <div className="vd-body">
        <aside className="vd-side">
          <div className="vd-user">
            <span className="vd-avatar">{user.firstName[0]}</span>
            <div>
              <strong>{user.firstName} {user.lastName}</strong>
              <small>{shop}</small>
            </div>
          </div>
          <nav>
            {tabs.map((t) => (
              <button
                key={t.key}
                className={'vd-tab' + (tab === t.key ? ' on' : '')}
                onClick={() => { setTab(t.key); setNotice('') }}
              >
                <span><Icon name={t.icon} size={19} /></span> {t.label}
                {t.key === 'bookings' && pending.length > 0 && <em>{pending.length}</em>}
              </button>
            ))}
          </nav>

            {/* FOR HELP FLEET SMTHG */}
          <Link to="/vendor/help" className="vd-help">
              <span className="vd-help-icon" aria-hidden="true">?</span>
              <span>
                <strong>Need a hand?</strong>
                <small>Manage your fleet with ease.</small>
                <span className="vd-help-link">View help center →</span>
              </span>
            </Link>

        </aside>
 
        <main className="vd-main">
          {notice && (
            <div className="vd-notice" role="status">
              {notice}
              <button onClick={() => setNotice('')} aria-label="Dismiss">×</button>
            </div>
          )}
 
          {/* ---------------- OVERVIEW ---------------- */}
          {tab === 'overview' && (
            <section>
              <div className="vd-head vd-overview-head">
                <div>
                  <span className="vd-eyebrow">VENDOR OVERVIEW</span>
                  <h1>Welcome, {user.firstName}.</h1>
                  <p>Here's the latest on your rental business.</p>
                </div>
                <button className="vd-btn vd-add-main" onClick={() => { startNew(); setTab('vehicles') }}>＋ Add vehicle</button>
              </div>

              <div className="vd-stats vd-overview-stats">
                <div className="vd-stat vd-stat-icon">
                  <span className="vd-stat-symbol burgundy"><Icon name="car-front" size={23} /></span>
                  <div><small>Total vehicles</small><strong>{myVehicles.length}</strong><p>Vehicles listed in your fleet.</p></div>
                </div>
                <div className="vd-stat vd-stat-icon">
                  <span className="vd-stat-symbol green"><Icon name="check-circle" size={23} /></span>
                  <div><small>Available now</small><strong>{myVehicles.filter((v) => statusOf(v) === 'Available').length}</strong><p>Ready for booking.</p></div>
                </div>
                <div className="vd-stat vd-stat-icon">
                  <span className="vd-stat-symbol gold"><Icon name="clock" size={23} /></span>
                  <div><small>Pending requests</small><strong>{pending.length}</strong><p>Awaiting your approval.</p></div>
                </div>
                <div className="vd-stat vd-stat-icon">
                  <span className="vd-stat-symbol burgundy"><Icon name="calendar-check" size={23} /></span>
                  <div><small>Approved rentals</small><strong>{approved.length}</strong><p>Confirmed bookings.</p></div>
                </div>
              </div>

              <div className="vd-earnings-banner">
                <span className="vd-earnings-symbol"><Icon name="wallet" size={29} /></span>
                <div>
                  <small>Completed rental earnings</small>
                  <strong>{peso(earnings)}</strong>
                  <p>{earnings > 0 ? 'Your earnings from completed rentals.' : 'Your completed rentals will appear here.'}</p>
                </div>
                <span className="vd-banner-mark" aria-hidden="true">↗</span>
              </div>

              <div className="vd-overview-panels">
                <section className="vd-card vd-activity-card">
                  <div className="vd-panel-heading">
                    <h2><span aria-hidden="true"><Icon name="calendar-days" size={22} /></span> Booking activity</h2>
                    <button className="vd-panel-link" onClick={() => { setTab('bookings'); setFilter('All') }}>View all requests <span>→</span></button>
                  </div>
                  {pending.length === 0 ? (
                    <div className="vd-empty-activity">
                      <span className="vd-empty-calendar" aria-hidden="true"><Icon name="calendar-days" size={43} strokeWidth={1.5} /></span>
                      <strong>You're all caught up.</strong>
                      <p>No new booking requests at the moment.</p>
                      <button className="vd-btn ghost" onClick={() => { setTab('bookings'); setFilter('All') }}>View booking requests →</button>
                    </div>
                  ) : (
                    <div className="vd-activity-list">
                      {pending.slice(0, 3).map((b) => {
                        const v = vehicleById(b.vehicleId)
                        return (
                          <div key={b.id} className="vd-quick">
                            <div>
                              <strong>{v ? `${v.brand} ${v.model}` : 'Vehicle booking'}</strong>
                              <p>{b.id} · {b.customer || 'Customer'} · {fmtDate(b.start)} → {fmtDate(b.end)}</p>
                            </div>
                            <div className="vd-actions">
                              <button className="vd-btn" onClick={() => approve(b)}>Approve</button>
                              <button className="vd-btn danger" onClick={() => reject(b)}>Reject</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>

                <section className="vd-card vd-fleet-card">
                  <div className="vd-panel-heading">
                    <h2><span aria-hidden="true"><Icon name="car-front" size={22} /></span> Fleet snapshot</h2>
                  </div>
                  <button className="vd-fleet-row" onClick={() => setTab('vehicles')}>
                    <span className="vd-fleet-thumb" aria-hidden="true"><Icon name="car-front" size={29} /></span>
                    <span><small>Vehicles listed</small><strong>{myVehicles.length}</strong></span><span className="vd-fleet-arrow">›</span>
                  </button>
                  <button className="vd-fleet-row" onClick={() => { setTab('vehicles') }}>
                    <span className="vd-fleet-thumb" aria-hidden="true"><Icon name="car-front" size={29} /></span>
                    <span><small>Available today</small><strong>{myVehicles.filter((v) => statusOf(v) === 'Available').length}</strong></span><span className="vd-fleet-arrow">›</span>
                  </button>
                  <button className="vd-fleet-row" onClick={() => setTab('vehicles')}>
                    <span className="vd-fleet-thumb" aria-hidden="true"><Icon name="wrench" size={27} /></span>
                    <span><small>Needs attention</small><strong>{myVehicles.filter((v) => statusOf(v) === 'Under maintenance').length}</strong></span><span className="vd-fleet-arrow">›</span>
                  </button>
                </section>
              </div>
            </section>
          )}
 
          {/* ---------------- VEHICLES ---------------- */}
          {tab === 'vehicles' && (
            <section>
              <div className="vd-head">
                <div>
                  <h1>My Vehicles</h1>
                  <p>Add, edit, and set the status of your rental vehicles.</p>
                </div>
                <button className="vd-btn" onClick={startNew}>+ Add vehicle</button>
              </div>
 
              {editing !== null && (
                <form className="vd-card vd-form" onSubmit={saveVehicle} noValidate>
                  <h2>{editing === 'new' ? 'Add a vehicle' : 'Edit vehicle'}</h2>
                  {formError && <div className="vd-error" role="alert">{formError}</div>}
 
                  <label>Brand<input value={form.brand} onChange={set('brand')} placeholder="Toyota" /></label>
                  <label>Model<input value={form.model} onChange={set('model')} placeholder="Vios" /></label>
                  <label>Plate number<input value={form.plateNumber} onChange={set('plateNumber')} placeholder="ABC 1234" /></label>
                  <label>Daily rate (₱)<input type="number" min="0" value={form.rate} onChange={set('rate')} /></label>
                  <label>
                    Type
                    <select value={form.kind} onChange={set('kind')}>
                      <option>Car</option>
                      <option>Motorcycle</option>
                    </select>
                  </label>
                  <label>Style<input value={form.style} onChange={set('style')} placeholder="Sedan, Scooter, SUV..." /></label>
                  <label>
                    Transmission
                    <select value={form.transmission} onChange={set('transmission')}>
                      <option>Automatic</option>
                      <option>Manual</option>
                    </select>
                  </label>
                  <label>Seats<input type="number" min="1" value={form.seats} onChange={set('seats')} /></label>
                  <label>
                    Fuel
                    <select value={form.fuel} onChange={set('fuel')}>
                      <option>Petrol</option>
                      <option>Diesel</option>
                      <option>Electric</option>
                    </select>
                  </label>
                  <label>
                    Branch
                    <select value={form.branch} onChange={set('branch')}>
                      {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                  <label className="full">
                    Photo path
                    <input value={form.image} onChange={set('image')} placeholder="/images/toyotaVios.jpg" />
                    <small>Put the photo in public/images, then type its path here.</small>
                  </label>
 
                  <div className="vd-form-actions full">
                    <button className="vd-btn" type="submit">Save vehicle</button>
                    <button className="vd-btn ghost" type="button" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </form>
              )}
 
              {myVehicles.length === 0 && <div className="vd-card vd-muted">You haven't added any vehicles yet.</div>}
 
              {myVehicles.map((v) => (
                <article key={v.id} className="vd-card vd-row">
                  <div className="vd-thumb">
                    {v.image && (
                      <img
                        src={v.image}
                        alt={`${v.brand} ${v.model}`}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </div>
                  <div className="vd-row-info">
                    <h3>{v.brand} {v.model}</h3>
                    <p>{v.plateNumber} · {v.kind} · {v.transmission}</p>
                    <p><Icon name="map-pin" size={15} /> {v.branch} · <strong>{peso(v.rate)}</strong> / day</p>
                  </div>
                  <div className="vd-row-controls">
                    <label>
                      Status
                      <select value={statusOf(v)} onChange={(e) => setStatus(v, e.target.value)}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                    <div className="vd-actions">
                      <button className="vd-btn ghost" onClick={() => startEdit(v)}>Edit</button>
                      <button className="vd-btn danger" onClick={() => remove(v)}>Remove</button>
                    </div>
                  </div>
                </article>
              ))}
 
              <button className="vd-link" onClick={() => { resetVehicles(); setNotice('Vehicle list refreshed.') }}>
                Reset demo vehicles
              </button>
            </section>
          )}
 
          {/* ---------------- BOOKINGS ---------------- */}
          {tab === 'bookings' && (
            <section>
              <div className="vd-head">
                <div>
                  <h1>Booking Requests</h1>
                  <p>Approve or reject requests, and mark rentals as returned.</p>
                </div>
              </div>
 
              <div className="vd-chips">
                {['Pending', 'Approved', 'Completed', 'Cancelled', 'All'].map((s) => (
                  <button key={s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>
                    {s}
                  </button>
                ))}
              </div>
 
              {shownBookings.length === 0 && <div className="vd-card vd-muted">No bookings here.</div>}
 
              {shownBookings.map((b) => {
                const v = vehicleById(b.vehicleId)
                const days = daysBetween(b.start, b.end)
                return (
                  <article key={b.id} className="vd-card vd-row">
                    <div className="vd-thumb">
                      <span className="vd-booking-car-icon" aria-hidden="true"><Icon name="car-front" size={25} /></span>
                      {v.image && (
                        <img
                          src={v.image}
                          alt={`${v.brand} ${v.model}`}
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      )}
                    </div>
                    <div className="vd-row-info">
                      <div className="vd-top">
                        <h3>{v.brand} {v.model}</h3>
                        <span className={'vd-pill ' + b.status.toLowerCase()}>{b.status}</span>
                      </div>
                      <p>{b.id} · {b.customer || 'Customer'}</p>
                      <p>{fmtDate(b.start)} → {fmtDate(b.end)} ({days} {days === 1 ? 'day' : 'days'})</p>
                      <strong className="vd-total">{peso(total(b))}</strong>
                    </div>
                    <div className="vd-actions col">
                      {b.status === 'Pending' && (
                        <>
                          <button className="vd-btn" onClick={() => approve(b)}>Approve</button>
                          <button className="vd-btn danger" onClick={() => reject(b)}>Reject</button>
                        </>
                      )}
                      {b.status === 'Approved' && (
                        <>
                          <button className="vd-btn" onClick={() => complete(b)}>
                            Mark returned</button>
                          <button
                            className="vd-btn ghost"
                            onClick={() => { setLogForm({ ...emptyLog, bookingId: b.id }); setTab('condition') }}
                          >
                            Log condition
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                )
              })}
            </section>
          )}
 
          {/* ---------------- CONDITION LOGS ---------------- */}
          {tab === 'condition' && (
            <section>
              <div className="vd-head">
                <div>
                  <h1>Condition Logs</h1>
                  <p>Record a vehicle's condition before and after each rental.</p>
                </div>
              </div>
 
              <form className="vd-card vd-form" onSubmit={saveLog} noValidate>
                <h2>New log</h2>
                {logError && <div className="vd-error" role="alert">{logError}</div>}
 
                <label className="full">
                  Booking
                  <select value={logForm.bookingId} onChange={setLog('bookingId')}>
                    <option value="">Choose a booking...</option>
                    {loggable.map((b) => {
                      const v = vehicleById(b.vehicleId)
                      return (
                        <option key={b.id} value={b.id}>
                          {b.id} · {v.brand} {v.model} · {fmtDate(b.start)}
                        </option>
                      )
                    })}
                  </select>
                </label>
                <label>
                  When
                  <select value={logForm.stage} onChange={setLog('stage')}>
                    <option>Before rental</option>
                    <option>After rental</option>
                  </select>
                </label>
                <label>
                  Odometer (km)
                  <input type="number" min="0" value={logForm.odometer} onChange={setLog('odometer')} />
                </label>
                <label>
                  Fuel level
                  <select value={logForm.fuel} onChange={setLog('fuel')}>
                    {FUEL_LEVELS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </label>
                <label>
                  Photos
                  <input type="file" accept="image/*" multiple onChange={pickPhotos} />
                </label>
                <label className="full">
                  Notes
                  <input value={logForm.notes} onChange={setLog('notes')} placeholder="Scratches, tire condition, cleanliness..." />
                </label>
                <label className="vd-check full">
                  <input
                    type="checkbox"
                    checked={logForm.damage}
                    onChange={(e) => setLogForm({ ...logForm, damage: e.target.checked })}
                  />
                  Damage found
                </label>
                {logForm.damage && (
                  <label className="full">
                    Damage charge (₱)
                    <input type="number" min="0" value={logForm.charge} onChange={setLog('charge')} />
                  </label>
                )}
                <div className="vd-form-actions full">
                  <button className="vd-btn" type="submit">Save log</button>
                </div>
              </form>
 
              {myLogs.length === 0 ? (
                <div className="vd-card vd-muted">No condition logs yet.</div>
              ) : (
                myLogs.map((l) => {
                  const b = myBookings.find((x) => x.id === l.bookingId)
                  const v = b && vehicleById(b.vehicleId)
                  return (
                    <article key={l.id} className="vd-card vd-log">
                      <div className="vd-top">
                        <h3>{v ? `${v.brand} ${v.model}` : l.bookingId}</h3>
                        <span className={'vd-pill ' + (l.stage === 'Before rental' ? 'approved' : 'completed')}>
                          {l.stage}
                        </span>
                        {l.damage && <span className="vd-pill cancelled">Damage</span>}
                      </div>
                      <p>
                        {l.bookingId} · {new Date(l.loggedAt).toLocaleString('en-PH')}
                      </p>
                      <p>
                        Odometer <strong>{l.odometer.toLocaleString('en-PH')} km</strong> · Fuel <strong>{l.fuel}</strong>
                        {l.photos.length > 0 && <> · {l.photos.length} photo{l.photos.length === 1 ? '' : 's'}</>}
                      </p>
                      {l.notes && <p>{l.notes}</p>}
                      {l.damage && <p className="vd-damage">Damage charge: {peso(l.charge)}</p>}
                    </article>
                  )
                })
              )}
            </section>
          )}
        </main>
      </div>



    {/* WINDOW POP UP ALERT */}
    {completionTarget && (
    <div
        className="vd-modal-overlay"
        onClick={() => setCompletionTarget(null)}
    >
        <section
            className="vd-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vd-modal-title"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="vd-modal-icon">
                <Icon name="check-circle" size={30} />
            </div>

            <span className="vd-modal-eyebrow">RENTAL COMPLETION</span>

            <h2 id="vd-modal-title">Complete this rental?</h2>

            <p className="vd-modal-description">
                Confirm that the vehicle has been returned and the rental
                is finished.
            </p>

            <div className="vd-modal-booking">
                <span>BOOKING REFERENCE</span>
                <strong>{completionTarget.id}</strong>
                <p>{completionTarget.customer || 'Customer'}</p>
            </div>

            <div className="vd-modal-actions">
                <button
                    type="button"
                    className="vd-modal-cancel"
                    onClick={() => setCompletionTarget(null)}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    className="vd-modal-confirm"
                    onClick={confirmComplete}
                >
                    <Icon name="check-circle" size={17} />
                    Mark as Completed
                </button>
            </div>
        </section>
    </div>
  )}
    </div>
  )
}   


export default VendorPage
