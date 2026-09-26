import { useState } from 'react'
import { WEEKDAY_NAMES } from '../utils/schedule'

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const TASK_COLORS = [
  '#f45939', '#3b82f6', '#10b981', '#8b5cf6',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16',
]

export default function RecurringTasks({ scheduledTasks, setScheduledTasks }) {
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [editFrequency, setEditFrequency] = useState('daily')
  const [editDayOfWeek, setEditDayOfWeek] = useState(0)
  const [editDayOfMonth, setEditDayOfMonth] = useState(1)

  const startEdit = (task) => {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditPriority(task.priority || 'medium')
    setEditFrequency(task.frequency)
    setEditDayOfWeek(task.dayOfWeek ?? 0)
    setEditDayOfMonth(task.dayOfMonth ?? 1)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = (taskId) => {
    const trimmed = editTitle.trim()
    if (!trimmed) return
    setScheduledTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              title: trimmed,
              priority: editPriority,
              frequency: editFrequency,
              dayOfWeek: editFrequency === 'weekly' ? Number(editDayOfWeek) : null,
              dayOfMonth: editFrequency === 'monthly' ? Number(editDayOfMonth) : null,
            }
          : t
      )
    )
    setEditingId(null)
  }

  const deleteTask = (taskId) => {
    setScheduledTasks((prev) => prev.filter((t) => t.id !== taskId))
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
    <div className="view recurring-view">
      <div className="view-header">
        <div>
          <h2 className="view-title">Recurring Tasks</h2>
          <p className="view-subtitle">Manage your recurring tasks and their schedules</p>
        </div>
      </div>

      {scheduledTasks.length === 0 ? (
        <div className="empty-state">
          <p>No recurring tasks yet. Use the + button to create one with a repeat schedule.</p>
        </div>
      ) : (
        <div className="recurring-list">
          {scheduledTasks.map((task, idx) => {
            const color = TASK_COLORS[idx % TASK_COLORS.length]
            const isEditing = editingId === task.id

            return (
              <div key={task.id} className="recurring-card">
                {isEditing ? (
                  <div className="recurring-edit-form">
                    <input
                      type="text"
                      className="task-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                    />
                    <div className="recurring-edit-fields">
                      <div className="form-field">
                        <label>Priority</label>
                        <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                          {PRIORITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label>Frequency</label>
                        <select value={editFrequency} onChange={(e) => setEditFrequency(e.target.value)}>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      {editFrequency === 'weekly' && (
                        <div className="form-field">
                          <label>Day of week</label>
                          <select value={editDayOfWeek} onChange={(e) => setEditDayOfWeek(e.target.value)}>
                            {WEEKDAY_NAMES.map((d, i) => (
                              <option key={d} value={i}>{d}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {editFrequency === 'monthly' && (
                        <div className="form-field">
                          <label>Day of month</label>
                          <select value={editDayOfMonth} onChange={(e) => setEditDayOfMonth(e.target.value)}>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="recurring-edit-actions">
                      <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                      <button className="btn-primary" onClick={() => saveEdit(task.id)}>Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="recurring-card-header">
                      <span className="recurring-color-dot" style={{ backgroundColor: color }}></span>
                      <span
                        className="priority-indicator"
                        style={{ '--pcolor': priorityColor(task.priority) }}
                        title={`${task.priority} priority`}
                      ></span>
                      <span className="recurring-title">{task.title}</span>
                      <span className="badge">{getScheduleText(task)}</span>
                      <div className="recurring-actions">
                        <button className="btn-icon" onClick={() => startEdit(task)} title="Edit">
                          ✎
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => {
                            if (window.confirm(`Delete "${task.title}"?`)) deleteTask(task.id)
                          }}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
