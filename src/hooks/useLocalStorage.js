import { useState, useEffect } from 'react'

/**
 * Custom hook that syncs state to localStorage.
 * @param {string} key - localStorage key
 * @param {*} initialValue - initial value if nothing stored
 * @returns {[any, Function]} - [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable — silently ignore
    }
  }, [key, value])

  return [value, setValue]
}
