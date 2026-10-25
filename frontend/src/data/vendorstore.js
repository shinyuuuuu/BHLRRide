import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../auth/auth.js'

// Vendor applications live in the Laravel database (ACCOUNTS + VENDORS tables).
// - Anyone can apply through "Become a vendor" (see Vendorsignup.jsx, it calls the API directly).
// - Admins see and decide applications through /api/admin/vendors.
// - Demo accounts (dev only) still use the browser and these sample records.

const KEY = 'bhlrride-vendors'

const seed = [  // makeshift data, used by demo accounts in dev only
    { id: 'VN-1001', businessName: 'Bohol Wheels', ownerFirst: 'Miguel', ownerLast: 'Torres', email: 'vendor@bhlrride.test', phone: '0918 222 3344', street: 'CPG Avenue', city: 'Tagbilaran City', province: 'Bohol', status: 'Approved', appliedAt: '2026-08-02T08:00:00.000Z', decidedAt: '2026-08-03T08:00:00.000Z', decidedBy: 'Ana Villanueva' },
    { id: 'VN-1002', businessName: 'Panglao Ride Hub', ownerFirst: 'Lena', ownerLast: 'Cruz', email: 'panglao@bhlrride.test', phone: '0920 111 2233', street: 'Alona Beach Road', city: 'Panglao', province: 'Bohol', status: 'Approved', appliedAt: '2026-08-10T08:00:00.000Z', decidedAt: '2026-08-11T08:00:00.000Z', decidedBy: 'Ana Villanueva' },
    { id: 'VN-1003', businessName: 'Loboc Riders', ownerFirst: 'Ramon', ownerLast: 'Bacalso', email: 'loboc@bhlrride.test', phone: '0921 444 5566', street: 'Poblacion', city: 'Loboc', province: 'Bohol', status: 'Approved', appliedAt: '2026-08-20T08:00:00.000Z', decidedAt: '2026-08-21T08:00:00.000Z', decidedBy: 'Ana Villanueva' },
    { id: 'VN-1004', businessName: 'Maribojoc Moto Rentals', ownerFirst: 'Joel', ownerLast: 'Acebes', email: 'joel@example.com', phone: '0922 333 7788', street: 'Poblacion', city: 'Maribojoc', province: 'Bohol', status: 'Pending', appliedAt: '2026-10-14T08:00:00.000Z' },
    { id: 'VN-1005', businessName: 'Island Hop Rentals', ownerFirst: 'Mia', ownerLast: 'Dagohoy', email: 'mia@example.com', phone: '0923 555 9900', street: 'Tawala Road', city: 'Panglao', province: 'Bohol', status: 'Pending', appliedAt: '2026-10-15T08:00:00.000Z' },
]

const read = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY))
        if(Array.isArray(saved))
            return saved
    } catch {
        // ignore ignore ignoer
    }

    return seed
}

const write = (list) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(list))
    } catch {
        // ignore ignore ignore
    }
}

// plain function used by the demo login code (dev only)
export const readVendors = read

export function useVendors() {
    const { user } = useAuth()
    const isDemo = Boolean(user?.demo)
    const isAdmin = user?.role === 'admin'
    const userId = user?.id

    const [vendors, setVendors] = useState(() => (isDemo ? read() : []))

    useEffect(() => {
        if (!isAdmin || isDemo || !userId) return
        let cancelled = false
        api('/admin/vendors')
            .then(({ vendors: list }) => {
                if (!cancelled) setVendors(list)
            })
            .catch(() => {
                // not allowed or backend unreachable
            })
        return () => { cancelled = true }
    }, [isAdmin, isDemo, userId])

    const save = (next) => {
        setVendors(next)
        write(next)
    }

    return {
        vendors,

        // demo accounts only. Real applications go through the API (Vendorsignup.jsx)
        addVendor: (vendor) => save([vendor, ...vendors]),

        // Approve or reject. Throws an Error with a readable message if the server says no.
        updateVendor: async (id, changes) => {
            if (isDemo) {
                save(vendors.map((v) => (v.id === id ? { ...v, ...changes } : v)))
                return
            }
            const { vendor } = await api(`/admin/vendors/${String(id).replace(/\D/g, '')}`, {
                method: 'PATCH',
                body: { status: changes.status },
            })
            setVendors((list) => list.map((v) => (v.id === id ? vendor : v)))
        },
    }
}
