import { useState } from 'react'
import { FREQUENCY_LABELS, WEEKDAY_NAMES } from '../utils/schedule'

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export default function ScheduledTasks({ scheduledTasks, setScheduledTasks, days }) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [frequency, setFrequency] = useState('daily')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [dayOfMonth, setDayOfMonth] = useState(1)

  const addScheduled = () => {
    const trimmed = title.trim()
    if (!trimmed) return

    const task = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      title: trimmed,
      priority,
      frequency,
      dayOfWeek: frequency === 'weekly' ? Number(dayOfWeek) : null,
      dayOfMonth: frequency === 'monthly' ? Number(dayOfMonth) : null,
    }

    setScheduledTasks([...scheduledTasks, task])
    setTitle('')
    setPriority('medium')
    setFrequency('daily')
    setShowForm(false)
  }

  const deleteScheduled = (id) => {
    setScheduledTasks(scheduledTasks.filter((t) => t.id !== id))
  }

  const getScheduleText = (task) => {
    if (task.frequency === 'daily') return 'Every day'
    if (task.frequency === 'weekly') return `Every ${WEEKDAY_NAMES[task.dayOfWeek]}`
    if (task.frequency === 'monthly') return `On day ${task.dayOfMonth} of each month`
    return ''
  }

  const priorityColor = (p) => {
    if (p === 'high') return '#ef4444'
    if (p === 'medium') return '#f59e0b'
    return '#10b981'
  }

  return (
    <div className="view scheduled-view">
      <div className="view-header">
        <div>
          <h2 className="view-title">Scheduled Tasks</h2>
          <p className="view-subtitle">Recurring tasks that auto-add to your daily list</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Scheduled Task'}
        </button>
      </div>

      {showForm && (
        <div className="scheduled-form">
          <div className="form-row">
            <input
              type="text"
              className="task-input"
              placeholder="Task title (e.g., Review pull requests)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addScheduled()}
              autoFocus
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {frequency === 'weekly' && (
              <div className="form-field">
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
            {frequency === 'monthly' && (
              <div className="form-field">
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
            <button className="btn-primary" onClick={addScheduled}>
              Save
            </button>
          </div>
        </div>
      )}

      {scheduledTasks.length === 0 ? (
        <div className="empty-state">
          <p>No scheduled tasks yet. Create one to have it auto-added to your daily list.</p>
        </div>
      ) : (
        <div className="scheduled-list">
          {scheduledTasks.map((task) => (
            <div key={task.id} className="scheduled-card">
              <div className="scheduled-card-header">
                <span
                  className="priority-dot"
                  style={{ backgroundColor: priorityColor(task.priority) }}
                ></span>
                <span className="scheduled-title">{task.title}</span>
                <span className="badge">{getScheduleText(task)}</span>
                <span
                  className="priority-label"
                  style={{
                    color: priorityColor(task.priority),
                    backgroundColor:
                      task.priority === 'high'
                        ? '#fef2f2'
                        : task.priority === 'medium'
                          ? '#fffbeb'
                          : '#ecfdf5',
                  }}
                >
                  {task.priority}
                </span>
                <button className="btn-icon" onClick={() => deleteScheduled(task.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
