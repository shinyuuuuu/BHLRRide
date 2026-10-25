
import { useMemo, useState } from 'react'
import './Availabilitycalendar.css'


// Used to scratch out existing dates nga naay bookings. Mo apply on individual rides

const pad = (n) => String(n).padStart(2, '0')

const toISO = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const fromISO = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const addDays = (value, amount) => {
  const date = fromISO(value)
  date.setDate(date.getDate() + amount)
  return toISO(date)
}

const monthLabel = (date) =>
  date.toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  })

export default function AvailabilityCalendar({
  vehicleId,
  bookings,
  start,
  end,
  onStartChange,
  onEndChange,
  minDate,
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = fromISO(start || minDate)
    return new Date(initial.getFullYear(), initial.getMonth(), 1)
  })

  // DEMO DATA: sourced from the existing local booking store.
  // Later, replace this input with bookings returned by Laravel.
  const unavailable = useMemo(() => {
    const dates = new Set()

    bookings
      .filter(
        (booking) =>
          Number(booking.vehicleId) === Number(vehicleId) &&
          ['Pending', 'Approved', 'Confirmed', 'Ongoing'].includes(
            booking.status,
          ),
      )
      .forEach((booking) => {
        // The return date is available for the next rental.
        for (
          let date = booking.start;
          date < booking.end;
          date = addDays(date, 1)
        ) {
          dates.add(date)
        }
      })

    return dates
  }, [bookings, vehicleId])

  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]

  const isBlocked = (date) => {
    if (date < minDate || unavailable.has(date)) return true

    // Do not allow a rental range to pass through a booked day.
    if (start && !end && date > start) {
      return [...unavailable].some(
        (bookedDate) => bookedDate >= start && bookedDate < date,
      )
    }

    return false
  }

  const chooseDate = (date) => {
    if (isBlocked(date)) return

    if (!start || end || date <= start) {
      onStartChange(date)
      onEndChange('')
      return
    }

    const rangeHasConflict = [...unavailable].some(
      (bookedDate) => bookedDate >= start && bookedDate < date,
    )

    if (rangeHasConflict) return
    onEndChange(date)
  }

  const previousMonth = () => {
    setVisibleMonth(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setVisibleMonth(new Date(year, month + 1, 1))
  }

  return (
    <section className="availability-calendar">
      <div className="availability-heading">
        <button type="button" onClick={previousMonth} aria-label="Previous month">
          ‹
        </button>
        <strong>{monthLabel(visibleMonth)}</strong>
        <button type="button" onClick={nextMonth} aria-label="Next month">
          ›
        </button>
      </div>

      <p className="availability-instructions">
        Choose your pick-up date, then your return date.
      </p>

      <div className="availability-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <span className="availability-weekday" key={day}>
            {day}
          </span>
        ))}

        {days.map((day, index) => {
          if (day === null) {
            return <span className="availability-empty" key={`empty-${index}`} />
          }

          const date = toISO(new Date(year, month, day))
          const blocked = isBlocked(date)
          const selected = date === start || date === end
          const inRange = start && end && date > start && date < end

          return (
            <button
              type="button"
              key={date}
              className={[
                'availability-day',
                blocked ? 'is-unavailable' : '',
                selected ? 'is-selected' : '',
                inRange ? 'is-in-range' : '',
              ].filter(Boolean).join(' ')}
              disabled={blocked}
              onClick={() => chooseDate(date)}
              aria-label={`${date}${blocked ? ', unavailable' : ''}`}
              aria-pressed={selected}
              title={blocked ? 'Unavailable for this vehicle' : date}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="availability-legend">
        <span><i className="legend-dot booked" /> Unavailable</span>
        <span><i className="legend-dot selected" /> Selected</span>
      </div>

      <p className="availability-selection">
        <strong>Pick-up:</strong> {start || 'Not selected'}
        {' · '}
        <strong>Return:</strong> {end || 'Not selected'}
      </p>
    </section>
  )
}
