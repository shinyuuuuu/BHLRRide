// for trimming, removing extra spaces, and capitalization of the first letter of each word.

export const cleanName = (s) =>
  s.trim().replace(/\s+/g, ' ').replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase())

export const cleanEmail = (s) => s.trim().toLowerCase()