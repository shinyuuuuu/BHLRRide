
import './App.css'

function App() {
  return (
    <div className="app">
      {/* Navigation */}
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-mark">B</span>
          <span>
            BHLR<span className="brand-gold">Ride</span>
          </span>
        </a>

        <nav className="nav-links">
          <a className="active" href="#vehicles">
            Browse fleet
            </a>
        </nav>

        <div className="nav-actions">
          <button 
          className="icon-button"
          aria-label="Notifications"
          title="Notifications"
          >
            ♧
          </button>

          <details className="account-dropdown">
            <summary
              className="account-trigger"
              aria-label="Open account menu"
              >
                <span className="account-avatar">S</span>
                <span className="account-label">Account</span>
                <span className="account-caret">▾</span>
              </summary>

              <div className="account-menu">
                <p className="account-menu-heading">My Account</p>

                <a href="#bookings" className="account-menu-item">
                  <span>▣</span> My Bookings</a>

                <a href="#saved" className="account-menu-item">
                  <span>♡</span> Saved Rides</a>

                <a href="#settings" className="account-menu-item">
                  <span>⚙</span> Account Settings</a>

                <div className="account-menu-divider"></div>

                <button 
                  className="account-menu-item logout-button"
                  type="button"
                >
                  <span>↪</span> Log Out
                </button>
              </div>
          </details>
        </div>
      </header>

      <main id="home">
        {/* Hero */}
        <section className="hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="hero-eyebrow">
              YOUR JOURNEY STARTS HERE
            </p>

            <h1>
              Great roads.
              <br />
              <span>Your next ride.</span>
            </h1>

            <p className="hero-description">
              Find the right car or motorcycle for your next
              adventure around Bohol.
            </p>

            <a className="hero-link" href="#vehicles">
              Explore the fleet <span>→</span>
            </a>
          </div>

          <div className="hero-caption">
            <span className="caption-line" />
            MADE FOR THE OPEN ROAD
          </div>
        </section>

        {/* Rental Search */}
        <section className="search-section">
          <div className="search-box">
            <div className="search-field">
              <label htmlFor="location">PICK-UP LOCATION</label>
              <select id="location" defaultValue="all">
                <option value="all">Anywhere in Bohol</option>
                <option value="tagbilaran">Tagbilaran City</option>
                <option value="panglao">Panglao</option>
                <option value="loboc">Loboc</option>
              </select>
            </div>

            <div className="search-field">
              <label htmlFor="pickup">PICK-UP DATE</label>
              <input id="pickup" type="date" />
            </div>

            <div className="search-field">
              <label htmlFor="return">RETURN DATE</label>
              <input id="return" type="date" />
            </div>

            <button
              className="search-button"
              onClick={() =>
                document.getElementById('vehicles')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }
            >
              Search rides <span>→</span>
            </button>
          </div>
        </section>

        {/* Vehicle browsing comes next */}
        <section className="placeholder-section" id="vehicles">
          <p className="section-eyebrow">THE COLLECTION</p>
          <h2>Your next ride awaits.</h2>
          <p>
            Our vehicle collection will appear here in the next step.
          </p>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home" aria-label="BHLRRide home">
            <img
              className="brand-logo"
              src="/BHLRRideLogo - Edited.png"
              alt="BHLRRide"
            />
          </a>
        <p>Find your ride. Make the journey yours.</p>
        <span className="footer-copy">© 2026 BHLRRide</span>
      </footer>
    </div>
  )
}

export default App
