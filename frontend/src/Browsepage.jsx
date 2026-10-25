import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './auth/auth.js'
import { useVehicles } from './data/vehiclestore.js'
import './Browsepage.css'


const peso = (n) => '₱' + n.toLocaleString('en-PH')

const heroSlides = [
  {
    image: '/images/roadbohol.jpg',
    location: 'BOHOL, PHILIPPINES',
    caption: 'The open road awaits.',
  },
  {
    image: '/images/alonapanglao.jpg',
    location: 'PANGLAO ISLAND',
    caption: 'Find your coastal escape.',
  },
  {
    image: '/images/manmadeforest.jpg',
    location: 'MANMADE FOREST',
    caption: 'Take the greenery route.',
  },
  {
    image:'/images/chocoroad.jpg',
    location: 'CHOCOLATE HILLS',
    caption: 'Experience the beauty of the famous Chocolate Hills.'
  }
]

function BrowsePage() {
  const { user, logout } = useAuth()
  const { vehicles } = useVehicles()
  const [kind, setKind] = useState('All')
  const [branch, setBranch] = useState('All')
  const [sort, setSort] = useState('recommended')
  const [maxRate, setMaxRate] = useState(4000)
  const [transmissions, setTransmissions] = useState([])
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [days, setDays] = useState(3)

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const results = useMemo(() => {
    let list = vehicles.filter(
      (v) =>
        (kind === 'All' || v.kind === kind) &&
        (branch === 'All' || v.branch === branch) &&
        v.rate <= maxRate &&
        (transmissions.length === 0 || transmissions.includes(v.transmission)) &&
        (!onlyAvailable || v.available),
    )
    if (sort === 'low') list = [...list].sort((a, b) => a.rate - b.rate)
    if (sort === 'high') list = [...list].sort((a, b) => b.rate - a.rate)
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [vehicles, kind, branch, sort, maxRate, transmissions, onlyAvailable])

  const resetAll = () => {
    setKind('All')
    setBranch('All')
    setMaxRate(4000)
    setTransmissions([])
    setOnlyAvailable(true)
  }

const [heroIndex, setHeroIndex] = useState(0)

    useEffect(() => {
      const timer = setInterval(() => {
        setHeroIndex((current) => (current + 1) % heroSlides.length)
      }, 5000)

      return () => clearInterval(timer)
    }, [])



  return (
    <div className="bp">
     
    <header className="bp-nav">
       <Link className="bp-brand" to="/browse">
        <img className="bp-logo" src="/BHLRRideLogo - Edited.png" alt="BHLRRide" />
        </Link>

        <nav className="bp-nav-links">
          <a className="active" href="#fleet">Browse Fleet</a>
        </nav>

        <div className="bp-nav-actions">
          {user ? (
            <details className="bp-account-dropdown">
              <summary className="bp-account">
                <span className="bp-avatar">{user.firstName[0]}</span>
                <span className="bp-account-label">Account</span>
                <span className="bp-chevron">⌄</span>
              </summary>

              <div className="bp-account-menu">
                <p className="bp-menu-heading">
                  {user.firstName} {user.lastName}
                </p>

                {user.role === 'customer' && (
                  <>
                    <Link to="/account" className="bp-menu-item">
                      <span>♙</span> My Profile
                    </Link>
                    <Link to="/account" className="bp-menu-item">
                      <span>▣</span> My Bookings
                    </Link>
                    <Link to="/account" className="bp-menu-item">
                      <span>⚙</span> Account Settings
                    </Link>
                  </>
                )}

                {user.role === 'vendor' && (
                  <Link to="/vendor" className="bp-menu-item">
                    <span>▣</span> Vendor dashboard
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link to="/admin" className="bp-menu-item">
                    <span>▣</span> Admin dashboard
                  </Link>
                )}

                <div className="bp-menu-divider" />

                <button className="bp-menu-item" type="button" onClick={logout}>
                  <span>↪</span> Log Out
                </button>
              </div>
            </details>
          ) : (
            <Link className="bp-login-link" to="/login">Log in</Link>
          )}
        </div>
      </header>


    <section className="bp-hero">
        <div className="bp-hero-content">
          <p className="bp-hero-eyebrow">
            DISCOVER BOHOL, YOUR WAY
          </p>

          <h1>
            The island is yours.
            <br />
            <em>Find your ride.</em>
          </h1>

          <p className="bp-hero-description">
            From coastal escapes to hidden gems, find the
            perfect car or motorcycle for your Bohol adventure.
          </p>

          <a className="bp-hero-cta" href="#fleet">
            Explore the fleet <span>→</span>
          </a>

          <div className="bp-hero-note">
            <span className="bp-hero-dot" />
            YOUR JOURNEY STARTS IN BOHOL
          </div>
        </div>

        
          <div className="bp-hero-visual">
            <div
              key={heroIndex}
              className="bp-hero-image"
              style={{
                backgroundImage: `linear-gradient(0deg, rgba(24, 20, 22, 0.4), transparent 40%), url("${heroSlides[heroIndex].image}")`,
              }}
            />

            {/* LEFT BUTTON (passing left)*/}
             <button
                className="bp-hero-arrow bp-hero-arrow-left"
                    onClick={() =>
                      setHeroIndex((current) =>
                        (current - 1 + heroSlides.length) % heroSlides.length
                      )
                    }
                    aria-label="Previous slide"
                  >
                  &#8592; 
              </button>

              {/* RIGHT BUTTON (passing right) */}
              <button
                className="bp-hero-arrow bp-hero-arrow-right"
                onClick={() =>
                  setHeroIndex((current) =>
                    (current + 1) % heroSlides.length
                  )
                }
                aria-label="Next slide"
              >
              &#8594;
            </button>


            <div className="bp-hero-image-caption">
                <span>{heroSlides[heroIndex].location}</span>
                <span>{heroSlides[heroIndex].caption}</span>
              </div>

            <div className="bp-hero-indicators">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.location}
                  className={`bp-hero-indicator ${
                    index === heroIndex ? 'active' : ''
                  }`}
                  onClick={() => setHeroIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === heroIndex ? 'true' : undefined}
                />
              ))}
            </div>
          </div>
      </section>

      <section className="bp-search" aria-label="Search rides">
        <label>
          Pickup location
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="All">All branches</option>
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
              <button className="bp-btn" 
              onClick={resetAll}>Reset filters</button>
            </div>
          ) : (
            <div className="bp-grid">
              {results.map((v) => (
                <article key={v.id} className="bp-card">
                  <div className="bp-photo">
                    <span className="bp-emoji">{v.emoji}</span>
                    <img
                      src={v.image}
                      alt={`${v.brand} ${v.model}`}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                    {v.badge && <span className="bp-badge">{v.badge}</span>}
                  </div>

                  <div className="bp-info">
                    <div className="bp-meta">
                      <span>{v.kind} · {v.style}</span>
                      <span>★ {v.rating}</span>
                    </div>
                    <h3>{v.brand} {v.model}</h3>
                    <p className="bp-specs">
                      {v.transmission} · {v.seats} seats · {v.fuel}
                    </p>
                    <p className="bp-specs">🏪 {v.shop}</p>
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

                    {v.available ? (
                      <Link className="bp-btn full" to={`/vehicles/${v.id}`}>Book this ride</Link>
                    ) : (
                      <button className="bp-btn full" disabled>Booked</button>
                    )}
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