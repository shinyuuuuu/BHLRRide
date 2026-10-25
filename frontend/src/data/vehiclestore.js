import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { vehicles as seed } from './vehicles'

// makeshift vehicle storage (need it as I test while I work)
// vendors can add/edit in their dashboard, then browse page shows the same list. :)
// mo request sa backend once ma connect na to the db


// !! VEHICLE STORE

const KEY = 'bhlrride-vehicles'

const read = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY))

        if (Array.isArray(saved)) 
            return saved
    } catch {
        // ignores ignores ignores
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

export function useVehicles() {
    // The real list comes from Laravel. While developing without the backend
    // running, fall back to the sample list so the pages still work.
    const [vehicles, setVehicles] = useState(import.meta.env.DEV ? read : [])

    useEffect(() => {
        let cancelled = false
        api('/vehicles')
            .then(({ vehicles: list }) => {
                if (!cancelled) setVehicles(list)
            })
            .catch(() => {
                if (!cancelled && import.meta.env.DEV) setVehicles(read())
            })
        return () => { cancelled = true }
    }, [])

    const save = (next) => {
        setVehicles(next)
        write(next)
    }

    return {
        vehicles, 
        addVehicle: (vehicle) => 
            save([... vehicles, {...vehicle, id: Math.max(0, ...vehicles.map((v) => v.id)) + 1 }]),
        updateVehicles: (id, changes) => 
            save(vehicles.map((v) => (v.id === id ? { ...v, ...changes} : v ))),
        removeVehicle: (id) => save(vehicles.filter((v) => v.id !== id)),

        // go back to vehicle listing (after editing file)
        resetVehicles: () => {
            try {
                localStorage.removeItem(KEY)
            } catch {
                // ignore ignore ignore
            }

            setVehicles(seed)
        },
    }
}