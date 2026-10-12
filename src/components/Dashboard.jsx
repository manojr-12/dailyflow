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
  pendingTasks = [],
}) {
  const today = todayKey()
  const todayData = days[today] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }
  const todayTasks = todayData.tasks || []
  const completedToday = todayTasks.filter((t) => t.done).length
  const pendingToday = todayTasks.length - completedToday
  const completionRate = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0
  const nextTask = todayTasks.find((task) => !task.done)

  const allDays = lastNDays(119)
  let streak = 0
  for (let i = allDays.length - 1; i >= 0; i--) {
    const done = days[allDays[i]]?.tasks?.some((task) => task.done)
    if (done) streak++
    else if (allDays[i] !== today) break
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

      <div className="dash-metrics" aria-label="Today at a glance">
        <button className="dash-metric" onClick={goToToday}>
          <span className="dash-metric-value">{todayTasks.length}</span>
          <span className="dash-metric-label">Today’s tasks</span>
        </button>
        <button className="dash-metric" onClick={goToToday}>
          <span className="dash-metric-value">{completedToday}</span>
          <span className="dash-metric-label">Completed</span>
        </button>
        <button className="dash-metric" onClick={goToToday}>
          <span className="dash-metric-value">{pendingToday}</span>
          <span className="dash-metric-label">Remaining</span>
        </button>
        <div className="dash-metric">
          <span className="dash-metric-value">{streak}<span className="dash-metric-unit">d</span></span>
          <span className="dash-metric-label">Current streak</span>
        </div>
      </div>

      <div className="dash-stats">
        <button className="dash-focus-card dash-focus-next" onClick={goToToday}>
          <span className="dash-focus-eyebrow">UP NEXT</span>
          <strong className="dash-focus-title">
            {nextTask ? nextTask.title : todayTasks.length ? 'You’re all caught up' : 'Plan your day'}
          </strong>
          <span className="dash-focus-detail">
            {nextTask
              ? `${pendingToday} task${pendingToday === 1 ? '' : 's'} left today`
              : todayTasks.length ? 'Everything on today’s list is done' : 'Add a task to get started'}
          </span>
          <span className="dash-focus-action">{nextTask ? 'Open today’s tasks →' : 'View today’s tasks →'}</span>
        </button>
        <button className="dash-focus-card" onClick={() => setActiveView('pending')}>
          <span className="dash-focus-eyebrow">CARRY OVER</span>
          <strong className="dash-focus-number">{pendingTasks.length}</strong>
          <span className="dash-focus-detail">unfinished from earlier days</span>
          <span className="dash-focus-action">Review pending tasks →</span>
        </button>
        <button className="dash-focus-card" onClick={() => setActiveView('checkins')}>
          <span className="dash-focus-eyebrow">DAILY CHECK-INS</span>
          <strong className="dash-focus-number">{completedCheckIns}<span> / {checkIns.length}</span></strong>
          <span className="dash-focus-detail">
            {checkIns.length ? `${checkIns.length - completedCheckIns} left to check off` : 'Build a small daily routine'}
          </span>
          <span className="dash-focus-action">{checkIns.length ? 'Update check-ins →' : 'Set up check-ins →'}</span>
        </button>
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
