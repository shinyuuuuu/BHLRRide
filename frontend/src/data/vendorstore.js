import { useState } from "react"

// MAKESHIFT VENDOR RECORDS FOR THE DEMO. 
// same process with other websites, a vendor can apply to become a vendor through "Become a vendor"
// demo only: ag passwords used. 
// becomes a requests to the laravel backend (ACCOUNT + VENDOR TABLE) with hashed pass
// uses status (enum pero named status sa erd)

// !! VENDORSTORE


const KEY = 'bhlrride-vendors'

const seed = [  // makeshift data 
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

// plain function para ma check sa login code ag applications (submissions)

export const readVendors = read

export function useVendors() {
    const [vendors, setVendors] = useState(read)

    const save = (next) => {
        setVendors(next)
        write(next)
    }

    return {
        vendors,
        addVendor: (vendor) => save([vendor, ...vendors]),
        updateVendor: (id, changes) => 
            save(vendors.map((v) => (v.id === id ? {...v, ...changes } : v))),
    }
}
