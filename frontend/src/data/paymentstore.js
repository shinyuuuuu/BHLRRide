import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../auth/auth.js'

// Payments are handled by PayMongo (GCash, Maya, cards) and saved in the PAYMENTS table.
// - Paying sends the customer to PayMongo's secure page. We never see card details.
// - Demo accounts (dev only) still fake a payment in the browser, like before.

const KEY = 'bhlrride-payments'

const seed = [
{ id: 'PAY-0987', bookingId: 'BK-0987', amount: 1600, type: 'Full payment', method: 'GCash', date: '2026-09-01T09:30:00.000Z', status: 'Paid', receiptNumber: 'RC-20260901' },
{ id: 'PAY-0951', bookingId: 'BK-0951', amount: 7500, type: 'Full payment', method: 'Maya', date: '2026-08-11T14:10:00.000Z', status: 'Paid', receiptNumber: 'RC-20260811' },
]

const read = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY))
        if (Array.isArray(saved))
            return saved
    } catch {
        // ignore ignore ignore
    }

    return seed
}

const digits = (id) => String(id).replace(/\D/g, '')

export function usePayments() {
    const { user } = useAuth()
    const isDemo = Boolean(user?.demo)
    const userId = user?.id

    const [payments, setPayments] = useState(() => (isDemo ? read() : []))

    useEffect(() => {
        if (!userId || isDemo) return
        let cancelled = false
        api('/payments')
            .then(({ payments: list }) => {
                if (!cancelled) setPayments(list)
            })
            .catch(() => {
                // backend unreachable
            })
        return () => { cancelled = true }
    }, [userId, isDemo])

    // demo accounts only
    const addPayment = (payment) => {
        const next = [payment, ...payments]
        setPayments(next)

        try {
            localStorage.setItem(KEY, JSON.stringify(next))
        } catch {
            // ignore ignore ignore
        }
    }

    // Real accounts: sends the browser to PayMongo's page. Throws an Error if it can't start.
    const startPayment = async (bookingId, method) => {
        const { checkoutUrl } = await api(`/bookings/${digits(bookingId)}/pay`, {
            method: 'POST',
            body: { method },
        })
        window.location.href = checkoutUrl
    }

    // Called when the customer comes back from PayMongo.
    const verifyPayment = async (paymentId) => {
        const { payment } = await api(`/payments/${digits(paymentId)}/verify`, { method: 'POST' })
        if (payment.status === 'Paid') {
            setPayments((list) => [payment, ...list.filter((p) => p.id !== payment.id)])
        }
        return payment
    }

    return { payments, addPayment, startPayment, verifyPayment }
}
