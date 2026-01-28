import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarNav } from '../ui/SidebarNav.jsx'
import { TopBar } from '../ui/TopBar.jsx'

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onEsc = (e) => e.key === 'Escape' && setMobileMenuOpen(false)
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [mobileMenuOpen])

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside
          className={`w-64 shrink-0 border-r border-white/10 bg-slate-950 ${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-40' : 'hidden'} md:relative md:block`}
        >
          <SidebarNav onClose={mobileMenuOpen ? () => setMobileMenuOpen(false) : undefined} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="flex-1 px-4 py-6 md:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

