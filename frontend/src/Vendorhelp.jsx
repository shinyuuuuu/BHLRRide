import { Link } from 'react-router-dom'
import { useAuth } from './auth/auth.js'
import './Vendorhelp.css'

const helpTopics = [
  {
    icon: '🚘',
    title: 'Managing vehicles',
    description: 'Learn how to add vehicles, update their details, and manage availability.',
    steps: [
      'Open My Vehicles from your vendor dashboard.',
      'Choose Add vehicle to register a vehicle.',
      'Use Edit to update details or change its status.',
    ],
  },
  {
    icon: '📋',
    title: 'Booking requests',
    description: 'Understand how to review and manage rental requests.',
    steps: [
      'Open Booking Requests.',
      'Review the vehicle and requested rental dates.',
      'Approve or reject pending requests after reviewing the details.',
    ],
  },
  {
    icon: '🛠️',
    title: 'Condition logs',
    description: 'Keep a record of vehicle condition before and after rentals.',
    steps: [
      'Open Condition Logs.',
      'Select the related booking.',
      'Record the odometer, fuel level, notes, and any damage.',
    ],
  },
  {
    icon: '💰',
    title: 'Rental earnings',
    description: 'Understand the earnings summary on your dashboard.',
    steps: [
      'Return to Overview.',
      'Check your completed rental earnings.',
      'Use booking records to review individual rental details.',
    ],
  },
]

function VendorHelp() {
  const { user } = useAuth()

  return (
    <div className="vh-page vd">
      <header className="vd-nav">
        <Link className="vd-brand" to="/vendor">
          BHLR<span> Ride</span> <small>Vendor Help</small>
        </Link>

        <Link className="vh-back" to="/vendor">
          ← Back to dashboard
        </Link>
      </header>

      <main className="vh-main">
        <section className="vh-hero">
          <p className="vh-eyebrow">BHLRRIDE SUPPORT</p>
          <h1>How can we help{user?.firstName ? `, ${user.firstName}` : ''}?</h1>
          <p>
            Find quick guidance for managing your rental business,
            vehicles, bookings, and condition records.
          </p>
        </section>

        <section className="vh-topics">
          <div className="vh-section-heading">
            <div>
              <h2>Vendor Help Center</h2>
              <p>Choose a topic to get started.</p>
            </div>
          </div>

          <div className="vh-grid">
            {helpTopics.map((topic) => (
              <article className="vh-card" key={topic.title}>
                <div className="vh-icon" aria-hidden="true">
                  {topic.icon}
                </div>
                <h3>{topic.title}</h3>
                <p className="vh-description">{topic.description}</p>

                <ol>
                  {topic.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="vh-contact">
          <div>
            <h2>Still need help?</h2>
            <p>
              If you encounter a problem that these guides don't cover,
              contact your BHLRRide administrator or support contact.
            </p>
          </div>
        </section>

        <div className="vh-footer">
          <Link to="/vendor">← Return to Vendor Dashboard</Link>
        </div>
      </main>
    </div>
  )
}

export default VendorHelp
