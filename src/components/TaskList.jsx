import { prettyDate, fullPrettyDate, addDaysKey, isToday } from '../utils/date'

const PRIORITY_CONFIG = {
  high: { label: 'High', color: '#ef4444', bg: '#fee2e2' },
  medium: { label: 'Med', color: '#f59e0b', bg: '#fef3c7' },
  low: { label: 'Low', color: '#10b981', bg: '#d1fae5' },
}

export default function TaskList({ selectedDate, setSelectedDate, days, setDays }) {
  const dayData = days[selectedDate] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }
  const tasks = dayData.tasks || []

  const updateDay = (updates) => {
    setDays((prev) => ({
      ...prev,
      [selectedDate]: {
        ...(prev[selectedDate] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }),
        ...updates,
      },
    }))
  }

  const toggleTask = (id) => {
    updateDay({
      tasks: tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })
  }

  const deleteTask = (id) => {
    updateDay({ tasks: tasks.filter((t) => t.id !== id) })
  }

  const editTask = (id, title) => {
    updateDay({
      tasks: tasks.map((t) => (t.id === id ? { ...t, title } : t)),
    })
  }

  const carryOverPending = () => {
    const pending = tasks.filter((t) => !t.done)
    if (pending.length === 0) return
    const nextDay = addDaysKey(selectedDate, 1)
    const nextDayData = days[nextDay] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }
    const nextTasks = [...(nextDayData.tasks || []), ...pending]
    setDays((prev) => ({
      ...prev,
      [nextDay]: { ...nextDayData, tasks: nextTasks },
    }))
    updateDay({ tasks: tasks.filter((t) => t.done) })
  }

  const completedCount = tasks.filter((t) => t.done).length
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <div className="view tasks-view">
      <div className="view-header">
        <div>
          <h2 className="view-title">Tasks</h2>
          <p className="view-subtitle">{fullPrettyDate(selectedDate)}</p>
        </div>
        <div className="date-nav">
          <button onClick={() => setSelectedDate(addDaysKey(selectedDate, -1))}>Prev</button>
          {!isToday(selectedDate) && (
            <button onClick={() => setSelectedDate(addDaysKey(selectedDate, 1))}>Next</button>
          )}
          <button className="btn-today" onClick={() => setSelectedDate(addDaysKey(selectedDate, 0))}>
            Today
          </button>
        </div>
      </div>

      <div className="task-summary">
        <span className="badge">{tasks.length} total</span>
        <span className="badge badge-green">{completedCount} done</span>
        <span className="badge badge-orange">{tasks.length - completedCount} pending</span>
        <span className="badge badge-blue">{completionRate}% complete</span>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks yet. Tap the + button to add one.</p>
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => {
            const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
            return (
              <li key={task.id} className={`task-item ${task.done ? 'done' : ''}`}>
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                  />
                </label>
                <span
                  className="priority-dot"
                  style={{ backgroundColor: cfg.color }}
                  title={cfg.label}
                ></span>
                <input
                  type="text"
                  className="task-title-input"
                  value={task.title}
                  onChange={(e) => editTask(task.id, e.target.value)}
                />
                <span className="priority-label" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                  {cfg.label}
                </span>
                <button className="btn-icon btn-delete" onClick={() => deleteTask(task.id)} title="Delete">
                  Delete
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {tasks.some((t) => !t.done) && (
        <button className="btn-carry-over" onClick={carryOverPending}>
          Carry Over {tasks.filter((t) => !t.done).length} Pending Task(s) to {prettyDate(addDaysKey(selectedDate, 1))}
        </button>
      )}
    </div>
  )
}
