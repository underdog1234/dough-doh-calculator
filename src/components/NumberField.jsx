import { useEffect, useId, useState } from 'react';

export default function NumberField({ label, value, onChange, min = 0, max, step = 1, unit = 'g', hint }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));

  // Sync the typed text when the parent changes the value (e.g. reset or +/-).
  useEffect(() => {
    if (parseFloat(draft) !== value) setDraft(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const clamp = (n) => Math.min(max ?? Infinity, Math.max(min, n));

  const nudge = (direction) => {
    onChange(clamp(Number((value + direction * step).toFixed(2))));
  };

  const handleChange = (e) => {
    setDraft(e.target.value);
    const n = parseFloat(e.target.value);
    if (Number.isFinite(n) && n >= 0) onChange(n);
  };

  const handleBlur = () => {
    const n = parseFloat(draft);
    const next = clamp(Number.isFinite(n) ? n : min);
    onChange(next);
    setDraft(String(next));
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-muted">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label={`Decrease ${label}`}
          className="w-14 shrink-0 rounded-2xl bg-card-alt text-2xl font-bold text-cream active:scale-95"
        >
          −
        </button>
        <div className="flex flex-1 items-center rounded-2xl bg-espresso px-3 ring-1 ring-card-alt focus-within:ring-2 focus-within:ring-accent">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            max={max}
            value={draft}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full min-w-0 bg-transparent py-3 text-center text-xl font-bold text-cream outline-none"
          />
          <span className="ml-1 shrink-0 text-sm text-muted">{unit}</span>
        </div>
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label={`Increase ${label}`}
          className="w-14 shrink-0 rounded-2xl bg-accent text-2xl font-bold text-espresso active:scale-95"
        >
          +
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
