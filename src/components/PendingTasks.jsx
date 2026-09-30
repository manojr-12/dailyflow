import { useState } from 'react'
import { prettyDate, todayKey } from '../utils/date'

const PRIORITY_CONFIG = {
  high: { label: 'High', color: '#ef4444' },
  medium: { label: 'Med', color: '#f59e0b' },
  low: { label: 'Low', color: '#10b981' },
}

export default function PendingTasks({
  pendingTasks,
  setPendingTasks,
  setDays,
  setActiveView,
  setSelectedDate,
}) {
  const [selected, setSelected] = useState([])
  const availableIds = new Set(pendingTasks.map((task) => task.pendingId))
  const selectedIds = selected.filter((id) => availableIds.has(id))

  const toggleSelected = (pendingId) => {
    setSelected((current) =>
      current.includes(pendingId)
        ? current.filter((id) => id !== pendingId)
        : [...current, pendingId]
    )
  }

  const moveToToday = (pendingIds = selectedIds) => {
    if (pendingIds.length === 0) return
    const chosen = new Set(pendingIds)
    const today = todayKey()
    const tasksToMove = pendingTasks
      .filter((task) => chosen.has(task.pendingId))
      .map((task) => {
        const cleanTask = { ...task }
        delete cleanTask.pendingId
        delete cleanTask.pendingSince
        delete cleanTask.originalDate
        return {
          ...cleanTask,
          id: `${task.id}-moved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dateKey: today,
          done: false,
          movedFrom: task.originalDate,
        }
      })

    setDays((days) => {
      const todayData = days[today] || {
        tasks: [],
        journal: { worked: '', didntWork: '', improve: '' },
      }
      return {
        ...days,
        [today]: { ...todayData, tasks: [...(todayData.tasks || []), ...tasksToMove] },
      }
    })
    setPendingTasks((tasks) => tasks.filter((task) => !chosen.has(task.pendingId)))
    setSelected([])
  }

  const deleteSelected = () => {
    if (selectedIds.length === 0) return
    const chosen = new Set(selectedIds)
    setPendingTasks((tasks) => tasks.filter((task) => !chosen.has(task.pendingId)))
    setSelected([])
  }

  const openToday = () => {
    setSelectedDate(todayKey())
    setActiveView('tasks')
  }

  return (
    <div className="view pending-view">
      <div className="view-header">
        <div>
          <h2 className="view-title">Pending Tasks</h2>
          <p className="view-subtitle">Unfinished tasks from previous days</p>
        </div>
        <button className="btn-secondary" onClick={openToday}>View today</button>
      </div>

      {pendingTasks.length === 0 ? (
        <div className="empty-state">
          <p>No pending tasks. You are all caught up.</p>
        </div>
      ) : (
        <>
          <div className="pending-toolbar">
            <label className="pending-select-all">
              <input
                type="checkbox"
                checked={selectedIds.length === pendingTasks.length}
                onChange={() =>
                  setSelected(
                    selectedIds.length === pendingTasks.length
                      ? []
                      : pendingTasks.map((task) => task.pendingId)
                  )
                }
              />
              Select all
            </label>
            <span>{selectedIds.length} selected</span>
            <button className="btn-primary" disabled={selectedIds.length === 0} onClick={() => moveToToday()}>
              Move to Today
            </button>
            <button className="btn-secondary" disabled={selectedIds.length === 0} onClick={deleteSelected}>
              Delete
            </button>
          </div>

          <ul className="task-list">
            {pendingTasks.map((task) => {
              const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
              return (
                <li key={task.pendingId} className="task-item pending-task-item">
                  <label className="checkbox-wrapper" title="Select task">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(task.pendingId)}
                      onChange={() => toggleSelected(task.pendingId)}
                    />
                  </label>
                  <span
                    className="priority-indicator"
                    style={{ '--pcolor': cfg.color }}
                    title={`${cfg.label} priority`}
                  />
                  <div className="pending-task-copy">
                    <strong>{task.title}</strong>
                    <small>
                      {task.originalDate ? `From ${prettyDate(task.originalDate)}` : 'From a previous day'}
                    </small>
                  </div>
                  <button
                    className="btn-secondary pending-move-one"
                    onClick={() => moveToToday([task.pendingId])}
                  >
                    Move to Today
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
