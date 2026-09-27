import { useState } from 'react'
import { addDaysKey, fullPrettyDate, isToday } from '../utils/date'

const SUGGESTED_CHECK_INS = ['Went to the gym', 'Woke up at 5', 'Read for 20 minutes']

export default function CheckIns({
  checkIns,
  setCheckIns,
  checkInDays,
  setCheckInDays,
  selectedDate,
  setSelectedDate,
}) {
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const completions = checkInDays[selectedDate] || {}
  const completedCount = checkIns.filter((item) => completions[item.id]).length
  const completionRate = checkIns.length > 0
    ? Math.round((completedCount / checkIns.length) * 100)
    : 0

  const addCheckIn = (title) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const alreadyExists = checkIns.some(
      (item) => item.title.toLowerCase() === trimmed.toLowerCase()
    )
    if (alreadyExists) return

    setCheckIns((prev) => [
      ...prev,
      {
        id: `checkin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: trimmed,
        createdAt: new Date().toISOString(),
      },
    ])
    setNewTitle('')
  }

  const toggleCheckIn = (id) => {
    setCheckInDays((prev) => {
      const next = { ...prev }
      const day = { ...(next[selectedDate] || {}) }

      if (day[id]) {
        delete day[id]
      } else {
        day[id] = true
      }

      if (Object.keys(day).length > 0) {
        next[selectedDate] = day
      } else {
        delete next[selectedDate]
      }

      return next
    })
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditTitle(item.title)
  }

  const saveEdit = () => {
    const trimmed = editTitle.trim()
    if (!trimmed) return
    setCheckIns((prev) =>
      prev.map((item) => (item.id === editingId ? { ...item, title: trimmed } : item))
    )
    setEditingId(null)
  }

  const deleteCheckIn = (item) => {
    if (!window.confirm(`Delete "${item.title}" and its check-in history?`)) return

    setCheckIns((prev) => prev.filter((entry) => entry.id !== item.id))
    setCheckInDays((prev) => {
      const next = {}
      Object.entries(prev).forEach(([dateKey, values]) => {
        const day = { ...values }
        delete day[item.id]
        if (Object.keys(day).length > 0) next[dateKey] = day
      })
      return next
    })
  }

  return (
    <div className="view checkins-view">
      <div className="view-header">
        <div>
          <h2 className="view-title">Daily Check-ins</h2>
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

      <form
        className="checkin-add-form"
        onSubmit={(event) => {
          event.preventDefault()
          addCheckIn(newTitle)
        }}
      >
        <label htmlFor="new-checkin">New daily check-in</label>
        <div className="checkin-add-row">
          <input
            id="new-checkin"
            type="text"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Went to the gym"
          />
          <button type="submit" className="btn-primary" disabled={!newTitle.trim()}>
            Add check-in
          </button>
        </div>
      </form>

      {checkIns.length === 0 ? (
        <div className="checkin-empty">
          <p>Start with a common check-in</p>
          <div className="checkin-suggestions">
            {SUGGESTED_CHECK_INS.map((title) => (
              <button key={title} type="button" onClick={() => addCheckIn(title)}>
                {title}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="checkin-progress" aria-label={`${completionRate}% complete`}>
            <div className="checkin-progress-copy">
              <span>{completedCount} of {checkIns.length} checked in</span>
              <strong>{completionRate}%</strong>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>

          <ul className="checkin-list">
            {checkIns.map((item) => {
              const isComplete = Boolean(completions[item.id])
              const isEditing = editingId === item.id

              return (
                <li key={item.id} className={`checkin-item ${isComplete ? 'done' : ''}`}>
                  {isEditing ? (
                    <div className="checkin-edit-row">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') saveEdit()
                          if (event.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                      />
                      <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                      <button type="button" className="btn-primary" onClick={saveEdit}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="checkin-toggle">
                        <span className="checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={isComplete}
                            onChange={() => toggleCheckIn(item.id)}
                          />
                        </span>
                        <span className="checkin-copy">
                          <strong>{item.title}</strong>
                          <small>{isComplete ? 'Checked in' : 'Not checked in'}</small>
                        </span>
                      </label>
                      <div className="checkin-actions">
                        <button type="button" className="btn-icon" onClick={() => startEdit(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-delete"
                          onClick={() => deleteCheckIn(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
