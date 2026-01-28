import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api.js'

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [reminder, setReminder] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/notifications')
      setItems(data?.items ?? [])
      setReminder(data?.reminder ?? null)
      setUnreadCount(data?.unreadCount ?? 0)
    } catch {
      setItems([])
      setReminder(null)
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  useEffect(() => {
    function onDocumentClick(e) {
      if (open && !e.target.closest('[data-notifications-root]')) setOpen(false)
    }
    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [open])

  async function markRead(id) {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'PATCH', body: { read: true } })
      await fetchNotifications()
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" data-notifications-root>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-slate-300 hover:bg-white/5"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="text-sm font-semibold text-slate-100">Notifications</div>
            <div className="text-xs text-slate-400">Study reminders and missed task alerts</div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-400">Loading…</div>
            ) : (
              <>
                {reminder && (
                  <div className="border-b border-white/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20">
                        <span className="text-sm">📚</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-100">{reminder.title}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{reminder.body}</div>
                      </div>
                    </div>
                  </div>
                )}
                {items.length === 0 && !reminder ? (
                  <div className="p-4 text-center text-sm text-slate-400">No notifications yet.</div>
                ) : (
                  items.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => !n.read && markRead(n.id)}
                      className={`flex w-full items-start gap-3 border-b border-white/5 p-4 text-left transition hover:bg-white/5 last:border-0 ${n.read ? 'opacity-70' : ''}`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
                        <span className="text-sm">⚠</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-100">{n.title}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{n.body}</div>
                        {!n.read && (
                          <div className="mt-1.5 text-xs text-indigo-300">Tap to mark as read</div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
