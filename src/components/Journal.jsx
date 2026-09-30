import { useEffect, useState } from 'react'
import { fullPrettyDate, addDaysKey, isToday, todayKey } from '../utils/date'

const JOURNAL_FIELDS = [
  {
    key: 'worked',
    label: 'What Worked',
    placeholder: 'What went well today? What wins did you have?',
    color: '#10b981',
  },
  {
    key: 'didntWork',
    label: "What Didn't Work",
    placeholder: "What challenges did you face? What didn't go as planned?",
    color: '#ef4444',
  },
  {
    key: 'improve',
    label: 'Where to Improve',
    placeholder: 'What will you do differently tomorrow? Where can you grow?',
    color: '#f59e0b',
  },
]

function JournalProtectionPanel({ journalLock, onProtected, onCancel }) {
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  const handlePinSetup = async (event) => {
    event.preventDefault()
    if (pin !== confirmPin) return
    const unlocked = await journalLock.setupPin(pin)
    if (unlocked) {
      onProtected()
      setPin('')
      setConfirmPin('')
    }
  }

  const handlePinUnlock = async (event) => {
    event.preventDefault()
    const unlocked = await journalLock.unlockWithPin(pin)
    if (unlocked) setPin('')
  }

  const handlePinChange = (setter) => (event) => {
    setter(event.target.value.replace(/\D/g, '').slice(0, 6))
    journalLock.clearError()
  }

  const pinMismatch = showPinSetup && confirmPin.length === 6 && pin !== confirmPin

  const handleDeviceSetup = async () => {
    const unlocked = await journalLock.setupDeviceLock()
    if (unlocked) onProtected()
  }

  return (
    <div className="journal-lock-panel">
      <h2>{journalLock.isConfigured ? 'Private journal entry' : 'Protect this entry'}</h2>
      <p>
        {journalLock.isConfigured
          ? 'Verify it is you to view and edit this date.'
          : 'Choose a device lock or PIN. Only entries you mark private will require it.'}
      </p>

      {!journalLock.isConfigured && !showPinSetup && (
        <div className="journal-lock-actions">
          <button
            className="journal-lock-primary"
            onClick={handleDeviceSetup}
            disabled={journalLock.deviceLockAvailable !== true || journalLock.isBusy}
          >
            {journalLock.isBusy ? 'Waiting for device...' : 'Use device lock'}
          </button>
          <button
            className="journal-lock-secondary"
            onClick={() => {
              setShowPinSetup(true)
              journalLock.clearError()
            }}
          >
            Use a 6-digit PIN
          </button>
          {journalLock.deviceLockAvailable === false && (
            <span className="journal-lock-note">
              Device verification is not available here. You can still use a PIN.
            </span>
          )}
          <button className="journal-lock-secondary" onClick={onCancel}>
            Keep entry open
          </button>
        </div>
      )}

      {!journalLock.isConfigured && showPinSetup && (
        <form className="journal-pin-form" onSubmit={handlePinSetup}>
          <label htmlFor="journal-pin-new">Choose PIN</label>
          <input
            id="journal-pin-new"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={pin}
            onChange={handlePinChange(setPin)}
            maxLength={6}
            autoFocus
          />
          <label htmlFor="journal-pin-confirm">Confirm PIN</label>
          <input
            id="journal-pin-confirm"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={confirmPin}
            onChange={handlePinChange(setConfirmPin)}
            maxLength={6}
          />
          {pinMismatch && <span className="journal-lock-error">The PINs do not match.</span>}
          <button
            className="journal-lock-primary"
            type="submit"
            disabled={pin.length !== 6 || confirmPin.length !== 6 || pinMismatch || journalLock.isBusy}
          >
            Save PIN
          </button>
          <button
            className="journal-lock-secondary"
            type="button"
            onClick={() => {
              setShowPinSetup(false)
              setPin('')
              setConfirmPin('')
              journalLock.clearError()
            }}
          >
            Back
          </button>
          <button className="journal-lock-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        </form>
      )}

      {journalLock.isConfigured && journalLock.mode === 'device' && (
        <button
          className="journal-lock-primary"
          onClick={journalLock.unlockWithDevice}
          disabled={journalLock.isBusy}
        >
          {journalLock.isBusy ? 'Verifying...' : 'Unlock journal'}
        </button>
      )}

      {journalLock.isConfigured && journalLock.mode === 'pin' && (
        <form className="journal-pin-form" onSubmit={handlePinUnlock}>
          <label htmlFor="journal-pin-unlock">Journal PIN</label>
          <input
            id="journal-pin-unlock"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={handlePinChange(setPin)}
            maxLength={6}
            autoFocus
          />
          <button
            className="journal-lock-primary"
            type="submit"
            disabled={pin.length !== 6 || journalLock.isBusy}
          >
            {journalLock.isBusy ? 'Checking...' : 'Unlock journal'}
          </button>
        </form>
      )}

      {journalLock.error && <span className="journal-lock-error">{journalLock.error}</span>}
    </div>
  )
}

export default function Journal({ selectedDate, setSelectedDate, days, setDays, journalLock }) {
  const [showProtectionSetup, setShowProtectionSetup] = useState(false)
  const dayData = days[selectedDate] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }
  const journal = dayData.journal || { worked: '', didntWork: '', improve: '' }
  const isProtected = journalLock.isProtected(selectedDate)
  const isLocked = isProtected && !journalLock.isUnlocked

  useEffect(() => {
    setShowProtectionSetup(false)
    journalLock.clearError()
  }, [selectedDate, journalLock.clearError])

  const updateJournal = (key, value) => {
    setDays((prev) => ({
      ...prev,
      [selectedDate]: {
        ...(prev[selectedDate] || { tasks: [], journal: {} }),
        journal: { ...journal, [key]: value },
      },
    }))
  }

  const protectCurrentEntry = () => {
    if (!journalLock.isConfigured) {
      setShowProtectionSetup(true)
      return
    }
    journalLock.protectDate(selectedDate)
    journalLock.lock()
  }

  const finishProtectionSetup = () => {
    journalLock.protectDate(selectedDate)
    setShowProtectionSetup(false)
  }

  return (
    <div className="view journal-view">
      <div className="view-header">
        <div>
          <h2 className="view-title">Daily Journal</h2>
          <p className="view-subtitle">{fullPrettyDate(selectedDate)}</p>
        </div>
        <div className="journal-header-actions">
          <div className="date-nav">
            <button onClick={() => setSelectedDate(addDaysKey(selectedDate, -1))}>Prev</button>
            {!isToday(selectedDate) && (
              <button onClick={() => setSelectedDate(addDaysKey(selectedDate, 1))}>Next</button>
            )}
            <button className="btn-today" onClick={() => setSelectedDate(todayKey())}>
              Today
            </button>
          </div>
          <div className="journal-entry-actions">
            {!isProtected && (
              <button className="journal-protect-entry" onClick={protectCurrentEntry}>
                Protect entry
              </button>
            )}
            {isProtected && !journalLock.isUnlocked && (
              <span className="journal-private-badge">Private entry</span>
            )}
            {isProtected && journalLock.isUnlocked && (
              <>
                <span className="journal-private-badge">Private entry</span>
                <button
                  className="journal-protect-entry"
                  onClick={() => journalLock.unprotectDate(selectedDate)}
                >
                  Remove protection
                </button>
                <button className="journal-lock-now" onClick={journalLock.lock}>
                  Lock now
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showProtectionSetup || isLocked ? (
        <JournalProtectionPanel
          journalLock={journalLock}
          onProtected={finishProtectionSetup}
          onCancel={() => {
            setShowProtectionSetup(false)
            journalLock.clearError()
          }}
        />
      ) : (
      <>
      <div className="journal-grid">
        {JOURNAL_FIELDS.map((field) => (
          <div key={field.key} className="journal-card" style={{ borderTopColor: field.color }}>
            <div className="journal-card-header">
              <h3>{field.label}</h3>
            </div>
            <textarea
              className="journal-textarea"
              placeholder={field.placeholder}
              value={journal[field.key] || ''}
              onChange={(e) => updateJournal(field.key, e.target.value)}
              rows={6}
            />
          </div>
        ))}
      </div>

      <div className="journal-meta">
        <p className="journal-hint">
          Tip: Write your reflections at the end of each day. Even a few sentences help build
          self-awareness and track your growth over time.
        </p>
      </div>
      </>
      )}
    </div>
  )
}
