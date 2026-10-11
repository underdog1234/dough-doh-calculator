import { useEffect, useMemo, useRef, useState } from 'react';
import { planTimeline } from '../timePlanner.js';
import { applyProgress, completeStep, nextPendingIndex, scheduleKey } from '../scheduleProgress.js';
import { notificationPermission, requestNotificationPermission, showStepNotification } from '../notifications.js';
import Card from './Card.jsx';
import ToggleCard from './ToggleCard.jsx';

const SNOOZE_MINUTES = 10;
const CHECK_INTERVAL_MS = 15_000;

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
  const [now, setNow] = useState(() => new Date());
  const [permission, setPermission] = useState(() => notificationPermission());
  const notifiedForRef = useRef(null); // last "index@time" we already fired a notification for

  const timeline = useMemo(() => {
    if (!plan.enabled || !plan.bakeAt) return null;
    const bakeAt = new Date(plan.bakeAt);
    if (Number.isNaN(bakeAt.getTime())) return null;
    return planTimeline({ mode, starterPercent, yeastPercent, bakeAt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.enabled, plan.bakeAt, mode, starterPercent, yeastPercent]);

  const rawSteps = timeline?.steps ?? [];
  // Empty until there's an actual schedule, so an empty plan never fights
  // with the (also empty) default planKey on first render.
  const key = useMemo(() => (rawSteps.length > 0 ? scheduleKey(plan.bakeAt, rawSteps) : ''), [plan.bakeAt, rawSteps]);

  // If the schedule's shape changed (different mode, starter/yeast amount, or
  // bake time), the old progress no longer lines up — start over.
  useEffect(() => {
    if (key && plan.planKey !== key) {
      onPlanChange({
        ...plan,
        planKey: key,
        lastCompletedIndex: -1,
        driftMs: 0,
        snoozeStepIndex: null,
        snoozeUntil: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const progress = useMemo(
    () => ({ lastCompletedIndex: plan.lastCompletedIndex, driftMs: plan.driftMs }),
    [plan.lastCompletedIndex, plan.driftMs],
  );
  const adjustedSteps = useMemo(() => applyProgress(rawSteps, progress), [rawSteps, progress]);
  const nextIndex = plan.planKey === key ? nextPendingIndex(adjustedSteps, progress) : null;
  const nextStep = nextIndex !== null ? adjustedSteps[nextIndex] : null;

  const snoozeActive =
    plan.snoozeStepIndex === nextIndex && plan.snoozeUntil && new Date(plan.snoozeUntil) > now;
  const effectiveDueAt = snoozeActive ? new Date(plan.snoozeUntil) : nextStep?.time ?? null;
  const isDue = Boolean(effectiveDueAt && now >= effectiveDueAt);

  // Tick every 15s to re-check due-ness. A plain interval (rather than one
  // precise setTimeout) survives re-renders and the odd throttled background
  // tab without extra bookkeeping — worst case a reminder is a few seconds late.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!plan.notifyEnabled || !nextStep || !effectiveDueAt || now < effectiveDueAt) return;
    const firedKey = `${nextIndex}@${effectiveDueAt.getTime()}`;
    if (notifiedForRef.current === firedKey) return;
    notifiedForRef.current = firedKey;
    showStepNotification({
      title: "Dough Doh: it's time",
      body: nextStep.label,
      tag: `dough-doh-step-${plan.planKey}`,
    });
  }, [plan.notifyEnabled, plan.planKey, nextIndex, nextStep, effectiveDueAt, now]);

  const markDone = () => {
    if (nextIndex === null || !nextStep) return;
    const updated = completeStep(progress, nextIndex, nextStep.time, new Date());
    notifiedForRef.current = null;
    onPlanChange({
      ...plan,
      lastCompletedIndex: updated.lastCompletedIndex,
      driftMs: updated.driftMs,
      snoozeStepIndex: null,
      snoozeUntil: '',
    });
  };

  const snooze = () => {
    if (nextIndex === null) return;
    notifiedForRef.current = null;
    onPlanChange({
      ...plan,
      snoozeStepIndex: nextIndex,
      snoozeUntil: new Date(Date.now() + SNOOZE_MINUTES * 60_000).toISOString(),
    });
  };

  const toggleNotify = async (on) => {
    if (on) {
      const result = await requestNotificationPermission();
      setPermission(result);
    }
    onPlanChange({ ...plan, notifyEnabled: on });
  };

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

            {adjustedSteps.length > 0 && (
              <ToggleCard
                title="Notify me for each step"
                description={
                  plan.notifyEnabled && permission === 'denied'
                    ? "Notifications are blocked in your browser. You'll still see reminders in this card while it's open."
                    : "We'll remind you here, and send a notification if your browser allows it. Only works while this app is open somewhere — there's no server behind it to wake a closed app overnight."
                }
                checked={plan.notifyEnabled}
                onChange={toggleNotify}
              >
                {nextStep ? (
                  <div
                    className={`rounded-2xl p-3 ${isDue ? 'bg-accent text-espresso' : 'bg-espresso text-cream'}`}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide opacity-80">
                      {isDue ? 'Due now' : 'Up next'}
                    </p>
                    <p className="font-bold">{nextStep.label}</p>
                    <p className="text-sm opacity-80">
                      {snoozeActive ? 'Snoozed until ' : 'Scheduled for '}
                      {timeFormat.format(effectiveDueAt)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={markDone}
                        className="rounded-xl bg-accent px-3 py-2 text-sm font-bold text-espresso active:scale-95"
                      >
                        Mark done
                      </button>
                      <button
                        type="button"
                        onClick={snooze}
                        className="rounded-xl bg-card-alt px-3 py-2 text-sm font-bold text-cream ring-1 ring-muted/30 active:scale-95"
                      >
                        Snooze {SNOOZE_MINUTES} min
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-success">All steps done. Happy baking.</p>
                )}
              </ToggleCard>
            )}

            {adjustedSteps.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Schedule</h3>
                <ol className="space-y-2">
                  {adjustedSteps.map((step, index) => {
                    const done = index <= plan.lastCompletedIndex;
                    const current = index === nextIndex;
                    return (
                      <li
                        key={index}
                        className={`flex items-baseline justify-between gap-3 border-b border-card-alt py-1.5 last:border-0 ${
                          done ? 'opacity-50' : ''
                        }`}
                      >
                        <span className={`text-cream ${done ? 'line-through' : ''} ${current ? 'font-bold' : ''}`}>
                          {done ? '✓ ' : ''}
                          {step.label}
                        </span>
                        <span className="shrink-0 text-sm font-bold text-accent-soft">{timeFormat.format(step.time)}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>
        )}
      </ToggleCard>
    </Card>
  );
}
