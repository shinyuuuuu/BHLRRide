import { useEffect, useState } from "react"
import { api } from '../api.js'
import { useAuth } from '../auth/auth.js'

// Reviews are saved in the REVIEWS table (one per finished booking).
// - Demo accounts (dev only) still use the browser.

const KEY = 'bhlrride-reviews'

const read = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY))
        if (Array.isArray(saved))
            return saved
    } catch {
        // ignore ignore ignore
    }

    return[]
}


// used by the Account page to submit a review. Throws an Error if the server says no.
export function useReviews() {
    const { user } = useAuth()
    const isDemo = Boolean(user?.demo)
    const [reviews, setReviews] = useState(() => (isDemo ? read() : []))

    const addReview = async (review) => {
        if (isDemo) {
            const next = [review, ...reviews]
            setReviews(next)

            try {
                localStorage.setItem(KEY, JSON.stringify(next))
            } catch {
                // ignore ignore ignore
            }
            return review
        }

        const { review: created } = await api('/reviews', {
            method: 'POST',
            body: { bookingId: review.bookingId, rating: review.rating, comment: review.comment },
        })
        setReviews((list) => [created, ...list])
        return created
    }

    return { reviews, addReview }
}


// used by the vehicle page: everyone's reviews for one vehicle
export function useVehicleReviews(vehicleId) {
    const [reviews, setReviews] = useState([])

    useEffect(() => {
        if (!vehicleId) return
        let cancelled = false
        api(`/vehicles/${vehicleId}/reviews`)
            .then(({ reviews: list }) => {
                if (!cancelled) setReviews(list)
            })
            .catch(() => {
                // backend unreachable
            })
        return () => { cancelled = true }
    }, [vehicleId])

    return { reviews }
}
