import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { Brand } from './Brand.jsx'
import { NotificationsDropdown } from './NotificationsDropdown.jsx'

function titleFromPath(pathname) {
  if (pathname === '/') return 'Dashboard'
  if (pathname === '/tasks') return 'Subjects & Tasks'
  if (pathname === '/schedule/new') return 'Create Schedule'
  if (pathname === '/progress') return 'Progress'
  return 'Smart Study Scheduler'
}

export function TopBar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const title = titleFromPath(location.pathname)

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-xl p-2 text-slate-300 hover:bg-white/5 md:hidden"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="md:hidden">
            <Brand />
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-slate-400">Plan. Focus. Improve.</div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <NotificationsDropdown />
              <div className="hidden text-sm text-slate-300 md:block">
                {user?.name || 'Student'}
              </div>
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/login', { replace: true })
                }}
                className="rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

