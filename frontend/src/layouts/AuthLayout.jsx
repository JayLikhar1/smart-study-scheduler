import { Outlet } from 'react-router-dom'
import { Brand } from '../ui/Brand.jsx'

export function AuthLayout() {
  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
          <div className="hidden md:flex md:flex-col md:justify-center">
            <Brand />
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Smart Study Scheduler helps you plan smarter: prioritize deadlines, balance difficulty,
              and track progress over time.
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium">What you’ll get</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>- Task planning by deadline + difficulty</li>
                <li>- Daily schedules based on your available hours</li>
                <li>- Progress tracking and analytics</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

