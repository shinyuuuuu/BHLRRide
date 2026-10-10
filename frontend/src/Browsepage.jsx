import { useMemo, useState } from 'react'
import './BrowsePage.css'

const vehicles = [
  { id: 1, name: 'Toyota Vios', kind: 'Car', style: 'Sedan', transmission: 'Automatic', seats: 5, fuel: 'Petrol', rate: 1500, rating: 4.8, branch: 'Tagbilaran City', badge: 'Weekend favourite', emoji: '🚗', available: true },
  { id: 2, name: 'Toyota Wigo', kind: 'Car', style: 'Hatchback', transmission: 'Manual', seats: 5, fuel: 'Petrol', rate: 1200, rating: 4.6, branch: 'Tagbilaran City', badge: '', emoji: '🚗', available: true },
  { id: 3, name: 'Toyota Innova', kind: 'Car', style: 'MPV', transmission: 'Manual', seats: 7, fuel: 'Diesel', rate: 2500, rating: 4.7, branch: 'Panglao', badge: 'Family pick', emoji: '🚙', available: true },
  { id: 4, name: 'Toyota Hiace', kind: 'Car', style: 'Van', transmission: 'Manual', seats: 12, fuel: 'Diesel', rate: 4000, rating: 4.7, branch: 'Tagbilaran City', badge: 'Group tours', emoji: '🚐', available: true },
  { id: 5, name: 'Honda Click 125', kind: 'Motorcycle', style: 'Scooter', transmission: 'Automatic', seats: 2, fuel: 'Petrol', rate: 600, rating: 4.9, branch: 'Panglao', badge: 'Island essential', emoji: '🛵', available: true },
  { id: 6, name: 'Yamaha NMAX', kind: 'Motorcycle', style: 'Scooter', transmission: 'Automatic', seats: 2, fuel: 'Petrol', rate: 900, rating: 4.8, branch: 'Tagbilaran City', badge: '', emoji: '🛵', available: true },
  { id: 7, name: 'Honda XR150L', kind: 'Motorcycle', style: 'Adventure', transmission: 'Manual', seats: 2, fuel: 'Petrol', rate: 800, rating: 4.6, branch: 'Loboc', badge: 'Chocolate Hills runs', emoji: '🏍️', available: true },
  { id: 8, name: 'Yamaha Mio i 125', kind: 'Motorcycle', style: 'Scooter', transmission: 'Automatic', seats: 2, fuel: 'Petrol', rate: 500, rating: 4.5, branch: 'Loboc', badge: '', emoji: '🛵', available: false },
]

const peso = (n) => '₱' + n.toLocaleString('en-PH')

function BrowsePage() {
  const [kind, setKind] = useState('All')
  const [sort, setSort] = useState('recommended')
  const [maxRate, setMaxRate] = useState(4000)
  const [transmissions, setTransmissions] = useState([])
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [saved, setSaved] = useState([])
  const [days, setDays] = useState(3)

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const results = useMemo(() => {
    let list = vehicles.filter(
      (v) =>
        (kind === 'All' || v.kind === kind) &&
        v.rate <= maxRate &&
        (transmissions.length === 0 || transmissions.includes(v.transmission)) &&
        (!onlyAvailable || v.available),
    )
    if (sort === 'low') list = [...list].sort((a, b) => a.rate - b.rate)
    if (sort === 'high') list = [...list].sort((a, b) => b.rate - a.rate)
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [kind, sort, maxRate, transmissions, onlyAvailable])

  const resetAll = () => {
    setKind('All')
    setMaxRate(4000)
    setTransmissions([])
    setOnlyAvailable(true)
  }

  return (
    <div className="bp">
     
<header className="bp-nav">
        <a className="bp-brand" href="#home">
            BHLR<span>Ride</span>
        </a>

        <nav className="bp-nav-links">
            <a className="active" href="#fleet">Browse Fleet</a>
        </nav>

        <div className="bp-nav-actions">
            <button
            className="bp-notification"
            type="button"
            aria-label="Notifications"
            title="Notifications"
            >
            ♧
            </button>

            <details className="bp-account-dropdown">
            <summary className="bp-account">
                <span className="bp-avatar">S</span>
                <span className="bp-account-label">Account</span>
                <span className="bp-chevron">⌄</span>
            </summary>

            <div className="bp-account-menu">
                <p className="bp-menu-heading">My Account</p>

                <a href="#profile" className="bp-menu-item">
                <span>♙</span> My Profile
                </a>

                <a href="#bookings" className="bp-menu-item">
                <span>▣</span> My Bookings
                </a>

                <a href="#saved" className="bp-menu-item">
                <span>♡</span> Saved Rides ({saved.length})
                </a>

                <a href="#settings" className="bp-menu-item">
                <span>⚙</span> Account Settings
                </a>

                <div className="bp-menu-divider" />

                <button
                className="bp-menu-item"
                type="button"
                onClick={() => alert('Log out will be connected to the account system later.')}
                >
                <span>↪</span> Log Out
                </button>
            </div>
            </details>
        </div>
        </header>


      <section className="bp-hero">
        <h1>
          Great roads. <em>Your next ride.</em>
        </h1>
        <p>From city essentials to island escapes. Find a ride that feels like you.</p>
      </section>

      <section className="bp-search" aria-label="Search rides">
        <label>
          Pickup location
          <select defaultValue="Tagbilaran City">
            <option>Tagbilaran City</option>
            <option>Panglao</option>
            <option>Loboc</option>
            <option>Maribojoc</option>
          </select>
        </label>
        <label>
          Pickup date
          <input type="date" defaultValue="2026-10-16" />
        </label>
        <label>
          Return date
          <input
            type="date"
            defaultValue="2026-10-19"
            onChange={(e) => {
              const start = new Date('2026-10-16')
              const diff = Math.round((new Date(e.target.value) - start) / 86400000)
              if (diff > 0) setDays(diff)
            }}
          />
        </label>
        <button className="bp-btn">Find my ride</button>
      </section>

      <div className="bp-body" id="fleet">
        <aside className="bp-filters">
          <div className="bp-filters-head">
            <h2>Filters</h2>
            <button onClick={resetAll}>Reset all</button>
          </div>

          <div className="bp-group">
            <h3>Daily budget</h3>
            <input
              type="range"
              min="500"
              max="4000"
              step="100"
              value={maxRate}
              onChange={(e) => setMaxRate(Number(e.target.value))}
            />
            <p className="bp-muted">Up to {peso(maxRate)} per day</p>
          </div>

          <div className="bp-group">
            <h3>Transmission</h3>
            {['Automatic', 'Manual'].map((t) => (
              <label key={t} className="bp-check">
                <input
                  type="checkbox"
                  checked={transmissions.includes(t)}
                  onChange={() => toggle(transmissions, setTransmissions, t)}
                />
                {t}
              </label>
            ))}
          </div>

          <div className="bp-group">
            <h3>Rental preferences</h3>
            <label className="bp-check">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
              />
              Available for my dates
            </label>
          </div>
        </aside>

        <main className="bp-results">
          <div className="bp-toolbar">
            <div className="bp-tabs" role="tablist">
              {['All', 'Car', 'Motorcycle'].map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={kind === k}
                  className={kind === k ? 'on' : ''}
                  onClick={() => setKind(k)}
                >
                  {k === 'All' ? 'All rides' : k === 'Car' ? 'Cars' : 'Motorcycles'}
                </button>
              ))}
            </div>

            <label className="bp-sort">
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>

          <h2 className="bp-title">Find your freedom.</h2>
          <p className="bp-muted">
            {results.length} {results.length === 1 ? 'ride' : 'rides'} match your filters
          </p>

          {results.length === 0 ? (
            <div className="bp-empty">
              <p>No rides match these filters.</p>
              <button className="bp-btn" onClick={resetAll}>Reset filters</button>
            </div>
          ) : (
            <div className="bp-grid">
              {results.map((v) => (
                <article key={v.id} className="bp-card">
                  <div className="bp-photo">
                    <span className="bp-emoji">{v.emoji}</span>
                    {v.badge && <span className="bp-badge">{v.badge}</span>}
                    <button
                      className={'bp-heart' + (saved.includes(v.id) ? ' on' : '')}
                      aria-label={saved.includes(v.id) ? 'Remove from saved rides' : 'Save ride'}
                      aria-pressed={saved.includes(v.id)}
                      onClick={() => toggle(saved, setSaved, v.id)}
                    >
                      {saved.includes(v.id) ? '♥' : '♡'}
                    </button>
                  </div>

                  <div className="bp-info">
                    <div className="bp-meta">
                      <span>{v.kind} · {v.style}</span>
                      <span>★ {v.rating}</span>
                    </div>
                    <h3>{v.name}</h3>
                    <p className="bp-specs">
                      {v.transmission} · {v.seats} seats · {v.fuel}
                    </p>
                    <p className="bp-specs">📍 {v.branch}</p>

                    <div className="bp-price">
                      <div>
                        <strong>{peso(v.rate)}</strong> <span>/ day</span>
                        <small>{peso(v.rate * days)} for {days} days</small>
                      </div>
                      <span className={'bp-status ' + (v.available ? 'ok' : 'no')}>
                        {v.available ? 'Available' : 'Booked'}
                      </span>
                    </div>

                    <button className="bp-btn full" disabled={!v.available}>
                      Book this ride
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="bp-footer">
        <p>© 2026 BHLRRide. Great roads. Better rides.</p>
      </footer>
    </div>
  )
}

export default BrowsePage