import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../auth/auth.js'
import { vehicles as seed } from './vehicles'

// Vehicles live in the Laravel database (VEHICLES table).
// - Everyone sees the list from /api/vehicles.
// - Approved vendors add / edit / remove their own vehicles through the API.
// - Demo accounts (dev only) still use the browser, like before.

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

// only the fields the server understands
const FIELDS = ['brand', 'model', 'plateNumber', 'kind', 'style', 'transmission', 'seats', 'fuel', 'rate', 'branch', 'image', 'badge', 'status']
const toApi = (vehicle) => {
    const body = {}
    FIELDS.forEach((key) => {
        if (vehicle[key] !== undefined) body[key] = vehicle[key]
    })
    return body
}

export function useVehicles() {
    const { user } = useAuth()
    const isDemo = Boolean(user?.demo)
    const userId = user?.id

    // While developing without the backend running, fall back to the sample list.
    const [vehicles, setVehicles] = useState(import.meta.env.DEV ? read : [])
    const [loading, setLoading] = useState(true)

    const load = () =>
        api('/vehicles')
            .then(({ vehicles: list }) => {
                setVehicles(list)
                setLoading(false)
            })
            .catch(() => {
                if (import.meta.env.DEV) setVehicles(read())
                setLoading(false)
            })

    // load once, and again when someone logs in or out (owners also get their plate numbers)
    useEffect(() => {
        let cancelled = false
        api('/vehicles')
            .then(({ vehicles: list }) => {
                if (cancelled) return
                setVehicles(list)
                setLoading(false)
            })
            .catch(() => {
                if (cancelled) return
                if (import.meta.env.DEV) setVehicles(read())
                setLoading(false)
            })
        return () => { cancelled = true }
    }, [userId])

    const save = (next) => {
        setVehicles(next)
        write(next)
    }

    // These three throw an Error with a readable message if the server says no.
    const addVehicle = async (vehicle) => {
        if (isDemo) {
            save([...vehicles, { ...vehicle, id: Math.max(0, ...vehicles.map((v) => v.id)) + 1 }])
            return
        }
        const { vehicle: created } = await api('/vehicles', { method: 'POST', body: toApi(vehicle) })
        setVehicles((list) => [...list, created])
    }

    const updateVehicles = async (id, changes) => {
        if (isDemo) {
            save(vehicles.map((v) => (v.id === id ? { ...v, ...changes } : v)))
            return
        }
        const { vehicle: updated } = await api(`/vehicles/${id}`, { method: 'PATCH', body: toApi(changes) })
        setVehicles((list) => list.map((v) => (v.id === id ? updated : v)))
    }

    const removeVehicle = async (id) => {
        if (isDemo) {
            save(vehicles.filter((v) => v.id !== id))
            return
        }
        await api(`/vehicles/${id}`, { method: 'DELETE' })
        setVehicles((list) => list.filter((v) => v.id !== id))
    }

    return {
        vehicles,
        loading,
        addVehicle,
        updateVehicles,
        removeVehicle,

        // go back to the original list (demo) / reload from the server (real accounts)
        resetVehicles: () => {
            if (!isDemo) {
                load()
                return
            }
            try {
                localStorage.removeItem(KEY)
            } catch {
                // ignore ignore ignore
            }

            setVehicles(seed)
        },
    }
}
