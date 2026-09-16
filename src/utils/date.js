/**
 * Date utility functions for the daily tracker.
 */

/** Returns 'YYYY-MM-DD' for a Date object (local time). */
export function formatDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns a Date object from a 'YYYY-MM-DD' string. */
export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Returns today's date key. */
export function todayKey() {
  return formatDateKey(new Date())
}

/** Adds days to a date and returns the new date key. */
export function addDaysKey(key, n) {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + n)
  return formatDateKey(date)
}

/** Formats a date key for display, e.g. "Mon, Sep 15". */
export function prettyDate(key) {
  const date = parseDateKey(key)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Full pretty date, e.g. "Monday, September 15, 2025". */
export function fullPrettyDate(key) {
  const date = parseDateKey(key)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Returns the last N days as date keys, oldest first. */
export function lastNDays(n) {
  const days = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(formatDateKey(d))
  }
  return days
}

/** Checks if a date key is today. */
export function isToday(key) {
  return key === todayKey()
}
