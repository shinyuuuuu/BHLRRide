import { useState } from "react"

// MAKESHIFT REVIEWS RECORDS FOR THE DEMO. MAKESHIFT!!
// later becomes requests to the laravel backend (inag connect REVIEW TABLE POTPOT)

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


export function useReviews() {
    const [reviews, setReviews] = useState(read)

    const addReview = (review) => {
        const next = [review, ...reviews]
        setReviews(next)

        try {
            localStorage.setItem(KEY, JSON.stringify(next))
        } catch {
            // ignore ignore ignore
        }
    }

    return { reviews, addReview }
}