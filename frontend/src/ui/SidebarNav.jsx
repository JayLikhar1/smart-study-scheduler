import { NavLink } from 'react-router-dom'
import { Brand } from './Brand.jsx'

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        [
          'block rounded-xl px-3 py-2 text-sm transition',
          isActive ? 'bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/20' : 'text-slate-200 hover:bg-white/5',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}

export function SidebarNav({ onClose }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <Brand />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 md:hidden"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-6 space-y-1">
        <NavItem to="/" label="Dashboard" />
        <NavItem to="/tasks" label="Subjects & Tasks" />
        <NavItem to="/schedule/new" label="Create Schedule" />
        <NavItem to="/progress" label="Progress" />
      </div>

      <div className="mt-auto pt-6 text-xs text-slate-500">
        AI‑powered study planning
      </div>
    </div>
  )
}

