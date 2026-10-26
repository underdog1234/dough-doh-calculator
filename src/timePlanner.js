// Optional time planning: given a bake time (today or days away), build a schedule
// working forward from now, and — if the clock is too tight or there's time to spare —
// suggest a starter/yeast percent that fits the window instead.
//
// This is a guide, not a lab result: real fermentation speed depends on room
// temperature, flour, and the starter's own mood. The numbers below are rough
// anchors for a ~21°C kitchen.

const MIX_MINUTES = 20; // flour + water rest (autolyse) before adding starter/yeast
const SHAPE_MINUTES = 15; // dividing and shaping, after bulk ferment
const FOLD_WINDOW_SHARE = 0.7; // folds happen across the first 70% of bulk ferment
const OVERNIGHT_THRESHOLD_HOURS = 4; // slack beyond "needed" before we suggest a cold retard
const LONG_RETARD_HOURS = 16; // above this, flag that it's a long, tangy retard

// Anchor: at `bulkAnchorPercent` starter/yeast, bulk ferment takes `bulkAnchorHours`.
// Bulk hours scale inversely with percent (more starter/yeast = faster).
const FERMENT_MODEL = {
  sourdough: {
    proofHours: 2,
    bulkAnchorHours: 5,
    bulkAnchorPercent: 20,
    minBulkHours: 2.5,
    maxBulkHours: 14,
    minPercent: 5,
    maxPercent: 50,
  },
  hybrid: {
    proofHours: 1,
    bulkAnchorHours: 2.5,
    bulkAnchorPercent: 0.2,
    minBulkHours: 1,
    maxBulkHours: 8,
    minPercent: 0.1,
    maxPercent: 1,
  },
  yeast: {
    proofHours: 0.75,
    bulkAnchorHours: 1.25,
    bulkAnchorPercent: 1,
    minBulkHours: 0.5,
    maxBulkHours: 4,
    minPercent: 0.2,
    maxPercent: 1.5,
  },
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round1 = (n) => Math.round(n * 10) / 10;
const roundTo = (n, step) => Math.round(n / step) * step;
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60_000);

// The percent that actually drives fermentation speed in each mode.
const drivingPercent = (mode, starterPercent, yeastPercent) =>
  mode === 'sourdough' ? starterPercent : yeastPercent;

function bulkHoursForPercent(mode, percent) {
  const m = FERMENT_MODEL[mode];
  const safePercent = clamp(percent, m.minPercent, m.maxPercent);
  const hours = m.bulkAnchorHours * (m.bulkAnchorPercent / safePercent);
  return clamp(hours, m.minBulkHours, m.maxBulkHours);
}

function percentForBulkHours(mode, desiredBulkHours) {
  const m = FERMENT_MODEL[mode];
  const clampedHours = clamp(desiredBulkHours, m.minBulkHours, m.maxBulkHours);
  const percent = (m.bulkAnchorHours * m.bulkAnchorPercent) / clampedHours;
  return clamp(percent, m.minPercent, m.maxPercent);
}

export function estimateFerment(mode, starterPercent, yeastPercent) {
  const m = FERMENT_MODEL[mode];
  const percent = drivingPercent(mode, starterPercent, yeastPercent);
  const bulkHours = bulkHoursForPercent(mode, percent);
  return { bulkHours, proofHours: m.proofHours, totalHours: bulkHours + m.proofHours };
}

function leavenStepLabel(mode) {
  if (mode === 'sourdough') return 'Add ripe starter and salt. Mix until combined.';
  if (mode === 'hybrid') return 'Add starter, yeast and salt. Mix until combined.';
  return 'Add yeast, sugar and salt. Mix until combined.';
}

/**
 * Build a schedule from now until `bakeAt`, adjusting the ferment speed (and
 * saying so) if the window is too tight, or adding an overnight cold retard
 * if the bake genuinely falls on a later calendar day. A same-day bake never
 * gets a fridge step — however much slack there is, it's still just bulk
 * ferment, shape, final proof, then bake; a big same-day gap instead suggests
 * a smaller starter/yeast amount to naturally slow the ferment to fit.
 */
export function planTimeline({ mode, starterPercent, yeastPercent, bakeAt, now = new Date() }) {
  const hoursAvailable = (bakeAt.getTime() - now.getTime()) / 3_600_000;
  const prepHours = (MIX_MINUTES + SHAPE_MINUTES) / 60;
  const m = FERMENT_MODEL[mode];

  if (!Number.isFinite(hoursAvailable) || hoursAvailable < 0.5) {
    return {
      feasible: false,
      hoursAvailable,
      message:
        hoursAvailable < 0
          ? "That bake time has already passed. Pick one in the future."
          : 'Pick a bake time at least an hour from now.',
      steps: [],
    };
  }

  const sameDay = bakeAt.toDateString() === now.toDateString();
  const current = estimateFerment(mode, starterPercent, yeastPercent);
  const neededHours = current.totalHours + prepHours;

  let planType = 'same-day';
  let usedStarterPercent = starterPercent;
  let usedYeastPercent = yeastPercent;
  let ferment = current;
  let retardHours = 0;
  let suggestion = null;
  let infeasible = false;
  let message = 'A comfortable window: bulk ferment, shape, final proof, then bake.';

  const tooTight = hoursAvailable < neededHours - 0.5;
  const tooSlack = hoursAvailable > neededHours + OVERNIGHT_THRESHOLD_HOURS;

  if (tooTight) {
    const desiredBulk = hoursAvailable - prepHours - m.proofHours;

    if (desiredBulk < m.minBulkHours) {
      infeasible = true;
      planType = 'rushed';
      const fastestTotal = m.minBulkHours + m.proofHours + prepHours;
      usedStarterPercent = mode === 'sourdough' ? m.maxPercent : starterPercent;
      usedYeastPercent = mode !== 'sourdough' ? m.maxPercent : yeastPercent;
      ferment = { bulkHours: m.minBulkHours, proofHours: m.proofHours, totalHours: m.minBulkHours + m.proofHours };
      message = `Even flat out, this dough needs about ${round1(fastestTotal)} hours. Push the bake time back, or switch to a faster mode (yeast-only is quickest).`;
    } else {
      planType = 'rushed';
      const neededPercent = percentForBulkHours(mode, desiredBulk);
      if (mode === 'sourdough') usedStarterPercent = Math.round(neededPercent);
      else usedYeastPercent = roundTo(neededPercent, 0.1);
      ferment = estimateFerment(mode, usedStarterPercent, usedYeastPercent);
      suggestion = { starterPercent: usedStarterPercent, yeastPercent: usedYeastPercent };
      message = 'Tight timing. Use a bigger starter/yeast amount to speed the ferment up to fit.';
    }
  } else if (tooSlack && !sameDay) {
    planType = 'overnight';
    retardHours = hoursAvailable - neededHours;
    message =
      retardHours > LONG_RETARD_HOURS
        ? "That's a long, slow cold retard — expect a tangier, flatter result, but it'll bake up fine."
        : 'Plenty of time. Bulk ferment at room temperature, then shape and finish proofing slowly in the fridge overnight.';
  } else if (tooSlack && sameDay) {
    // Same calendar day, but with hours to spare: no fridge, no "until bake
    // day" — just slow the ferment down to fill the day instead.
    const desiredBulk = hoursAvailable - prepHours - m.proofHours;
    const neededPercent = percentForBulkHours(mode, desiredBulk);
    planType = 'stretched';
    if (mode === 'sourdough') usedStarterPercent = Math.round(neededPercent);
    else usedYeastPercent = roundTo(neededPercent, 0.1);
    ferment = estimateFerment(mode, usedStarterPercent, usedYeastPercent);
    const reachedTheCap = ferment.bulkHours < desiredBulk - 0.5;
    suggestion = reachedTheCap ? null : { starterPercent: usedStarterPercent, yeastPercent: usedYeastPercent };
    message = reachedTheCap
      ? "That's a long same-day gap — even the slowest sensible bulk ferment will be ready well before your bake time. Either push the bake time out to tomorrow for a proper overnight retard, or just plan on the dough waiting (loosely covered, out of the way of direct heat) for a while before baking."
      : 'Lots of time today. Use a smaller starter/yeast amount to naturally stretch the ferment to fit.';
  }

  // Build the schedule, anchored to "now" and ending at the chosen bake time.
  const mixAt = roundToNext5Minutes(now);
  const leavenAt = addMinutes(mixAt, MIX_MINUTES);
  const bulkEndAt = addMinutes(leavenAt, ferment.bulkHours * 60);
  const afterShapeAt = addMinutes(bulkEndAt, SHAPE_MINUTES);

  const steps = [
    { time: mixAt, label: 'Mix flour and most of the water. Rest (autolyse).' },
    { time: leavenAt, label: leavenStepLabel(mode) },
  ];

  if (ferment.bulkHours >= 0.75) {
    const foldCount = ferment.bulkHours >= 2 ? 4 : ferment.bulkHours >= 1.25 ? 3 : 2;
    const foldWindowMinutes = ferment.bulkHours * 60 * FOLD_WINDOW_SHARE;
    for (let i = 1; i <= foldCount; i += 1) {
      const at = addMinutes(leavenAt, (foldWindowMinutes / (foldCount + 1)) * i);
      steps.push({ time: at, label: `Stretch and fold #${i}` });
    }
  }

  steps.push({ time: bulkEndAt, label: 'Bulk ferment done — divide and shape.' });

  if (planType === 'overnight') {
    const restBeforeBakeMinutes = 20;
    const outOfFridgeAt = addMinutes(bakeAt, -restBeforeBakeMinutes);
    steps.push({ time: afterShapeAt, label: 'Into the fridge (cold retard) until bake day.' });
    if (outOfFridgeAt.getTime() > afterShapeAt.getTime()) {
      steps.push({ time: outOfFridgeAt, label: 'Out of the fridge. Let the oven heat while it loses the chill.' });
    }
  } else {
    steps.push({ time: afterShapeAt, label: 'Final proof.' });
  }

  steps.push({ time: bakeAt, label: 'Bake!' });

  return {
    feasible: !infeasible,
    planType,
    hoursAvailable,
    ferment,
    retardHours,
    usedStarterPercent,
    usedYeastPercent,
    suggestion,
    message,
    steps,
  };
}

function roundToNext5Minutes(date) {
  const ms = 5 * 60_000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}
