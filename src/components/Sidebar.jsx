import { useState } from 'react'
import { todayKey, fullPrettyDate } from '../utils/date'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks', label: "Today's Tasks" },
  { id: 'recurring', label: 'Recurring' },
  { id: 'checkins', label: 'Check-ins' },
  { id: 'journal', label: 'Journal' },
]

export default function Sidebar({ activeView, setActiveView, onExport, onImport }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (file) onImport(file)
    e.target.value = ''
  }

  const handleNavClick = (id) => {
    setActiveView(id)
    setMenuOpen(false)
  }

  return (
    <aside className={`sidebar ${menuOpen ? 'menu-open' : ''}`}>
      <div className="sidebar-header">
        <h1 className="logo">DailyFlow</h1>
        <p className="date-today">{fullPrettyDate(todayKey())}</p>
      </div>

      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => handleNavClick(item.id)}
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
