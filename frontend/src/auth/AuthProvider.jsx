import { useState } from 'react'
import { AuthContext } from './auth.js'
import { readVendors } from '../data/vendorstore.js'
import { cleanName, cleanEmail } from '../utils/text.js'


// TEMPORARY RANI. fake accounts for building during making nako
// When laravel backend is goods to go na, maoy tawgon here instead
// and demo accounts and passwords must be deleted before deploying !!

// onsa purpose ani: it remembers. kani ag mag hold sa logged-in users, emails, role, etc. etc.It saves the user in the browser, so a refresh doesn’t log you out.
// basically, think of this as the front desk nga maoy mag remember. (TO BE CHANGED WITH THE ACTUAL LARAVEL BE)


const demoAccounts = [
    { email: 'customer@bhlrride.test', password: 'demo1234', firstName: 'Sofia', middleName: 'Reyes', lastName: 'Dela Cruz', phone: '0917 123 4567', role: 'customer' },
    { email: 'vendor@bhlrride.test', password: 'demo1234', firstName: 'Miguel', middleName: '', lastName: 'Torres', phone: '0918 222 3344', role: 'vendor' },
    { email: 'admin@bhlrride.test', password: 'demo1234', firstName: 'Ana', middleName: '', lastName: 'Villanueva', phone: '0919 555 6677', role: 'admin' },
    { email: 'panglao@bhlrride.test', password: 'demo1234', firstName: 'Lena', middleName: '', lastName: 'Cruz', phone: '0920 111 2233', role: 'vendor', shop: 'Panglao Ride Hub' },
    { email: 'loboc@bhlrride.test', password: 'demo1234', firstName: 'Ramon', middleName: '', lastName: 'Bacalso', phone: '0921 444 5566', role: 'vendor', shop: 'Loboc Riders' },
]


const KEY = 'bhlrride-user'


export function AuthProvider ({ children }) {
    const[user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(KEY))
        } catch {
            return null
        }
    })

    const save = (next) => {
        setUser(next) 
        try {
            if (next) localStorage.setItem(KEY, JSON.stringify(next))
                else localStorage.removeItem(KEY)
        } catch {
            // storage unavailable kay e ignore
        }
    }



// !! LOGIN 
const login = (email, password) => {
  const clean = email.trim().toLowerCase()

  const found = demoAccounts.find((a) => a.email === clean && a.password === password)
  if (found) {
    const safe = { ...found }
    delete safe.password
    save(safe)
    return { ok: true }
  }

    // Vendors who applied through "Become a vendor"
    const application = readVendors().find((v) => v.email === clean && v.password === password)
    if (application) {
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
        })
        return { ok: true }
    }

    return { ok: false, error: 'Incorrect email or password.' }
    }



    // !! SIGNUP 
    const signup = (data) => {
        const email = cleanEmail(data.email)
        if (demoAccounts.some((a) => a.email === email)) {
            return {ok: false, error: 'That email is already registered.'}
        }

        save({
            email,
            firstName: cleanName(data.email),
            middleName: cleanName(data.middleName),
            lastName: cleanName(data.lastName),
            phone: data.phone.trim(),
            role: 'customer',
        })
        return { ok: true }
    }



    // !! LOGOUT 
    const logout = () => save(null) 

    return (
        <AuthContext.Provider value={{ user, login, signup, logout }}>
            {children}
            </AuthContext.Provider>
    )
}