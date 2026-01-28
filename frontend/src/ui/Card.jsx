export function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/5 p-5 ${className}`}>
      {title ? (
        <div className="mb-4">
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-400">{subtitle}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

