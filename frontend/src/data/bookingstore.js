import { useState } from 'react'
import { bookings as seed } from './bookings.js'

// Makeshift booking storage for the demo.
// New bookings are kept in the browser so the Vehicle page and the Account page can share them.
// Later, this becomes requests to the Laravel backend (BOOKING table).
// subject to change once available na ag backend. 

const KEY = 'bhlrride-bookings'

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (Array.isArray(saved)) 
      return saved
  } catch {
    /* ignore */
  }
  return seed
}

const write = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export function useBookings() {
  const [bookings, setBookings] = useState(read)

  const save = (next) => {
    setBookings(next)
    write(next)
  }

  return {
    bookings,
    addBooking: (booking) => save([booking, ...bookings]),
    updateBooking: (id, changes) =>
      save(bookings.map((b) => (b.id === id ? { ...b, ...changes } : b))),
  }
}