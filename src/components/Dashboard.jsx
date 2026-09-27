import { lastNDays, prettyDate, fullPrettyDate, todayKey } from '../utils/date'
import TaskHeatmap from './TaskHeatmap'

export default function Dashboard({
  days,
  scheduledTasks,
  setScheduledTasks,
  setActiveView,
  setSelectedDate,
  isJournalUnlocked,
  protectedJournalDates,
  checkIns,
  checkInDays,
  setCheckInDays,
}) {
  const today = todayKey()
  const todayData = days[today] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }
  const todayTasks = todayData.tasks || []
  const completedToday = todayTasks.filter((t) => t.done).length
  const pendingToday = todayTasks.length - completedToday
  const completionRate = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0

  const last7 = lastNDays(7)
  const last7Tasks = last7.reduce((sum, key) => sum + (days[key]?.tasks?.length || 0), 0)
  const last7Done = last7.reduce(
    (sum, key) => sum + (days[key]?.tasks?.filter((t) => t.done).length || 0),
    0
  )
  const last7Rate = last7Tasks > 0 ? Math.round((last7Done / last7Tasks) * 100) : 0

  const allDays = lastNDays(119)
  let streak = 0
  for (let i = allDays.length - 1; i >= 0; i--) {
    const d = days[allDays[i]]
    const done = d?.tasks?.filter((t) => t.done).length || 0
    if (done > 0) {
      streak++
    } else if (allDays[i] !== allDays[allDays.length - 1]) {
      break
    }
  }

  const protectedDates = new Set(protectedJournalDates || [])
  const todayCheckIns = checkInDays?.[today] || {}
  const completedCheckIns = (checkIns || []).filter((item) => todayCheckIns[item.id]).length
  const checkInDatesById = Object.fromEntries(
    (checkIns || []).map((item) => [
      item.id,
      Object.entries(checkInDays || {})
        .filter(([, values]) => values?.[item.id])
        .map(([dateKey]) => dateKey),
    ])
  )
  const checkInHeatmapItems = (checkIns || []).map((item) => ({
    ...item,
    frequency: 'daily',
  }))
  const recentJournals = allDays
    .filter((key) => {
      const j = days[key]?.journal
      return j && (j.worked?.trim() || j.didntWork?.trim() || j.improve?.trim())
    })
    .reverse()
    .slice(0, 3)

  const goToToday = () => {
    setSelectedDate(today)
    setActiveView('tasks')
  }

  return (
    <div className="view dashboard-view">
      <div className="view-header">
        <div>
          <h2 className="view-title">Dashboard</h2>
          <p className="view-subtitle">{fullPrettyDate(today)}</p>
        </div>
      </div>

      <div className="dash-stats">
        <div className="dash-stat-card" onClick={goToToday}>
          <span className="dash-stat-value">{todayTasks.length}</span>
          <span className="dash-stat-label">Today's Tasks</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value">{completedToday}</span>
          <span className="dash-stat-label">Completed Today</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value">{pendingToday}</span>
          <span className="dash-stat-label">Pending Today</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value">{streak}</span>
          <span className="dash-stat-label">Day Streak</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value">{completionRate}%</span>
          <span className="dash-stat-label">Today's Rate</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value">{last7Rate}%</span>
          <span className="dash-stat-label">7-Day Rate</span>
        </div>
      </div>

      <div className="dash-section">
        <h3 className="dash-section-title">Today's Progress</h3>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${completionRate}%` }}></div>
        </div>
        <p className="progress-text">
          {completedToday} of {todayTasks.length} tasks completed
        </p>
      </div>

      <div className="dash-section">
        <h3 className="dash-section-title">Quick Actions</h3>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={goToToday}>
            View Today's Tasks
          </button>
          <button
            className="quick-action-btn"
            onClick={() => {
              setSelectedDate(today)
              setActiveView('journal')
            }}
          >
            Write Journal
          </button>
          <button className="quick-action-btn" onClick={() => setActiveView('checkins')}>
            Open Check-ins
          </button>
        </div>
      </div>

      <div className="dash-section">
        <div className="dash-section-heading">
          <h3 className="dash-section-title">Today's Check-ins</h3>
          {(checkIns || []).length > 0 && (
            <span className="dash-section-meta">
              {completedCheckIns} of {checkIns.length}
            </span>
          )}
        </div>
        {(checkIns || []).length === 0 ? (
          <div className="empty-state small">
            <p>No daily check-ins yet.</p>
            <button className="text-action" onClick={() => setActiveView('checkins')}>
              Add your first check-in
            </button>
          </div>
        ) : (
          <div className="dashboard-checkins">
            {checkIns.map((item) => (
              <label key={item.id} className={`dashboard-checkin ${todayCheckIns[item.id] ? 'done' : ''}`}>
                <span className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={Boolean(todayCheckIns[item.id])}
                    onChange={() => {
                      setCheckInDays((prev) => {
                        const next = { ...prev }
                        const day = { ...(next[today] || {}) }
                        if (day[item.id]) delete day[item.id]
                        else day[item.id] = true
                        if (Object.keys(day).length > 0) next[today] = day
                        else delete next[today]
                        return next
                      })
                    }}
                  />
                </span>
                <span>{item.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <TaskHeatmap
        scheduledTasks={checkInHeatmapItems}
        days={{}}
        completedDatesById={checkInDatesById}
        title="Check-in Progress"
        emptyText="No check-ins yet. Add one from the Check-ins page."
        binary
      />

      <TaskHeatmap scheduledTasks={scheduledTasks} days={days} />

      <div className="dash-section">
        <h3 className="dash-section-title">Recent Journal Entries</h3>
        {recentJournals.length === 0 ? (
          <div className="empty-state small">
            <p>No journal entries yet. Start writing today.</p>
          </div>
        ) : (
          <div className="recent-journals">
            {recentJournals.map((key) => {
              const j = days[key].journal
              const isPrivate = protectedDates.has(key) && !isJournalUnlocked
              return (
                <button
                  key={key}
                  className={`recent-journal-item ${isPrivate ? 'is-private' : ''}`}
                  onClick={() => {
                    setSelectedDate(key)
                    setActiveView('journal')
                  }}
                >
                  <span className="rj-date">{prettyDate(key)}</span>
                  {isPrivate ? (
                    <span className="rj-private-copy">Private entry. Unlock to view.</span>
                  ) : (
                  <div className="rj-snippets">
                    {j.worked?.trim() && (
                      <p className="rj-snippet">
                        <strong>Worked:</strong> {j.worked.slice(0, 80)}
                        {j.worked.length > 80 ? '...' : ''}
                      </p>
                    )}
                    {j.didntWork?.trim() && (
                      <p className="rj-snippet">
                        <strong>Didn't Work:</strong> {j.didntWork.slice(0, 80)}
                        {j.didntWork.length > 80 ? '...' : ''}
                      </p>
                    )}
                    {j.improve?.trim() && (
                      <p className="rj-snippet">
                        <strong>Improve:</strong> {j.improve.slice(0, 80)}
                        {j.improve.length > 80 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
