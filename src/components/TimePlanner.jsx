import { useMemo } from 'react';
import { planTimeline } from '../timePlanner.js';
import Card from './Card.jsx';
import ToggleCard from './ToggleCard.jsx';

const timeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TimePlanner({ plan, onPlanChange, mode, starterPercent, yeastPercent, onApplySuggestion }) {
  const minBakeAt = useMemo(() => toLocalInputValue(new Date(Date.now() + 60 * 60_000)), []);

  const timeline = useMemo(() => {
    if (!plan.enabled || !plan.bakeAt) return null;
    const bakeAt = new Date(plan.bakeAt);
    if (Number.isNaN(bakeAt.getTime())) return null;
    return planTimeline({ mode, starterPercent, yeastPercent, bakeAt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.enabled, plan.bakeAt, mode, starterPercent, yeastPercent]);

  return (
    <Card title="Time planning" subtitle="Optional. Pick when you want to bake — even tomorrow — and get a schedule.">
      <ToggleCard
        title="Plan around a bake time"
        description="We'll work backwards from now and build a stretch-and-fold schedule."
        checked={plan.enabled}
        onChange={(on) => onPlanChange({ ...plan, enabled: on })}
      >
        <div>
          <label className="mb-1 block text-sm font-semibold text-muted" htmlFor="bake-at">
            Bake time
          </label>
          <input
            id="bake-at"
            type="datetime-local"
            min={minBakeAt}
            value={plan.bakeAt}
            onChange={(e) => onPlanChange({ ...plan, bakeAt: e.target.value })}
            className="w-full rounded-2xl bg-espresso px-4 py-3 text-lg font-semibold text-cream ring-1 ring-card-alt focus:ring-2 focus:ring-accent outline-none"
          />
        </div>

        {plan.bakeAt && !timeline && (
          <p className="text-sm text-warn">That doesn't look like a valid date and time yet.</p>
        )}

        {timeline && (
          <div className="space-y-3">
            <p className={`text-sm font-semibold ${timeline.feasible ? 'text-accent-soft' : 'text-warn'}`}>
              {timeline.message}
            </p>

            {timeline.suggestion && (
              <div className="rounded-2xl bg-espresso p-3">
                <p className="text-sm text-cream">
                  Suggested{' '}
                  {mode === 'sourdough'
                    ? `starter: ${timeline.suggestion.starterPercent}%`
                    : `instant yeast: ${timeline.suggestion.yeastPercent}%`}{' '}
                  to fit this window.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onApplySuggestion({
                      starterPercent: timeline.suggestion.starterPercent,
                      yeastPercent: timeline.suggestion.yeastPercent,
                    })
                  }
                  className="mt-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-espresso active:scale-95"
                >
                  Use this amount
                </button>
              </div>
            )}

            {timeline.steps?.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Schedule</h3>
                <ol className="space-y-2">
                  {timeline.steps.map((step, index) => (
                    <li key={index} className="flex items-baseline justify-between gap-3 border-b border-card-alt py-1.5 last:border-0">
                      <span className="text-cream">{step.label}</span>
                      <span className="shrink-0 text-sm font-bold text-accent-soft">{timeFormat.format(step.time)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </ToggleCard>
    </Card>
  );
}
