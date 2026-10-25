import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './auth/auth.js'
import { useVehicles } from './data/vehiclestore.js'
import { useBookings } from './data/bookingstore.js'
import { useVendors } from './data/vendorstore.js'
import { usePenaltyRules } from './data/penaltystore.js'
import './Vendorpage.css'
import './Adminpage.css'

const peso = (n) => '₱' + Number(n).toLocaleString('en-PH')

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

const tabs = [
  { key: 'reports', label: 'Reports', icon: '◩' },
  { key: 'vendors', label: 'Vendor Approvals', icon: '▣' },
  { key: 'bookings', label: 'All Bookings', icon: '▤' },
  { key: 'penalties', label: 'Penalty Rules', icon: '⚖' },
]

function AdminPage() {
  const { user, logout } = useAuth()
  const { vehicles } = useVehicles()
  const { bookings } = useBookings()
  const { vendors, updateVendor } = useVendors()
  const { rules, addRule, updateRule, removeRule } = usePenaltyRules()

  const [tab, setTab] = useState('reports')
  const [vendorFilter, setVendorFilter] = useState('Pending')
  const [bookingFilter, setBookingFilter] = useState('All')
  const [shopFilter, setShopFilter] = useState('All')
  const [notice, setNotice] = useState('')

  const vehicleById = (id) => vehicles.find((v) => v.id === id)
  const total = (b) => {
    const v = vehicleById(b.vehicleId)
    return v ? v.rate * daysBetween(b.start, b.end) : 0
  }
  const shopOf = (b) => vehicleById(b.vehicleId)?.shop || '—'
  const nameOf = (b) => {
    const v = vehicleById(b.vehicleId)
    return v ? `${v.brand} ${v.model}` : b.vehicleId
  }



  /* REPORTS */
  const completed = bookings.filter((b) => b.status === 'Completed')
  const revenue = completed.reduce((sum, b) => sum + total(b), 0)

  const shops = [...new Set(vehicles.map((v) => v.shop))]
  const revenueByShop = shops
    .map((shop) => {
      const mine = completed.filter((b) => shopOf(b) === shop)
      return { shop, count: mine.length, amount: mine.reduce((s, b) => s + total(b), 0) }
    })
    .sort((a, b) => b.amount - a.amount)


  const counts = {}
  bookings
    .filter((b) => b.status !== 'Cancelled')
    .forEach((b) => { counts[b.vehicleId] = (counts[b.vehicleId] || 0) + 1 })
  const mostRented = Object.entries(counts)
    .map(([id, count]) => ({ vehicle: vehicleById(Number(id)), count }))
    .filter((x) => x.vehicle)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const maxCount = Math.max(1, ...mostRented.map((x) => x.count))

  const lateRule = rules.find((r) => r.type === 'Late return')
  const overdue = bookings
    .filter((b) => b.status === 'Approved' && b.end < TODAY)
    .map((b) => {
      const late = daysBetween(b.end, TODAY)
      return { booking: b, late, fee: lateRule ? lateRule.amount * late : 0 }
    })

  const pendingVendors = vendors.filter((v) => v.status === 'Pending')
  const approvedVendors = vendors.filter((v) => v.status === 'Approved')



  /* VENDORS */
  const decide = async (v, status) => {
    if (status === 'Rejected' && !window.confirm(`Reject ${v.businessName}?`)) return
    try {
      await updateVendor(v.id, {
        status,
        decidedAt: new Date().toISOString(),
        decidedBy: `${user.firstName} ${user.lastName}`,
      })
      setNotice(`${v.businessName} was ${status.toLowerCase()}.`)
    } catch (error) {
      setNotice(error.message)
    }
  }

  const shownVendors = vendors.filter((v) => vendorFilter === 'All' || v.status === vendorFilter)
  const vehicleCount = (shop) => vehicles.filter((v) => v.shop === shop).length




  /* BOOKINGS  */
  const shownBookings = bookings.filter(
    (b) =>
      (bookingFilter === 'All' || b.status === bookingFilter) &&
      (shopFilter === 'All' || shopOf(b) === shopFilter),
  )


  
  return (
    <div className="vd">
      <header className="vd-nav">
        <Link className="vd-brand" to="/browse">
          BHLR<span>Ride</span> <small>Admin</small>
        </Link>
        <div className="vd-nav-right">
          <Link to="/browse">View site</Link>
          <span className="vd-who">{user.firstName} {user.lastName}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <div className="vd-body">
        <aside className="vd-side">
          <div className="vd-user">
            <span className="vd-avatar">{user.firstName[0]}</span>
            <div>
              <strong>{user.firstName} {user.lastName}</strong>
              <small>Administrator</small>
            </div>
          </div>
          <nav>
            {tabs.map((t) => (
              <button
                key={t.key}
                className={'vd-tab' + (tab === t.key ? ' on' : '')}
                onClick={() => { setTab(t.key); setNotice('') }}
              >
                <span>{t.icon}</span> {t.label}
                {t.key === 'vendors' && pendingVendors.length > 0 && <em>{pendingVendors.length}</em>}
              </button>
            ))}
          </nav>
        </aside>

        <main className="vd-main">
          {notice && (
            <div className="vd-notice" role="status">
              {notice}
              <button onClick={() => setNotice('')} aria-label="Dismiss">×</button>
            </div>
          )}

          {/* ---------------- REPORTS ---------------- */}
          {tab === 'reports' && (
            <section>
              <div className="vd-head">
                <div>
                  <h1>Reports</h1>
                  <p>A look at all vendors and branches.</p>
                </div>
              </div>

              <div className="vd-stats">
                <div className="vd-stat"><small>Approved vendors</small><strong>{approvedVendors.length}</strong></div>
                <div className="vd-stat"><small>Vendors waiting</small><strong>{pendingVendors.length}</strong></div>
                <div className="vd-stat"><small>Total bookings</small><strong>{bookings.length}</strong></div>
                <div className="vd-stat"><small>Overdue returns</small><strong>{overdue.length}</strong></div>
                <div className="vd-stat wide"><small>Revenue from completed rentals</small><strong>{peso(revenue)}</strong></div>
              </div>

              <div className="vd-card">
                <h2>Revenue by shop</h2>
                <table className="ad-table">
                  <thead>
                    <tr><th>Shop</th><th>Completed rentals</th><th className="num">Revenue</th></tr>
                  </thead>
                  <tbody>
                    {revenueByShop.map((r) => (
                      <tr key={r.shop}>
                        <td>{r.shop}</td>
                        <td>{r.count}</td>
                        <td className="num">{peso(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="vd-card">
                <h2>Most-rented vehicles</h2>
                {mostRented.length === 0 ? (
                  <p className="vd-muted">No bookings yet.</p>
                ) : (
                  mostRented.map((x) => (
                    <div key={x.vehicle.id} className="ad-bar-row">
                      <span>{x.vehicle.brand} {x.vehicle.model}</span>
                      <div className="ad-bar"><i style={{ width: `${(x.count / maxCount) * 100}%` }} /></div>
                      <strong>{x.count}</strong>
                    </div>
                  ))
                )}
              </div>

              <div className="vd-card">
                <h2>Overdue returns</h2>
                {overdue.length === 0 ? (
                  <p className="vd-muted">No overdue returns.</p>
                ) : (
                  <table className="ad-table">
                    <thead>
                      <tr><th>Booking</th><th>Vehicle</th><th>Shop</th><th>Due</th><th>Days late</th><th className="num">Late fee</th></tr>
                    </thead>
                    <tbody>
                      {overdue.map(({ booking: b, late, fee }) => (
                        <tr key={b.id}>
                          <td>{b.id}</td>
                          <td>{nameOf(b)}</td>
                          <td>{shopOf(b)}</td>
                          <td>{fmtDate(b.end)}</td>
                          <td>{late}</td>
                          <td className="num">{peso(fee)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {lateRule && overdue.length > 0 && (
                  <p className="vd-muted ad-foot">
                    Late fees use the rule "{lateRule.name}" ({peso(lateRule.amount)} {lateRule.unit}).
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ---------------- VENDORS ---------------- */}
          {tab === 'vendors' && (
            <section>
              <div className="vd-head">
                <div>
                  <h1>Vendor Approvals</h1>
                  <p>Vendors can only operate after you approve them.</p>
                </div>
              </div>

              <div className="vd-chips">
                {['Pending', 'Approved', 'Rejected', 'All'].map((s) => (
                  <button key={s} className={vendorFilter === s ? 'on' : ''} onClick={() => setVendorFilter(s)}>
                    {s}
                  </button>
                ))}
              </div>

              {shownVendors.length === 0 && <div className="vd-card vd-muted">No vendors here.</div>}

              {shownVendors.map((v) => (
                <article key={v.id} className="vd-card ad-vendor">
                  <div className="vd-row-info">
                    <div className="vd-top">
                      <h3>{v.businessName}</h3>
                      <span className={'vd-pill ' + (v.status === 'Rejected' ? 'cancelled' : v.status.toLowerCase())}>
                        {v.status}
                      </span>
                    </div>
                    <p>{v.ownerFirst} {v.ownerLast} · {v.email} · {v.phone}</p>
                    <p>📍 {v.street}, {v.city}, {v.province}</p>
                    <p>
                      Applied {fmtDate(v.appliedAt)}
                      {v.decidedAt && <> · {v.status} {fmtDate(v.decidedAt)} by {v.decidedBy}</>}
                      {v.status === 'Approved' && <> · {vehicleCount(v.businessName)} vehicles</>}
                    </p>
                  </div>
                  <div className="vd-actions">
                    {v.status !== 'Approved' && (
                      <button className="vd-btn" onClick={() => decide(v, 'Approved')}>Approve</button>
                    )}
                    {v.status === 'Pending' && (
                      <button className="vd-btn danger" onClick={() => decide(v, 'Rejected')}>Reject</button>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}

          {/* ---------------- BOOKINGS ---------------- */}
          {tab === 'bookings' && (
            <section>
              <div className="vd-head">
                <div>
                  <h1>All Bookings</h1>
                  <p>Every booking across all shops and branches.</p>
                </div>
              </div>

              <div className="ad-filters">
                <div className="vd-chips">
                  {['All', 'Pending', 'Approved', 'Completed', 'Cancelled'].map((s) => (
                    <button key={s} className={bookingFilter === s ? 'on' : ''} onClick={() => setBookingFilter(s)}>
                      {s}
                    </button>
                  ))}
                </div>
                <label className="ad-select">
                  Shop
                  <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}>
                    <option>All</option>
                    {shops.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              <div className="vd-card ad-scroll">
                {shownBookings.length === 0 ? (
                  <p className="vd-muted">No bookings match.</p>
                ) : (
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Booking</th><th>Customer</th><th>Vehicle</th><th>Shop</th>
                        <th>Dates</th><th>Status</th><th className="num">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownBookings.map((b) => (
                        <tr key={b.id}>
                          <td>{b.id}</td>
                          <td>{b.customer || 'Customer'}</td>
                          <td>{nameOf(b)}</td>
                          <td>{shopOf(b)}</td>
                          <td>{fmtDate(b.start)} → {fmtDate(b.end)}</td>
                          <td><span className={'vd-pill ' + b.status.toLowerCase()}>{b.status}</span></td>
                          <td className="num">{peso(total(b))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* ---------------- PENALTY RULES ---------------- */}
          {tab === 'penalties' && (
            <section>
              <div className="vd-head">
                <div>
                  <h1>Penalty Rules</h1>
                  <p>Set the fees for late returns and damage. Changes save right away.</p>
                </div>
                <button
                  className="vd-btn"
                  onClick={() => addRule({ name: 'New rule', type: 'Damage', amount: 0, unit: 'flat' })}
                >
                  + Add rule
                </button>
              </div>

              {rules.length === 0 && <div className="vd-card vd-muted">No penalty rules yet.</div>}

              {rules.map((r) => (
                <div key={r.id} className="vd-card ad-rule">
                  <label>
                    Rule name
                    <input value={r.name} onChange={(e) => updateRule(r.id, { name: e.target.value })} />
                  </label>
                  <label>
                    Type
                    <select value={r.type} onChange={(e) => updateRule(r.id, { type: e.target.value })}>
                      <option>Late return</option>
                      <option>Damage</option>
                    </select>
                  </label>
                  <label>
                    Amount (₱)
                    <input
                      type="number"
                      min="0"
                      value={r.amount}
                      onChange={(e) => updateRule(r.id, { amount: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Charged
                    <select value={r.unit} onChange={(e) => updateRule(r.id, { unit: e.target.value })}>
                      <option>per day</option>
                      <option>flat</option>
                    </select>
                  </label>
                  <button
                    className="vd-btn danger"
                    onClick={() => {
                      if (window.confirm(`Delete "${r.name}"?`)) removeRule(r.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminPage