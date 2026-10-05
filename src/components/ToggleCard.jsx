export default function ToggleCard({
  title,
  description,
  checked,
  onChange,
  locked = false,
  lockedText = 'Always on',
  children,
}) {
  const showChildren = checked || locked;

  return (
    <div className="rounded-2xl bg-card-alt p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-bold text-cream">{title}</p>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>

        {locked ? (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-soft">
            {lockedText}
          </span>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={title}
            onClick={() => onChange(!checked)}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
              checked ? 'bg-accent' : 'bg-espresso ring-1 ring-muted/40'
            }`}
          >
            <span
              className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-cream transition-transform ${
                checked ? 'translate-x-6' : ''
              }`}
            />
          </button>
        )}
      </div>

      {showChildren && children && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
}
