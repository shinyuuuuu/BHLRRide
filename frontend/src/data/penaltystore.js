import { useState } from 'react'

// makeshift penalty page 
// later becomes the penalty rules in the backend 
// (refer sa erd) oenaltystatus smthg sa penalty table ni

const KEY = 'bhlrride-penalty-rules'

const seed = [ // makeshift array for data
    { id: 1, name: 'Late return', type: 'Late return', amount: 500, unit: 'per day' },
    { id: 2, name: 'Minor damage (scratches, dents)', type: 'Damage', amount: 1000, unit: 'flat' },
    { id: 3, name: 'Major damage', type: 'Damage', amount: 5000, unit: 'flat' },
]

const read = () => {
    try {

        const saved = JSON.parse(localStorage.getItem(KEY))
        if(Array.isArray(saved))
            return saved
    } catch {
        // ignore ignore ignore
    }

    return seed 
}

export function usePenaltyRules() {
    const [rules, setRules] = useState(read)

    const save = (next) => {
        setRules(next) 
        try {
            localStorage.setItem(KEY, JSON.stringify(next))
        } catch {
            // ignore ignore ignore
        }
    }

   return {
    rules,
    addRule: (rule) =>
      save([...rules, { ...rule, id: Math.max(0, ...rules.map((r) => r.id)) + 1 }]),
    updateRule: (id, changes) =>
      save(rules.map((r) => (r.id === id ? { ...r, ...changes } : r))),
    removeRule: (id) => save(rules.filter((r) => r.id !== id)),
  }
}