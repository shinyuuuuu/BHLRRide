import { useCallback, useEffect, useState } from 'react'
import { bookings as seed } from './bookings.js'
import { api } from '../api.js'
import { useAuth } from '../auth/auth.js'

// Bookings now live in the Laravel database (BOOKINGS table).
// - Logged-in real accounts: everything goes through /api/bookings.
// - Demo accounts (dev only): still use the browser, like before.
//
// Customers see their own bookings, vendors see bookings for their shop's
// vehicles, admins see all. The server decides, not this file.

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

// 'BK-12' -> '12'
const dbId = (id) => String(id).replace(/\D/g, '')

export function useBookings() {
  const { user } = useAuth()
  const isDemo = Boolean(user?.demo)
  const userId = user?.id

  const [bookings, setBookings] = useState(() => (isDemo ? read() : []))

  useEffect(() => {
    if (!userId || isDemo) return
    let cancelled = false
    api('/bookings')
      .then(({ bookings: list }) => {
        if (!cancelled) setBookings(list)
      })
      .catch(() => {
        // not logged in on the server, or backend unreachable
      })
    return () => { cancelled = true }
  }, [userId, isDemo])

  const save = (next) => {
    setBookings(next)
    write(next)
  }

  // Creates a booking. Throws an Error with a readable message if it fails.
  const addBooking = async (input) => {
    if (isDemo) {
      const booking = { id: 'BK-' + Date.now().toString().slice(-5), status: 'Pending', ...input }
      save([booking, ...bookings])
      return booking
    }

    const { booking } = await api('/bookings', {
      method: 'POST',
      body: { vehicleId: input.vehicleId, start: input.start, end: input.end },
    })
    setBookings((list) => [booking, ...list])
    return booking
  }

  // Changes a booking. Status changes (Approved / Cancelled / Completed) are saved
  // on the server. Other fields (reviewed, extension...) stay in the browser until
  // those features are connected too.
  const updateBooking = async (id, changes) => {
    const previous = bookings
    const next = bookings.map((b) => (b.id === id ? { ...b, ...changes } : b))

    if (isDemo) {
      save(next)
      return
    }

    setBookings(next)
    if (!changes.status) return

    try {
      const { booking } = await api(`/bookings/${dbId(id)}`, {
        method: 'PATCH',
        body: { status: changes.status },
      })
      setBookings((list) => list.map((b) => (b.id === id ? { ...b, ...booking } : b)))
    } catch (error) {
      setBookings(previous)
      window.alert(error.message)
    }
  }

  return { bookings, addBooking, updateBooking }
}

// Which dates are already taken for one vehicle. Public, no personal details.
export function useAvailability(vehicleId) {
  const [taken, setTaken] = useState([])

  const refresh = useCallback(() => {
    if (!vehicleId) return Promise.resolve()
    return api(`/vehicles/${vehicleId}/availability`)
      .then(({ taken: list }) => setTaken(list))
      .catch(() => {})
  }, [vehicleId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { taken, refresh }
}
