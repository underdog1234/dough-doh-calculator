// Pure helpers for tracking progress through a bake-time schedule: which step
// you're on, and re-anchoring the remaining steps when a step is actually
// completed early or late, so the plan stays honest instead of silently
// drifting from reality.

// A stable-ish fingerprint of a schedule's shape. Changes when the mode,
// starter/yeast amount, or bake time change enough to produce a different
// step list — which is when progress should reset.
export function scheduleKey(bakeAt, steps) {
  return `${bakeAt}::${steps.map((s) => s.label).join('|')}`;
}

export const INITIAL_PROGRESS = { lastCompletedIndex: -1, driftMs: 0 };

// Shift every step after the last completed one by the accumulated drift, so
// a step finished early or late carries forward to the rest of the day.
export function applyProgress(steps, progress) {
  if (!progress.driftMs) return steps;
  return steps.map((step, index) =>
    index > progress.lastCompletedIndex ? { ...step, time: new Date(step.time.getTime() + progress.driftMs) } : step,
  );
}

export function nextPendingIndex(steps, progress) {
  const next = progress.lastCompletedIndex + 1;
  return next < steps.length ? next : null;
}

// Mark `stepIndex` (whose current, already-adjusted time is `scheduledTime`)
// done at `completedAt`, and carry the difference forward onto later steps.
export function completeStep(progress, stepIndex, scheduledTime, completedAt) {
  const deltaMs = completedAt.getTime() - scheduledTime.getTime();
  return { lastCompletedIndex: stepIndex, driftMs: progress.driftMs + deltaMs };
}
