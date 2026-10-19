import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)
export function useAuth() {
    return useContext(AuthContext)
}

// shortcut for the other pages. maoy mag ask ug "who is logged in?"
// user roles after logging in. so basically, if admin, then admin. if vendor kay vendor.

export function homeFor(role) {
    if (role === 'admin') return '/admin'
    if (role === 'vendor') return '/vendor'
    return '/browse'
}