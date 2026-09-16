import { useState } from 'react'
import { formatDateKey, parseDateKey, todayKey } from '../utils/date'
import { WEEKDAY_NAMES } from '../utils/schedule'

// Distinct colors for each recurring task
const TASK_COLORS = [
  '#f45939', // orange-red
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

function getYearWeeks(year) {
  // Build weeks starting from the first Sunday of the year (or last Sunday of prev year)
  const weeks = []
  const jan1 = new Date(year, 0, 1)
  const startDay = jan1.getDay() // 0=Sun..6=Sat
  const startDate = new Date(jan1)
  startDate.setDate(startDate.getDate() - startDay)

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  let current = new Date(startDate)
  while (current.getFullYear() <= year || (current.getFullYear() === year && current.getMonth() === 0)) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(current)
      week.push(cellDate)
      current.setDate(current.getDate() + 1)
    }
    // Stop if we've gone past today and past the year
    if (week[0] > today && week[0].getFullYear() > year) break
    weeks.push(week)
    if (current > today && current.getFullYear() > year) break
  }
  return weeks
}

function getIntensity(done, color) {
  if (!done) return { background: '#ebedf0', level: 0 }
  // Intensity levels based on completion
  if (done >= 3) return { background: color, level: 4, opacity: 1 }
  if (done >= 2) return { background: color, level: 3, opacity: 0.75 }
  if (done >= 1) return { background: color, level: 2, opacity: 0.5 }
  return { background: color, level: 1, opacity: 0.3 }
}

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function SingleTaskHeatmap({ task, days, color, year, onEdit, onDelete }) {
  const [tooltip, setTooltip] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editPriority, setEditPriority] = useState(task.priority || 'medium')
  const [editFrequency, setEditFrequency] = useState(task.frequency)
  const [editDayOfWeek, setEditDayOfWeek] = useState(task.dayOfWeek ?? 0)
  const [editDayOfMonth, setEditDayOfMonth] = useState(task.dayOfMonth ?? 1)
  const weeks = getYearWeeks(year)
  const today = todayKey()

  // Calculate stats for this task
  let activeDays = 0
  let currentStreak = 0
  let bestStreak = 0
  let tempStreak = 0

  // Collect all dates with this task completed
  const completedDates = new Set()
  for (const [dateKey, dayData] of Object.entries(days)) {
    const tasks = dayData?.tasks || []
    const hasTask = tasks.some(
      (t) => t.done && (t.scheduledId === task.id || t.title === task.title)
    )
    if (hasTask) {
      completedDates.add(dateKey)
      activeDays++
    }
  }

  // Calculate streaks from completed dates
  const sortedDates = [...completedDates].sort()
  for (let i = 0; i < sortedDates.length; i++) {
    if (i > 0) {
      const prev = parseDateKey(sortedDates[i - 1])
      const curr = parseDateKey(sortedDates[i])
      const diff = (curr - prev) / (1000 * 60 * 60 * 24)
      if (diff === 1) {
        tempStreak++
      } else {
        bestStreak = Math.max(bestStreak, tempStreak)
        tempStreak = 1
      }
    } else {
      tempStreak = 1
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak)

  // Current streak: count backwards from today
  const todayDate = parseDateKey(today)
  let checkDate = new Date(todayDate)
  while (completedDates.has(formatDateKey(checkDate))) {
    currentStreak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Month labels for the top
  const monthLabels = []
  let lastMonth = -1
  weeks.forEach((week, weekIdx) => {
    const firstDay = week[0]
    if (firstDay.getMonth() !== lastMonth && firstDay.getDate() <= 7) {
      monthLabels.push({ idx: weekIdx, label: MONTH_LABELS[firstDay.getMonth()] })
      lastMonth = firstDay.getMonth()
    }
  })

  const handleSaveEdit = () => {
    const trimmed = editTitle.trim()
    if (!trimmed) return
    onEdit(task.id, {
      title: trimmed,
      priority: editPriority,
      frequency: editFrequency,
      dayOfWeek: editFrequency === 'weekly' ? Number(editDayOfWeek) : null,
      dayOfMonth: editFrequency === 'monthly' ? Number(editDayOfMonth) : null,
    })
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(task.title)
    setEditPriority(task.priority || 'medium')
    setEditFrequency(task.frequency)
    setEditDayOfWeek(task.dayOfWeek ?? 0)
    setEditDayOfMonth(task.dayOfMonth ?? 1)
    setEditing(false)
  }

  return (
    <div className="task-heatmap-card">
      <div className="task-heatmap-header">
        <span className="task-heatmap-dot" style={{ backgroundColor: color }}></span>
        {editing ? (
          <input
            className="th-edit-input"
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
          />
        ) : (
          <span className="task-heatmap-title">{task.title}</span>
        )}
        <span className="task-heatmap-freq">{task.frequency}</span>
        {!editing && (
          <div className="th-actions">
            <button className="th-action-btn" onClick={() => setEditing(true)} title="Edit">
              ✎
            </button>
            <button
              className="th-action-btn th-delete-btn"
              onClick={() => {
                if (window.confirm(`Delete recurring task "${task.title}"?`)) {
                  onDelete(task.id)
                }
              }}
              title="Delete"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="th-edit-form">
          <div className="th-edit-row">
            <div className="th-edit-field">
              <label>Priority</label>
              <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="th-edit-field">
              <label>Frequency</label>
              <select value={editFrequency} onChange={(e) => setEditFrequency(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {editFrequency === 'weekly' && (
              <div className="th-edit-field">
                <label>Day of week</label>
                <select value={editDayOfWeek} onChange={(e) => setEditDayOfWeek(e.target.value)}>
                  {WEEKDAY_NAMES.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {editFrequency === 'monthly' && (
              <div className="th-edit-field">
                <label>Day of month</label>
                <select value={editDayOfMonth} onChange={(e) => setEditDayOfMonth(e.target.value)}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="th-edit-buttons">
            <button className="th-edit-cancel" onClick={handleCancelEdit}>
              Cancel
            </button>
            <button className="th-edit-save" onClick={handleSaveEdit}>
              Save
            </button>
          </div>
        </div>
      )}

      <div className="task-heatmap-stats">
        <div className="th-stat">
          <span className="th-stat-value" style={{ color }}>
            {currentStreak}
          </span>
          <span className="th-stat-label">Current Streak</span>
        </div>
        <div className="th-stat">
          <span className="th-stat-value" style={{ color }}>
            {bestStreak}
          </span>
          <span className="th-stat-label">Best Streak</span>
        </div>
        <div className="th-stat">
          <span className="th-stat-value" style={{ color }}>
            {activeDays}
          </span>
          <span className="th-stat-label">Active Days</span>
        </div>
      </div>

      <div className="task-heatmap-scroll">
        <div className="task-heatmap-month-labels">
          {weeks.map((_, weekIdx) => {
            const monthLabel = monthLabels.find((m) => m.idx === weekIdx)
            return (
              <span key={weekIdx} className="th-month-label">
                {monthLabel ? monthLabel.label : ''}
              </span>
            )
          })}
        </div>

        <div className="task-heatmap-body">
          <div className="task-heatmap-weekday-labels">
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i} className="th-weekday-label">
                {label}
              </span>
            ))}
          </div>
          <div className="task-heatmap-grid">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="th-week">
                {week.map((date) => {
                  const dateKey = formatDateKey(date)
                  const isCurrentYear = date.getFullYear() === year
                  const isFuture = date > new Date()
                  const dayData = days[dateKey]
                  const tasks = dayData?.tasks || []
                  const doneCount = tasks.filter(
                    (t) => t.done && (t.scheduledId === task.id || t.title === task.title)
                  ).length
                  const intensity = getIntensity(doneCount, color)

                  return (
                    <div
                      key={dateKey}
                      className="th-cell"
                      style={{
                        backgroundColor: doneCount > 0 ? intensity.background : '#ebedf0',
                        opacity: doneCount > 0 ? intensity.opacity : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (isCurrentYear && !isFuture) {
                          const rect = e.target.getBoundingClientRect()
                          setTooltip({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            date: dateKey,
                            count: doneCount,
                          })
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    ></div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="task-heatmap-legend">
        <span className="th-legend-text">Less</span>
        <div className="th-legend-cells">
          <div className="th-cell" style={{ backgroundColor: '#ebedf0' }}></div>
          <div className="th-cell" style={{ backgroundColor: color, opacity: 0.3 }}></div>
          <div className="th-cell" style={{ backgroundColor: color, opacity: 0.5 }}></div>
          <div className="th-cell" style={{ backgroundColor: color, opacity: 0.75 }}></div>
          <div className="th-cell" style={{ backgroundColor: color, opacity: 1 }}></div>
        </div>
        <span className="th-legend-text">More</span>
      </div>

      {tooltip && (
        <div
          className="th-tooltip"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <span>{tooltip.count} completed on {tooltip.date}</span>
        </div>
      )}
    </div>
  )
}

export default function TaskHeatmap({ scheduledTasks, setScheduledTasks, days }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const handleEdit = (taskId, updates) => {
    setScheduledTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    )
  }

  const handleDelete = (taskId) => {
    setScheduledTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  if (!scheduledTasks || scheduledTasks.length === 0) {
    return (
      <div className="dash-section">
        <h3 className="dash-section-title">Recurring Task Progress</h3>
        <div className="empty-state small">
          <p>No recurring tasks yet. Use the + button to create one with a repeat schedule.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-section">
      <div className="task-heatmap-section-header">
        <h3 className="dash-section-title">Recurring Task Progress</h3>
        <div className="heatmap-year-nav">
          <button onClick={() => setYear(year - 1)}>‹</button>
          <span>{year}</span>
          {year < currentYear && (
            <button onClick={() => setYear(year + 1)}>›</button>
          )}
        </div>
      </div>

      <div className="task-heatmap-list">
        {scheduledTasks.map((task, idx) => (
          <SingleTaskHeatmap
            key={task.id}
            task={task}
            days={days}
            color={TASK_COLORS[idx % TASK_COLORS.length]}
            year={year}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
