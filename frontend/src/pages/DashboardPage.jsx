import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api.js'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'

export function DashboardPage() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch('/api/analytics/summary')
        setSummary(data?.summary || null)
      } catch {
        // keep dashboard usable even if analytics fails
      }
    })()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Your study plan overview. Connects to tasks + schedules in Phase 4–6.
          </p>
        </div>
        <Link to="/schedule/new">
          <Button>Create Schedule</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Today’s focus" subtitle="What you should study today">
          <div className="text-sm text-slate-300">
            Generate a schedule to see your daily plan.
          </div>
          <div className="mt-4">
            <Link to="/schedule/new">
              <Button variant="ghost">Generate now</Button>
            </Link>
          </div>
        </Card>

        <Card title="Tasks" subtitle="Pending vs completed">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs text-slate-400">Pending</div>
              <div className="mt-1 text-xl font-semibold">{summary ? summary.tasks.pending : '—'}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs text-slate-400">Completed</div>
              <div className="mt-1 text-xl font-semibold">{summary ? summary.tasks.done : '—'}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Updated from your task list.
          </div>
        </Card>

        <Card title="Streak" subtitle="Consistency over time">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-xs text-slate-400">Current streak</div>
            <div className="mt-1 text-xl font-semibold">{summary ? `${summary.streakDays} days` : '0 days'}</div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Mark tasks “Done” from the schedule to build your streak.
          </div>
        </Card>
      </div>

      <Card title="Quick tips" subtitle="Simple study habits that work">
        <ul className="space-y-2 text-sm text-slate-300">
          <li>- Study the hardest topic first when energy is high.</li>
          <li>- Break big topics into 25–45 min blocks.</li>
          <li>- Review yesterday’s notes for 10 minutes before starting new content.</li>
        </ul>
      </Card>
    </div>
  )
}



