import { useState } from 'react'
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
    const [vehicles, setVehicles] = useState(read)

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