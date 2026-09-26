import { useState } from 'react'
import { formatDateKey, parseDateKey, todayKey } from '../utils/date'

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

/**
 * Build the last `numWeeks` weeks ending at today (inclusive).
 * Each week is an array of 7 Date objects (Sun..Sat).
 * The last week contains today.
 */
function getLastNWeeks(numWeeks) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find the Sunday of the current week
  const sunday = new Date(today)
  sunday.setDate(sunday.getDate() - sunday.getDay())

  const weeks = []
  // Start from the Sunday that is numWeeks-1 weeks before the current week's Sunday
  const start = new Date(sunday)
  start.setDate(start.getDate() - (numWeeks - 1) * 7)

  let current = new Date(start)
  for (let w = 0; w < numWeeks; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(current)
      week.push(cellDate)
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

function getIntensity(done, color) {
  if (!done) return { background: '#ebedf0', level: 0 }
  if (done >= 3) return { background: color, level: 4, opacity: 1 }
  if (done >= 2) return { background: color, level: 3, opacity: 0.75 }
  if (done >= 1) return { background: color, level: 2, opacity: 0.5 }
  return { background: color, level: 1, opacity: 0.3 }
}

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function SingleTaskHeatmap({ task, days, color }) {
  const [tooltip, setTooltip] = useState(null)
  const weeks = getLastNWeeks(53) // ~1 year
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

  // Month labels for the top — detect month boundaries
  const monthLabels = []
  let lastMonth = -1
  weeks.forEach((week, weekIdx) => {
    const firstDay = week[0]
    if (firstDay.getMonth() !== lastMonth) {
      monthLabels.push({ idx: weekIdx, label: MONTH_LABELS[firstDay.getMonth()] })
      lastMonth = firstDay.getMonth()
    }
  })

  // Determine which weeks are the first week of a new month (for spacing)
  const monthStartWeeks = new Set(monthLabels.map((m) => m.idx))

  return (
    <div className="task-heatmap-card">
      <div className="task-heatmap-header">
        <span className="task-heatmap-dot" style={{ backgroundColor: color }}></span>
        <span className="task-heatmap-title">{task.title}</span>
        <span className="task-heatmap-freq">{task.frequency}</span>
      </div>

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
              <span
                key={weekIdx}
                className={`th-month-label ${monthStartWeeks.has(weekIdx) && weekIdx > 0 ? 'th-month-gap' : ''}`}
              >
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
              <div
                key={weekIdx}
                className={`th-week ${monthStartWeeks.has(weekIdx) && weekIdx > 0 ? 'th-week-month-start' : ''}`}
              >
                {week.map((date) => {
                  const dateKey = formatDateKey(date)
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
                        if (!isFuture) {
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

export default function TaskHeatmap({ scheduledTasks, days }) {
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
        <span className="th-range-label">Last 12 months</span>
      </div>

      <div className="task-heatmap-list">
        {scheduledTasks.map((task, idx) => (
          <SingleTaskHeatmap
            key={task.id}
            task={task}
            days={days}
            color={TASK_COLORS[idx % TASK_COLORS.length]}
          />
        ))}
      </div>
    </div>
  )
}
