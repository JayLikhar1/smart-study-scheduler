export function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  onClick,
  className = '',
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60'

  const styles =
    variant === 'ghost'
      ? 'bg-transparent text-slate-200 hover:bg-white/5 ring-1 ring-white/10'
      : variant === 'danger'
        ? 'bg-rose-500/90 text-white hover:bg-rose-500'
        : 'bg-indigo-500 text-white hover:bg-indigo-400'

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

