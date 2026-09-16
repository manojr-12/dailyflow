import { todayKey, fullPrettyDate } from '../utils/date'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks', label: "Today's Tasks" },
  { id: 'journal', label: 'Journal' },
]

export default function Sidebar({ activeView, setActiveView, onExport, onImport }) {
  const handleImport = (e) => {
    const file = e.target.files[0]
    if (file) onImport(file)
    e.target.value = ''
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">DailyFlow</h1>
        <p className="date-today">{fullPrettyDate(todayKey())}</p>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-secondary" onClick={onExport}>
          Export Data
        </button>
        <label className="btn-secondary file-import-label">
          Import Data
          <input
            type="file"
            accept="application/json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </aside>
  )
}
