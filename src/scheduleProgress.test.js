import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyProgress, completeStep, INITIAL_PROGRESS, nextPendingIndex, scheduleKey } from './scheduleProgress.js';

const steps = [
  { time: new Date('2026-10-12T09:00:00'), label: 'Mix' },
  { time: new Date('2026-10-12T09:20:00'), label: 'Add starter and salt' },
  { time: new Date('2026-10-12T10:00:00'), label: 'Fold #1' },
  { time: new Date('2026-10-12T14:00:00'), label: 'Bake!' },
];

test('No progress yet: nothing shifts, next step is the first one', () => {
  assert.equal(applyProgress(steps, INITIAL_PROGRESS), steps);
  assert.equal(nextPendingIndex(steps, INITIAL_PROGRESS), 0);
});

test('Finishing a step late pushes every later step back by the same amount', () => {
  // Step 0 (Mix) was scheduled for 9:00 but actually happened at 9:15 — 15 min late.
  const progress = completeStep(INITIAL_PROGRESS, 0, steps[0].time, new Date('2026-10-12T09:15:00'));
  assert.equal(progress.lastCompletedIndex, 0);
  assert.equal(progress.driftMs, 15 * 60_000);

  const adjusted = applyProgress(steps, progress);
  assert.equal(adjusted[0].time.getTime(), steps[0].time.getTime(), 'completed step itself is untouched');
  assert.equal(adjusted[1].time.getTime(), steps[1].time.getTime() + 15 * 60_000);
  assert.equal(adjusted[3].time.getTime(), steps[3].time.getTime() + 15 * 60_000);
  assert.equal(nextPendingIndex(steps, progress), 1);
});

test('Finishing a step early pulls the rest of the day forward', () => {
  const progress = completeStep(INITIAL_PROGRESS, 0, steps[0].time, new Date('2026-10-12T08:50:00'));
  assert.equal(progress.driftMs, -10 * 60_000);
  const adjusted = applyProgress(steps, progress);
  assert.equal(adjusted[3].time.getTime(), steps[3].time.getTime() - 10 * 60_000);
});

test('Drift compounds across multiple completed steps', () => {
  let progress = completeStep(INITIAL_PROGRESS, 0, steps[0].time, new Date('2026-10-12T09:10:00')); // +10m
  const adjustedAfterFirst = applyProgress(steps, progress);
  // Step 1 was adjusted to 9:30; actually happens at 9:50 -> another +20m.
  progress = completeStep(progress, 1, adjustedAfterFirst[1].time, new Date('2026-10-12T09:50:00'));
  assert.equal(progress.driftMs, 30 * 60_000);

  const adjusted = applyProgress(steps, progress);
  assert.equal(adjusted[3].time.getTime(), steps[3].time.getTime() + 30 * 60_000);
  assert.equal(nextPendingIndex(steps, progress), 2);
});

test('All steps completed means no pending step', () => {
  const progress = { lastCompletedIndex: steps.length - 1, driftMs: 0 };
  assert.equal(nextPendingIndex(steps, progress), null);
});

test('scheduleKey changes when the bake time or the step labels change', () => {
  const a = scheduleKey('2026-10-13T08:00', steps);
  const b = scheduleKey('2026-10-13T08:00', steps);
  const c = scheduleKey('2026-10-14T08:00', steps);
  const d = scheduleKey('2026-10-13T08:00', [...steps, { time: new Date(), label: 'Extra fold' }]);
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.notEqual(a, d);
});
