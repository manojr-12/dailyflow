import { fullPrettyDate, addDaysKey, isToday } from '../utils/date'

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

export default function Journal({ selectedDate, setSelectedDate, days, setDays }) {
  const dayData = days[selectedDate] || { tasks: [], journal: { worked: '', didntWork: '', improve: '' } }
  const journal = dayData.journal || { worked: '', didntWork: '', improve: '' }

  const updateJournal = (key, value) => {
    setDays((prev) => ({
      ...prev,
      [selectedDate]: {
        ...(prev[selectedDate] || { tasks: [], journal: {} }),
        journal: { ...journal, [key]: value },
      },
    }))
  }

  return (
    <div className="view journal-view">
      <div className="view-header">
        <div>
          <h2 className="view-title">Daily Journal</h2>
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
    </div>
  )
}
