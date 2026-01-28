import { useEffect, useMemo, useState } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  ArcElement,
  BarElement,
} from 'chart.js'
import { apiFetch } from '../lib/api.js'
import { Card } from '../ui/Card.jsx'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
)

export function ProgressPage() {
  const [summary, setSummary] = useState(null)
  const [mlPatterns, setMlPatterns] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const [analytics, ml] = await Promise.all([
          apiFetch('/api/analytics/summary'),
          apiFetch('/api/ml/patterns').catch(() => ({})),
        ])
        setSummary(analytics?.summary || null)
        setMlPatterns(ml && (ml.ready || ml.explain) ? ml : null)
      } catch (err) {
        setError(err?.message || 'Failed to load analytics')
      }
    })()
  }, [])

  const completionData = useMemo(() => {
    const done = summary?.tasks?.done || 0
    const pending = summary?.tasks?.pending || 0
    return {
      labels: ['Done', 'Pending'],
      datasets: [
        {
          data: [done, pending],
          backgroundColor: ['rgba(99,102,241,0.8)', 'rgba(148,163,184,0.35)'],
          borderColor: ['rgba(99,102,241,1)', 'rgba(148,163,184,0.6)'],
          borderWidth: 1,
        },
      ],
    }
  }, [summary])

  const last7Data = useMemo(() => {
    const labels = summary?.charts?.last7Days?.labels || []
    const minutes = summary?.charts?.last7Days?.minutes || []
    return {
      labels,
      datasets: [
        {
          label: 'Minutes studied',
          data: minutes,
          borderColor: 'rgba(99,102,241,1)',
          backgroundColor: 'rgba(99,102,241,0.25)',
          tension: 0.3,
          fill: true,
        },
      ],
    }
  }, [summary])

  const subjectBarData = useMemo(() => {
    const items = summary?.charts?.subjectMinutesTop || []
    return {
      labels: items.map((x) => x.subjectName),
      datasets: [
        {
          label: 'Minutes',
          data: items.map((x) => x.minutes),
          backgroundColor: 'rgba(16,185,129,0.25)',
          borderColor: 'rgba(16,185,129,0.8)',
          borderWidth: 1,
        },
      ],
    }
  }, [summary])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Progress</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track completion %, streak, and subject-wise study time.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Completion" subtitle="Completed vs pending">
          <div className="text-3xl font-semibold">{summary ? `${summary.completionPercent}%` : '—%'}</div>
          <div className="mt-1 text-sm text-slate-400">
            {summary ? `${summary.tasks.done} done / ${summary.tasks.total} total` : 'Loading…'}
          </div>
        </Card>
        <Card title="Streak" subtitle="Consecutive study days">
          <div className="text-3xl font-semibold">{summary ? summary.streakDays : 0}</div>
          <div className="mt-1 text-sm text-slate-400">days</div>
        </Card>
        <Card title="Time studied" subtitle="This week">
          <div className="text-3xl font-semibold">{summary ? Math.round((summary.weeklyMinutes || 0) / 60) : 0}</div>
          <div className="mt-1 text-sm text-slate-400">hours</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Completion" subtitle="Done vs pending">
          <div className="mx-auto max-w-sm">
            <Doughnut data={completionData} />
          </div>
        </Card>

        <Card title="Study minutes (last 7 days)" subtitle="Based on tasks you marked done">
          <Line
            data={last7Data}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { color: 'rgba(148,163,184,0.9)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                x: { ticks: { color: 'rgba(148,163,184,0.9)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
              },
            }}
          />
        </Card>
      </div>

      <Card title="Subject-wise time (top 10)" subtitle="Total minutes from completed schedule blocks">
        {subjectBarData.labels.length === 0 ? (
          <div className="text-sm text-slate-300">No completed study time yet. Mark tasks “Done” from the schedule.</div>
        ) : (
          <Bar
            data={subjectBarData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { color: 'rgba(148,163,184,0.9)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                x: { ticks: { color: 'rgba(148,163,184,0.9)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
              },
            }}
          />
        )}
      </Card>

      <Card title="AI / ML insights" subtitle="Explainable: K-Means patterns, Linear Regression for time">
        {!mlPatterns ? (
          <div className="text-sm text-slate-300">Complete more sessions to see productivity patterns and ML time estimates.</div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-200">{mlPatterns.explain}</p>
            {mlPatterns.ready && mlPatterns.clusters?.length > 0 ? (
              <ul className="list-inside list-disc text-sm text-slate-400">
                {mlPatterns.clusters.map((c) => (
                  <li key={c.id}>{c.label}</li>
                ))}
              </ul>
            ) : null}
            <p className="text-xs text-slate-500">
              Schedule block lengths may use Linear Regression when you have 5+ completed sessions. Look for minutesSource &quot;ml_prediction&quot; and mlExplain on Create Schedule.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

