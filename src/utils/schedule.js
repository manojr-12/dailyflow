import { parseDateKey, formatDateKey } from './date'

/**
 * Checks if a scheduled task should appear on a given date.
 * @param {Object} scheduled - { id, title, priority, frequency, dayOfWeek, dayOfMonth }
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @returns {boolean}
 */
export function shouldTaskRunOnDate(scheduled, dateKey) {
  const date = parseDateKey(dateKey)
  const dow = date.getDay() // 0=Sun..6=Sat
  const dom = date.getDate()

  switch (scheduled.frequency) {
    case 'daily':
      return true
    case 'weekly':
      // dayOfWeek: 0=Sun..6=Sat, or null = every day
      if (scheduled.dayOfWeek === null || scheduled.dayOfWeek === undefined) return true
      return dow === scheduled.dayOfWeek
    case 'monthly':
      // dayOfMonth: 1-31, or null = every day
      if (scheduled.dayOfMonth === null || scheduled.dayOfMonth === undefined) return true
      // Handle months that don't have this day (e.g., day 31 in Feb)
      const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      if (scheduled.dayOfMonth > lastDayOfMonth) return false
      return dom === scheduled.dayOfMonth
    default:
      return false
  }
}

/**
 * Returns all scheduled tasks that should run on a given date.
 * @param {Array} scheduledTasks
 * @param {string} dateKey
 * @returns {Array}
 */
export function getScheduledTasksForDate(scheduledTasks, dateKey) {
  return (scheduledTasks || []).filter((s) => shouldTaskRunOnDate(s, dateKey))
}

/**
 * Generates task objects from scheduled tasks for a given date.
 * Avoids duplicates by checking existing task titles.
 * @param {Array} scheduledTasks
 * @param {string} dateKey
 * @param {Array} existingTasks - tasks already on that day
 * @returns {Array} new tasks to add
 */
export function generateTasksForDate(scheduledTasks, dateKey, existingTasks) {
  const due = getScheduledTasksForDate(scheduledTasks, dateKey)
  const existingTitles = new Set((existingTasks || []).map((t) => t.title))
  const newTasks = []

  for (const s of due) {
    // Skip if a task with the same title already exists for this day
    if (existingTitles.has(s.title)) continue

    newTasks.push({
      id: `sched-${s.id}-${dateKey}-${Math.random().toString(36).slice(2, 6)}`,
      title: s.title,
      priority: s.priority || 'medium',
      done: false,
      scheduledId: s.id,
    })
  }

  return newTasks
}

export const FREQUENCY_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
