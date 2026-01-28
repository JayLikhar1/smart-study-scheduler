import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api.js'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { TextField } from '../ui/TextField.jsx'

function DifficultyPill({ value }) {
  const styles =
    value === 'high'
      ? 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/20'
      : value === 'low'
        ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/20'
        : 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20'
  return <span className={`rounded-full px-2 py-0.5 text-xs ${styles}`}>{value}</span>
}

export function TasksPage() {
  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Subject form
  const [subjectName, setSubjectName] = useState('')
  const [subjectSaving, setSubjectSaving] = useState(false)

  // Task form
  const [subjectId, setSubjectId] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [estimatedMinutes, setEstimatedMinutes] = useState('60')
  const [deadline, setDeadline] = useState(() => new Date().toISOString().slice(0, 10))
  const [taskSaving, setTaskSaving] = useState(false)

  const subjectNameById = useMemo(() => {
    const map = new Map()
    for (const s of subjects) map.set(s.id, s.name)
    return map
  }, [subjects])

  async function loadAll() {
    setError('')
    setLoading(true)
    try {
      const [subjectsRes, tasksRes] = await Promise.all([
        apiFetch('/api/subjects'),
        apiFetch('/api/tasks'),
      ])
      setSubjects(subjectsRes.items || [])
      setTasks(tasksRes.items || [])
      if (!subjectId && (subjectsRes.items || []).length > 0) {
        setSubjectId(subjectsRes.items[0].id)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createSubject(e) {
    e.preventDefault()
    setError('')
    setSubjectSaving(true)
    try {
      const created = await apiFetch('/api/subjects', { method: 'POST', body: { name: subjectName } })
      setSubjectName('')
      setSubjects((prev) => {
        const next = [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        return next
      })
      if (!subjectId) setSubjectId(created.id)
    } catch (err) {
      setError(err?.message || 'Failed to create subject')
    } finally {
      setSubjectSaving(false)
    }
  }

  async function createTask(e) {
    e.preventDefault()
    setError('')
    setTaskSaving(true)
    try {
      const created = await apiFetch('/api/tasks', {
        method: 'POST',
        body: {
          subjectId,
          topic,
          difficulty,
          estimatedMinutes: Number(estimatedMinutes),
          deadline,
        },
      })
      setTopic('')
      setEstimatedMinutes('60')
      setDifficulty('medium')
      setDeadline(new Date().toISOString().slice(0, 10))
      setTasks((prev) => [...prev, created])
    } catch (err) {
      setError(err?.message || 'Failed to create task')
    } finally {
      setTaskSaving(false)
    }
  }

  async function markDone(taskId) {
    setError('')
    try {
      const updated = await apiFetch(`/api/tasks/${taskId}`, { method: 'PATCH', body: { status: 'done' } })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
    } catch (err) {
      setError(err?.message || 'Failed to update task')
    }
  }

  async function deleteTask(taskId) {
    setError('')
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch (err) {
      setError(err?.message || 'Failed to delete task')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Subjects & Tasks</h1>
          <p className="mt-1 text-sm text-slate-400">
            Add subjects, create tasks, and save everything to MongoDB.
          </p>
        </div>
        <Button variant="ghost" onClick={loadAll} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Subjects" subtitle="Create once, reuse for tasks">
          <form onSubmit={createSubject} className="flex gap-2">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/30"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g., Data Structures"
              required
            />
            <Button type="submit" disabled={subjectSaving}>
              {subjectSaving ? 'Adding…' : 'Add'}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            {subjects.length === 0 ? (
              <div className="text-sm text-slate-300">No subjects yet. Add your first one.</div>
            ) : (
              subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <div className="text-sm text-slate-200">{s.name}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Create task" subtitle="Deadline + difficulty helps scheduling">
          <form onSubmit={createTask} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Subject</span>
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/30"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              >
                {subjects.length === 0 ? <option value="">Add a subject first</option> : null}
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <TextField
              label="Topic"
              name="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., AVL Trees"
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Difficulty</span>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/30"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  required
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>

              <TextField
                label="Estimated minutes"
                name="estimatedMinutes"
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="60"
                required
              />
            </div>

            <TextField
              label="Deadline"
              name="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />

            <Button type="submit" disabled={taskSaving || subjects.length === 0} className="w-full">
              {taskSaving ? 'Saving…' : 'Add task'}
            </Button>
          </form>
        </Card>
      </div>

      <Card title="Your tasks" subtitle="Saved in MongoDB (sorted by deadline)">
        {loading ? (
          <div className="text-sm text-slate-300">Loading…</div>
        ) : tasks.length === 0 ? (
          <div className="text-sm text-slate-300">No tasks yet. Create one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Topic</th>
                  <th className="py-2 pr-3">Difficulty</th>
                  <th className="py-2 pr-3">Est.</th>
                  <th className="py-2 pr-3">Deadline</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tasks.map((t) => (
                  <tr key={t.id} className="text-slate-200">
                    <td className="py-3 pr-3">{subjectNameById.get(t.subjectId) || '—'}</td>
                    <td className="py-3 pr-3">{t.topic}</td>
                    <td className="py-3 pr-3">
                      <DifficultyPill value={t.difficulty} />
                    </td>
                    <td className="py-3 pr-3">{t.estimatedMinutes}m</td>
                    <td className="py-3 pr-3">{t.deadline}</td>
                    <td className="py-3 pr-3">
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs ring-1 ring-white/10">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => markDone(t.id)}
                          disabled={t.status === 'done'}
                        >
                          Mark done
                        </Button>
                        <Button variant="danger" onClick={() => deleteTask(t.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

