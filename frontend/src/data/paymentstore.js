import { useState } from 'react'

// MAKESHIFT PAYMENT RECORDS 
// DEMO ONLY: no real payment happens and no card details are collected !!!! 
// mo request sa laravel once e connect na 

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

export function usePayments() {
    const [payments, setPayments] = useState(read)

    const addPayment = (payment) => {
        const next = [payment, ...payments]
        setPayments(next)

        try{
            localStorage.setItem(KEY, JSON.stringify(next))
        } catch {
            // ignore ignore ignore
        }
    } 

    return { payments, addPayment}
} 