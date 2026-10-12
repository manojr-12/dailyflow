import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useJournalLock } from './hooks/useJournalLock'
import { todayKey } from './utils/date'
import { generateTasksForDate } from './utils/schedule'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import TaskList from './components/TaskList'
import Journal from './components/Journal'
import RecurringTasks from './components/RecurringTasks'
import CheckIns from './components/CheckIns'
import PendingTasks from './components/PendingTasks'
import AddTaskModal from './components/AddTaskModal'
import './App.css'

function App() {
  const [days, setDays] = useLocalStorage('dailyflow-days', {})
  const [scheduledTasks, setScheduledTasks] = useLocalStorage('dailyflow-scheduled', [])
  const [checkIns, setCheckIns] = useLocalStorage('dailyflow-check-ins', [])
  const [checkInDays, setCheckInDays] = useLocalStorage('dailyflow-check-in-days', {})
  const [pendingTasks, setPendingTasks] = useLocalStorage('dailyflow-pending-tasks', [])
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [currentDay, setCurrentDay] = useState(todayKey())
  const [modalOpen, setModalOpen] = useState(false)
  const journalLock = useJournalLock()

  // Keep the app's idea of "today" fresh when it remains open overnight.
  useEffect(() => {
    const refreshCurrentDay = () => setCurrentDay(todayKey())
    const timer = window.setInterval(refreshCurrentDay, 60_000)
    window.addEventListener('focus', refreshCurrentDay)
    document.addEventListener('visibilitychange', refreshCurrentDay)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshCurrentDay)
      document.removeEventListener('visibilitychange', refreshCurrentDay)
    }
  }, [])

  // Move unfinished tasks from completed calendar days into the Pending tab.
  useEffect(() => {
    const overdue = []
    let changed = false
    const nextDays = { ...days }

    Object.entries(days).forEach(([dateKey, dayData]) => {
      if (dateKey >= currentDay || !Array.isArray(dayData?.tasks)) return
      const unfinished = dayData.tasks.filter((task) => !task.done)
      if (unfinished.length === 0) return

      changed = true
      overdue.push(
        ...unfinished.map((task) => ({
          ...task,
          pendingId: `${dateKey}:${task.id}`,
          originalDate: dateKey,
          pendingSince: currentDay,
        }))
      )
      nextDays[dateKey] = {
        ...dayData,
        tasks: dayData.tasks.filter((task) => task.done),
      }
    })

    if (!changed) return
    setPendingTasks((existing) => {
      const known = new Set(existing.map((task) => task.pendingId))
      return [...existing, ...overdue.filter((task) => !known.has(task.pendingId))]
    })
    setDays(nextDays)
  }, [currentDay, days, setDays, setPendingTasks])

  useEffect(() => {
    if (activeView !== 'journal' && journalLock.isUnlocked) {
      journalLock.lock()
    }
  }, [activeView, journalLock.isUnlocked, journalLock.lock])

  // Auto-generate scheduled tasks for today on app load
  useEffect(() => {
    const today = todayKey()
    const todayData = days[today]
    const existingTasks = todayData?.tasks || []
    const newTasks = generateTasksForDate(scheduledTasks, today, existingTasks)

    if (newTasks.length > 0) {
      setDays((prev) => ({
        ...prev,
        [today]: {
          ...(prev[today] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }),
          tasks: [...(prev[today]?.tasks || []), ...newTasks],
        },
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-generate scheduled tasks when navigating to a date
  const handleSetSelectedDate = useCallback(
    (dateKey) => {
      setSelectedDate(dateKey)
      const dayData = days[dateKey]
      const existingTasks = dayData?.tasks || []
      const newTasks = generateTasksForDate(scheduledTasks, dateKey, existingTasks)

      if (newTasks.length > 0) {
        setDays((prev) => ({
          ...prev,
          [dateKey]: {
            ...(prev[dateKey] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }),
            tasks: [...(prev[dateKey]?.tasks || []), ...newTasks],
          },
        }))
      }
    },
    [days, scheduledTasks, setDays]
  )

  // Add a one-time task to a specific date
  const handleAddTask = useCallback(
    (task) => {
      const dateKey = task.dateKey
      setDays((prev) => {
        const dayData = prev[dateKey] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }
        return {
          ...prev,
          [dateKey]: {
            ...dayData,
            tasks: [...(dayData.tasks || []), task],
          },
        }
      })
    },
    [setDays]
  )

  // Add a recurring/scheduled task
  const handleAddScheduled = useCallback(
    (scheduledTask) => {
      setScheduledTasks((prev) => [...prev, scheduledTask])
      // Also generate for the start date if applicable
      const newTasks = generateTasksForDate([scheduledTask], scheduledTask.startDate, [])
      if (newTasks.length > 0) {
        setDays((prev) => {
          const dayData =
            prev[scheduledTask.startDate] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }
          return {
            ...prev,
            [scheduledTask.startDate]: {
              ...dayData,
              tasks: [...(dayData.tasks || []), ...newTasks],
            },
          }
        })
      }
    },
    [setScheduledTasks, setDays]
  )

  const handleExport = () => {
    if (journalLock.hasProtectedEntries && !journalLock.isUnlocked) {
      setActiveView('journal')
      return
    }

    const data = JSON.stringify(
      { days, scheduledTasks, checkIns, checkInDays, pendingTasks, exportDate: new Date().toISOString() },
      null,
      2
    )
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dailyflow-backup-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (file) => {
    if (journalLock.hasProtectedEntries && !journalLock.isUnlocked) {
      setActiveView('journal')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        if (parsed.days && typeof parsed.days === 'object') {
          setDays(parsed.days)
          if (parsed.scheduledTasks) setScheduledTasks(parsed.scheduledTasks)
          if (Array.isArray(parsed.checkIns)) setCheckIns(parsed.checkIns)
          if (parsed.checkInDays && typeof parsed.checkInDays === 'object') {
            setCheckInDays(parsed.checkInDays)
          }
          if (Array.isArray(parsed.pendingTasks)) setPendingTasks(parsed.pendingTasks)
          alert('Data imported successfully.')
        } else {
          alert('Invalid backup file format.')
        }
      } catch {
        alert('Could not read the file. Make sure it is a valid JSON backup.')
      }
    }
    reader.readAsText(file)
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            days={days}
            scheduledTasks={scheduledTasks}
            setScheduledTasks={setScheduledTasks}
            setActiveView={setActiveView}
            setSelectedDate={handleSetSelectedDate}
            isJournalUnlocked={journalLock.isUnlocked}
            protectedJournalDates={journalLock.protectedDates}
            checkIns={checkIns}
            checkInDays={checkInDays}
            setCheckInDays={setCheckInDays}
            pendingTasks={pendingTasks}
          />
        )
      case 'tasks':
        return (
          <TaskList
            selectedDate={selectedDate}
            setSelectedDate={handleSetSelectedDate}
            days={days}
            setDays={setDays}
          />
        )
      case 'recurring':
        return (
          <RecurringTasks
            scheduledTasks={scheduledTasks}
            setScheduledTasks={setScheduledTasks}
          />
        )
      case 'pending':
        return (
          <PendingTasks
            pendingTasks={pendingTasks}
            setPendingTasks={setPendingTasks}
            setDays={setDays}
            setActiveView={setActiveView}
            setSelectedDate={handleSetSelectedDate}
          />
        )
      case 'checkins':
        return (
          <CheckIns
            checkIns={checkIns}
            setCheckIns={setCheckIns}
            checkInDays={checkInDays}
            setCheckInDays={setCheckInDays}
            selectedDate={selectedDate}
            setSelectedDate={handleSetSelectedDate}
          />
        )
      case 'journal':
        return (
          <Journal
            selectedDate={selectedDate}
            setSelectedDate={handleSetSelectedDate}
            days={days}
            setDays={setDays}
            journalLock={journalLock}
          />
        )
      default:
        return (
          <Dashboard
            days={days}
            setActiveView={setActiveView}
            setSelectedDate={handleSetSelectedDate}
            isJournalUnlocked={journalLock.isUnlocked}
            protectedJournalDates={journalLock.protectedDates}
            scheduledTasks={scheduledTasks}
            checkIns={checkIns}
            checkInDays={checkInDays}
            setCheckInDays={setCheckInDays}
            pendingTasks={pendingTasks}
          />
        )
    }
  }

  return (
    <div className="app">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onExport={handleExport}
        onImport={handleImport}
      />
      <main className="main-content">
        {renderView()}
      </main>

      <button
        className="fab"
        onClick={() => setModalOpen(true)}
        aria-label="Add task"
        title="Add task"
      >
        +
      </button>

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddTask={handleAddTask}
        onAddScheduled={handleAddScheduled}
        selectedDate={selectedDate}
      />
    </div>
  )
}

export default App
