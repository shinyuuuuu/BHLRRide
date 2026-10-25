import { useState } from "react";

// makeshit vehicle condition logs (before/after rental)
// later requests sa laravel be 

const KEY = 'bhlrride-condition-logs'

const read = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY))
        if(Array.isArray(saved))
            return saved
    } catch {
        // ignore ignore ignore
    }
    return []
}

export function useConditionLogs() {
    const[logs, setLogs] = useState(read)

    const addLog = (log) => {
        const next = [log, ...log]
        setLogs(next)
        try {
            localStorage.setItem(KEY, JSON.stringify(next))
        } catch {
            // ignore ignore ignore 
        }
    }

    return { logs, addLog}
}