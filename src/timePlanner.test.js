import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planTimeline, estimateFerment } from './timePlanner.js';

const NOW = new Date('2026-10-12T09:00:00');
const hoursLater = (h) => new Date(NOW.getTime() + h * 3_600_000);

test('A comfortable same-day window needs no recipe change', () => {
  const plan = planTimeline({
    mode: 'sourdough',
    starterPercent: 20,
    starterHydration: 100,
    yeastPercent: 0,
    bakeAt: hoursLater(8),
    now: NOW,
  });
  assert.equal(plan.feasible, true);
  assert.equal(plan.planType, 'same-day');
  assert.equal(plan.suggestion, null);
  // Schedule starts near "now" and the last step is the bake time.
  assert.equal(plan.steps.at(-1).label, 'Bake!');
  assert.equal(plan.steps.at(-1).time.getTime(), hoursLater(8).getTime());
  assert.ok(plan.steps.every((s, i) => i === 0 || s.time >= plan.steps[i - 1].time));
});

test('A bake time days away suggests an overnight cold retard', () => {
  const plan = planTimeline({
    mode: 'sourdough',
    starterPercent: 20,
    starterHydration: 100,
    yeastPercent: 0,
    bakeAt: hoursLater(30),
    now: NOW,
  });
  assert.equal(plan.feasible, true);
  assert.equal(plan.planType, 'overnight');
  assert.ok(plan.retardHours > 4);
  assert.ok(plan.steps.some((s) => s.label.includes('fridge')));
});

test('Too little time suggests a bigger starter to speed things up', () => {
  const plan = planTimeline({
    mode: 'sourdough',
    starterPercent: 20,
    starterHydration: 100,
    yeastPercent: 0,
    bakeAt: hoursLater(6),
    now: NOW,
  });
  assert.equal(plan.feasible, true);
  assert.equal(plan.planType, 'rushed');
  assert.ok(plan.suggestion.starterPercent > 20);
});

test('An impossibly soon bake time is marked infeasible with a best-effort schedule', () => {
  const plan = planTimeline({
    mode: 'sourdough',
    starterPercent: 20,
    starterHydration: 100,
    yeastPercent: 0,
    bakeAt: hoursLater(1),
    now: NOW,
  });
  assert.equal(plan.feasible, false);
  assert.match(plan.message, /hours/);
  assert.ok(plan.steps.length > 0);
});

test('A bake time in the past is rejected outright', () => {
  const plan = planTimeline({
    mode: 'yeast',
    starterPercent: 0,
    starterHydration: 100,
    yeastPercent: 1,
    bakeAt: hoursLater(-1),
    now: NOW,
  });
  assert.equal(plan.feasible, false);
  assert.equal(plan.steps, undefined);
});

test('More starter/yeast means a shorter estimated ferment', () => {
  const slow = estimateFerment('sourdough', 10, 0);
  const fast = estimateFerment('sourdough', 30, 0);
  assert.ok(fast.bulkHours < slow.bulkHours);
});
