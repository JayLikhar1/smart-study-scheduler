export function TextField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  error,
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-0 transition focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/30"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />
      {error ? <div className="mt-2 text-xs text-rose-300">{error}</div> : null}
    </label>
  )
}

