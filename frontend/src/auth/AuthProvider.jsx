import { useEffect, useRef, useState } from 'react'
import { AuthContext } from './auth.js'
import { readVendors } from '../data/vendorstore.js'
import { cleanName, cleanEmail } from '../utils/text.js'
import { api } from '../api.js'


// TEMPORARY RANI. fake accounts for building during making nako
// When laravel backend is goods to go na, maoy tawgon here instead
// and demo accounts and passwords must be deleted before deploying !!

// onsa purpose ani: it remembers. kani ag mag hold sa logged-in users, emails, role, etc. etc.It saves the user in the browser, so a refresh doesn’t log you out.
// basically, think of this as the front desk nga maoy mag remember. (TO BE CHANGED WITH THE ACTUAL LARAVEL BE)


// Demo logins only exist while developing (npm run dev). The live site
// uses real accounts from the database. To show them on a live build
// (e.g. for a class demo) set VITE_DEMO=true when building.
const DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true'

const demoAccounts = !DEMO ? [] : [
    { email: 'customer@bhlrride.test', password: 'demo1234', firstName: 'Sofia', middleName: 'Reyes', lastName: 'Dela Cruz', phone: '0917 123 4567', role: 'customer' },
    { email: 'vendor@bhlrride.test', password: 'demo1234', firstName: 'Miguel', middleName: '', lastName: 'Torres', phone: '0918 222 3344', role: 'vendor' },
    { email: 'admin@bhlrride.test', password: 'demo1234', firstName: 'Ana', middleName: '', lastName: 'Villanueva', phone: '0919 555 6677', role: 'admin' },
    { email: 'panglao@bhlrride.test', password: 'demo1234', firstName: 'Lena', middleName: '', lastName: 'Cruz', phone: '0920 111 2233', role: 'vendor', shop: 'Panglao Ride Hub' },
    { email: 'loboc@bhlrride.test', password: 'demo1234', firstName: 'Ramon', middleName: '', lastName: 'Bacalso', phone: '0921 444 5566', role: 'vendor', shop: 'Loboc Riders' },
]


const KEY = 'bhlrride-user'


export function AuthProvider ({ children }) {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(KEY))
        } catch {
            return null
        }
    })

    const userRef = useRef(user)
    userRef.current = user

    const save = (next) => {
        setUser(next)
        try {
            if (next) localStorage.setItem(KEY, JSON.stringify(next))
            else localStorage.removeItem(KEY)
        } catch {
            // storage unavailable kay e ignore
        }
    }

    // On load, ask Laravel who is really logged in (the server session is the truth).
    useEffect(() => {
        let cancelled = false
        api('/me')
            .then(({ user: serverUser }) => {
                if (cancelled) return
                if (serverUser) save(serverUser)
                else if (userRef.current && !userRef.current.demo) save(null)
            })
            .catch(() => {
                // backend not reachable: keep whatever we had
            })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    // !! LOGIN
    const login = async (email, password) => {
        const clean = email.trim().toLowerCase()

        const found = demoAccounts.find((a) => a.email === clean && a.password === password)
        if (found) {
            const safe = { ...found, demo: true }
            delete safe.password
            save(safe)
            return { ok: true }
        }

        // Real accounts come first: ask the server.
        try {
            const { user: account } = await api('/login', { method: 'POST', body: { email: clean, password } })
            save(account)
            return { ok: true }
        } catch (error) {
            // Only when the server says "wrong email or password" do we look at the old
            // browser-only vendor applications (demo mode). Any other answer is shown as is.
            if (!DEMO || error.status !== 422) {
                return { ok: false, error: error.message }
            }

            const application = readVendors().find((v) => v.email === clean && v.password === password)
            if (!application) {
                return { ok: false, error: error.message }
            }
            if (application.status === 'Pending') {
                return { ok: false, error: 'Your application is still waiting for admin approval.' }
            }
            if (application.status === 'Rejected') {
                return { ok: false, error: 'Your vendor application was not approved.' }
            }
            save({
                email: clean,
                firstName: application.ownerFirst,
                middleName: '',
                lastName: application.ownerLast,
                phone: application.phone,
                role: 'vendor',
                shop: application.businessName,
                demo: true,
            })
            return { ok: true }
        }
    }


    // !! SIGNUP
    const signup = async (data) => {
        try {
            const { user: account } = await api('/register', {
                method: 'POST',
                body: {
                    firstName: cleanName(data.firstName),
                    middleName: cleanName(data.middleName || ''),
                    lastName: cleanName(data.lastName),
                    email: cleanEmail(data.email),
                    phone: data.phone.trim(),
                    password: data.password,
                },
            })
            save(account)
            return { ok: true }
        } catch (error) {
            return { ok: false, error: error.message }
        }
    }


    // !! LOGOUT
    const logout = async () => {
        save(null)
        try {
            await api('/logout', { method: 'POST' })
        } catch {
            // already logged out on the server
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, updateUser: save }}>
            {children}
        </AuthContext.Provider>
    )
}