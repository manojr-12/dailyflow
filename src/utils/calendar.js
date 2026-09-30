import { formatDateKey, parseDateKey, todayKey } from './date.js'

const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

export const REMINDER_OPTIONS = [
  { value: 0, label: 'At start time' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
]

export function formatReminderLabel(value) {
  const minutes = Number(value ?? 10)
  return REMINDER_OPTIONS.find((option) => option.value === minutes)?.label || `${minutes} minutes before`
}

function escapeCalendarText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function formatLocalDateTime(dateKey, time) {
  return `${dateKey.replace(/-/g, '')}T${(time || '09:00').replace(':', '')}00`
}

function eventStartDate(task) {
  const start = parseDateKey(task.startDate || todayKey())

  if (task.frequency === 'weekly' && Number.isInteger(Number(task.dayOfWeek))) {
    const offset = (Number(task.dayOfWeek) - start.getDay() + 7) % 7
    start.setDate(start.getDate() + offset)
  }

  if (task.frequency === 'monthly' && Number.isInteger(Number(task.dayOfMonth))) {
    const requestedDay = Number(task.dayOfMonth)
    for (let monthOffset = 0; monthOffset < 24; monthOffset++) {
      const candidate = new Date(start.getFullYear(), start.getMonth() + monthOffset, requestedDay)
      if (candidate >= start && candidate.getDate() === requestedDay) {
        start.setTime(candidate.getTime())
        break
      }
    }
  }

  return formatDateKey(start)
}

function eventEndDate(startDateKey, startTime, endTime) {
  if ((endTime || '10:00') > (startTime || '09:00')) return startDateKey
  const date = parseDateKey(startDateKey)
  date.setDate(date.getDate() + 1)
  return formatDateKey(date)
}

function recurrenceRule(task) {
  if (task.frequency === 'weekly') {
    return `FREQ=WEEKLY;BYDAY=${WEEKDAY_CODES[Number(task.dayOfWeek) || 0]}`
  }
  if (task.frequency === 'monthly') {
    return `FREQ=MONTHLY;BYMONTHDAY=${Number(task.dayOfMonth) || 1}`
  }
  return 'FREQ=DAILY'
}

function utcTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function buildRecurringCalendar(tasks) {
  const events = (tasks || []).map((task) => {
    const startDate = eventStartDate(task)
    const startTime = task.startTime || '09:00'
    const endTime = task.endTime || '10:00'
    const endDate = eventEndDate(startDate, startTime, endTime)
    const reminderMinutes = Number(task.reminderMinutes ?? 10)
    const trigger = reminderMinutes === 0 ? 'PT0M' : `-PT${reminderMinutes}M`

    return [
      'BEGIN:VEVENT',
      `UID:${escapeCalendarText(task.id)}@dailyflow`,
      `DTSTAMP:${utcTimestamp()}`,
      `DTSTART:${formatLocalDateTime(startDate, startTime)}`,
      `DTEND:${formatLocalDateTime(endDate, endTime)}`,
      `RRULE:${recurrenceRule(task)}`,
      `SUMMARY:${escapeCalendarText(task.title)}`,
      'DESCRIPTION:Recurring task from DailyFlow',
      'BEGIN:VALARM',
      `TRIGGER:${trigger}`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeCalendarText(task.title)} reminder`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DailyFlow//Recurring Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function downloadRecurringCalendar(tasks, filename = 'dailyflow-recurring.ics') {
  if (!tasks?.length) return
  const blob = new Blob([buildRecurringCalendar(tasks)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
