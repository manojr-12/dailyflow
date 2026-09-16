import { useState, useEffect } from 'react'
import { formatDateKey, parseDateKey, todayKey } from '../utils/date'
import { WEEKDAY_NAMES } from '../utils/schedule'

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const REPEAT_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Generate time options in 15-min increments
const TIME_OPTIONS = (() => {
  const options = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      options.push(`${hh}:${mm}`)
    }
  }
  return options
})()

function formatTimeLabel(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function Calendar({ selectedDateKey, onSelect }) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseDateKey(selectedDateKey)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const today = todayKey()

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, otherMonth: true, key: `prev-${i}` })
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = formatDateKey(new Date(year, month, d))
    cells.push({
      day: d,
      otherMonth: false,
      key: dateKey,
      dateKey,
      isToday: dateKey === today,
      isSelected: dateKey === selectedDateKey,
    })
  }
  // Next month leading days to fill the grid
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, otherMonth: true, key: `next-${d}` })
  }

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1))

  return (
    <div className="calendar">
      <div className="calendar-header">
        <span className="calendar-month-label">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">
            ‹
          </button>
          <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">
            ›
          </button>
        </div>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAY_SHORT.map((wd) => (
          <span key={wd} className="calendar-weekday">
            {wd}
          </span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          if (cell.otherMonth) {
            return (
              <span key={cell.key} className="calendar-day other-month">
                {cell.day}
              </span>
            )
          }
          return (
            <button
              key={cell.key}
              className={`calendar-day ${cell.isSelected ? 'selected' : ''} ${cell.isToday ? 'is-today' : ''}`}
              onClick={() => onSelect(cell.dateKey)}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AddTaskModal({ open, onClose, onAddTask, onAddScheduled, selectedDate }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dateKey, setDateKey] = useState(selectedDate || todayKey())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [repeat, setRepeat] = useState('none')
  const [dayOfWeek, setDayOfWeek] = useState(() => parseDateKey(selectedDate || todayKey()).getDay())
  const [dayOfMonth, setDayOfMonth] = useState(() => parseDateKey(selectedDate || todayKey()).getDate())

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setTitle('')
      setPriority('medium')
      const initialDate = selectedDate || todayKey()
      setDateKey(initialDate)
      setStartTime('09:00')
      setEndTime('10:00')
      setRepeat('none')
      setDayOfWeek(parseDateKey(initialDate).getDay())
      setDayOfMonth(parseDateKey(initialDate).getDate())
    }
  }, [open, selectedDate])

  // Update dayOfWeek/dayOfMonth when date changes (for recurring defaults)
  useEffect(() => {
    const d = parseDateKey(dateKey)
    setDayOfWeek(d.getDay())
    setDayOfMonth(d.getDate())
  }, [dateKey])

  if (!open) return null

  const parsedDate = parseDateKey(dateKey)
  const dateDisplay = `${parsedDate.getDate()} ${MONTH_NAMES[parsedDate.getMonth()].slice(0, 3)} ${parsedDate.getFullYear()}`

  const handleApply = () => {
    const trimmed = title.trim()
    if (!trimmed) return

    if (repeat === 'none') {
      // One-time task: add directly to the selected date
      onAddTask({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        title: trimmed,
        priority,
        done: false,
        dateKey,
        startTime,
        endTime,
      })
    } else {
      // Recurring task: add to scheduled tasks
      onAddScheduled({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        title: trimmed,
        priority,
        frequency: repeat,
        dayOfWeek: repeat === 'weekly' ? Number(dayOfWeek) : null,
        dayOfMonth: repeat === 'monthly' ? Number(dayOfMonth) : null,
        startTime,
        endTime,
        startDate: dateKey,
      })
    }

    onClose()
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Task</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <input
            type="text"
            className="modal-task-input"
            placeholder="Task title (e.g., Review pull requests)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            autoFocus
          />

          <div className="modal-section-label">Choose date and time</div>

          <Calendar selectedDateKey={dateKey} onSelect={setDateKey} />

          <div className="modal-divider" />

          <div className="modal-datetime-row">
            <span className="modal-date-display">{dateDisplay}</span>
            <div className="modal-time-pickers">
              <div className="modal-time-field">
                <label>Start time</label>
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {formatTimeLabel(t)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-time-field">
                <label>End time</label>
                <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {formatTimeLabel(t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-repeat-row">
            <span className="modal-repeat-label">Repeat</span>
            <select
              className="modal-repeat-select"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            >
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {repeat === 'weekly' && (
            <div className="modal-repeat-config">
              <label>Day of week</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                {WEEKDAY_NAMES.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {repeat === 'monthly' && (
            <div className="modal-repeat-config">
              <label>Day of month</label>
              <select value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="modal-priority-row">
            <span className="modal-repeat-label">Priority</span>
            <select
              className="modal-repeat-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn-apply" onClick={handleApply} disabled={!title.trim()}>
            Apply
          </button>
        </div>
      </div>
    </>
  )
}
