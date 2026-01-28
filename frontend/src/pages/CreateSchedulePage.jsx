import { useState } from 'react'
import { apiFetch } from '../lib/api.js'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { TextField } from '../ui/TextField.jsx'

function minutesLabel(m) {
  if (!m) return '0m'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

export function CreateSchedulePage() {
  const [dailyHours, setDailyHours] = useState('2')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schedule, setSchedule] = useState(null)

  async function onGenerate(e) {
    e.preventDefault()
    setError('')
    setSchedule(null)
    setLoading(true)
    try {
      const data = await apiFetch('/api/schedule/generate', {
        method: 'POST',
        body: {
          startDate,
          dailyStudyMinutes: Math.max(0, Math.round(Number(dailyHours) * 60)),
        },
      })
      setSchedule(data?.schedule || null)
    } catch (err) {
      setError(err?.message || 'Failed to generate schedule')
    } finally {
      setLoading(false)
    }
  }

  async function reportOutcome({ taskId, outcome, minutes, scheduledDate }) {
    setError('')
    try {
      const data = await apiFetch('/api/schedule/events', {
        method: 'POST',
        body: { taskId, outcome, minutes, scheduledDate },
      })
      setSchedule(data?.schedule || null)
    } catch (err) {
      setError(err?.message || 'Failed to update schedule')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Schedule</h1>
        <p className="mt-1 text-sm text-slate-400">
          Generates a daily plan by sorting tasks by deadline, then difficulty.
        </p>
      </div>

      <Card title="Your available time" subtitle="Used to distribute tasks across days">
        <form className="grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={onGenerate}>
          <TextField
            label="Daily study hours"
            name="dailyHours"
            type="number"
            value={dailyHours}
            onChange={(e) => setDailyHours(e.target.value)}
            placeholder="2"
            required
          />
          <TextField
            label="Start date"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Generating…' : 'Generate'}
            </Button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </Card>

      <Card title="Generated plan" subtitle="Preview of your daily schedule">
        {!schedule ? (
          <div className="text-sm text-slate-300">
            Generate a schedule to see results here.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-slate-300">
              Daily capacity:{' '}
              <span className="font-medium text-slate-100">{minutesLabel(schedule.effectiveDailyStudyMinutes ?? schedule.dailyStudyMinutes)}</span>
              {schedule.effectiveDailyStudyMinutes && schedule.effectiveDailyStudyMinutes !== schedule.dailyStudyMinutes ? (
                <span className="ml-2 text-xs text-slate-400">
                  (reduced from {minutesLabel(schedule.dailyStudyMinutes)} because tasks were missed twice)
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {schedule.days.map((day) => (
                <div key={day.date} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm font-semibold text-slate-100">{day.date}</div>
                    <div className="text-xs text-slate-400">{minutesLabel(day.plannedMinutes)}</div>
                  </div>
                  {day.items.length === 0 ? (
                    <div className="mt-3 text-sm text-slate-400">No tasks scheduled.</div>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {day.items.map((it) => (
                        <li key={`${day.date}-${it.taskId}-${it.minutes}`} className="rounded-xl bg-black/20 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-slate-100">{it.topic}</div>
                              <div className="mt-0.5 text-xs text-slate-400">
                                Difficulty: {it.difficulty} • Deadline: {it.deadline || '—'}
                                {it.isPartial ? ' • partial' : ''}
                                {typeof it.missedCount === 'number' && it.missedCount > 0
                                  ? ` • missed ${it.missedCount}x`
                                  : ''}
                                {it.minutesSource === 'ml_prediction' ? (
                                  <span className="ml-1 rounded bg-indigo-500/20 px-1 text-indigo-200">ML</span>
                                ) : null}
                              </div>
                              {it.mlExplain ? (
                                <div className="mt-1 text-xs text-slate-500">{it.mlExplain}</div>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <div className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-200 ring-1 ring-white/10">
                                {minutesLabel(it.minutes)}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    reportOutcome({
                                      taskId: it.taskId,
                                      outcome: 'done',
                                      minutes: it.minutes,
                                      scheduledDate: day.date,
                                    })
                                  }
                                  className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs text-emerald-200 ring-1 ring-emerald-400/20 hover:bg-emerald-500/20"
                                >
                                  Done
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    reportOutcome({
                                      taskId: it.taskId,
                                      outcome: 'missed',
                                      minutes: it.minutes,
                                      scheduledDate: day.date,
                                    })
                                  }
                                  className="rounded-lg bg-rose-500/15 px-2 py-1 text-xs text-rose-200 ring-1 ring-rose-400/20 hover:bg-rose-500/20"
                                >
                                  Missed
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

