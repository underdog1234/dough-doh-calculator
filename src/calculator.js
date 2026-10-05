// Dough Doh Calculator: all the maths lives here. Pure functions, no React.
// Works backwards from the total dough weight the user wants.

export const BASE_HYDRATION = 65;
export const EXTRA_HYDRATION_PER_10_WHOLEMEAL = 1;
export const SALT_PERCENT = 2;
export const HOLD_BACK_SHARE = 0.08;
export const CHECK_TOLERANCE_G = 2;

export const EMPTY_WARNING =
  'Add at least one loaf or pizza ball, or the dough goblin has nothing to calculate.';
const STICKY_WARNING = 'Sticky dough alert. Use wet hands and hold back some water.';
const VERY_WET_WARNING =
  'This is very wet dough. Great for focaccia chaos, tricky for shaped loaves.';
const FAST_RISE_WARNING =
  'Fast-rise mode. Watch the dough, not the clock. It may overproof quickly.';
const STANDARD_FLOUR_WARNING =
  'Standard flour may be softer and less strong. Consider adding 1–2% vital wheat gluten.';
const WHOLEMEAL_WARNING =
  'Wholemeal dough can feel firm at first. Give it a rest before adding more flour.';

export const round = (n) => Math.round(n);
export const grams = (n) => `${Math.round(n)} g`;

export function suggestedHydration(
  wholemealPercent,
  baseHydration = BASE_HYDRATION,
  extraPer10 = EXTRA_HYDRATION_PER_10_WHOLEMEAL,
) {
  return baseHydration + (wholemealPercent / 10) * extraPer10;
}

export function calculateRecipe(input) {
  const {
    numberOfLoaves,
    loafWeight,
    numberOfPizzaBalls,
    pizzaBallWeight,
    extraDoughWeight = 0,
    flourType,
    glutenOn,
    glutenPercent,
    wholemealPercent,
    manualHydrationOn,
    manualHydration,
    baseHydration = BASE_HYDRATION,
    extraHydrationPer10 = EXTRA_HYDRATION_PER_10_WHOLEMEAL,
    mode,
    starterPercent,
    starterHydration,
    yeastPercent,
    sugarPercent,
    sugarOn,
  } = input;

  const totalDoughWeight =
    numberOfLoaves * loafWeight + numberOfPizzaBalls * pizzaBallWeight + extraDoughWeight;

  if (totalDoughWeight <= 0) {
    return { empty: true, totalDoughWeight: 0, warnings: [EMPTY_WARNING] };
  }

  const autoHydration = suggestedHydration(wholemealPercent, baseHydration, extraHydrationPer10);
  const targetHydration = manualHydrationOn ? manualHydration : autoHydration;

  // Mode decides which fermentation ingredients exist.
  const starterPercentUsed = mode === 'yeast' ? 0 : starterPercent;
  const yeastPercentUsed = mode === 'sourdough' ? 0 : yeastPercent;
  const sugarPercentUsed = mode === 'sourdough' ? (sugarOn ? sugarPercent : 0) : sugarPercent;
  const usesGluten = flourType === 'standard' && glutenOn;

  const hydration = targetHydration / 100;
  const starterRatio = starterPercentUsed / 100;
  const starterHydrationRatio = starterHydration / 100;
  const glutenRatio = usesGluten ? glutenPercent / 100 : 0;
  const saltRatio = SALT_PERCENT / 100;
  const sugarRatio = sugarPercentUsed / 100;
  const yeastRatio = yeastPercentUsed / 100;

  // Starter is part flour and part water, so it gets subtracted from the water we add.
  const starterFlourFactor = starterRatio / (1 + starterHydrationRatio);
  const starterWaterFactor = (starterRatio * starterHydrationRatio) / (1 + starterHydrationRatio);

  // With no starter (yeast-only mode) every starter term is 0, which is the yeast-only formula.
  const coefficient =
    1 +
    starterRatio +
    glutenRatio +
    saltRatio +
    sugarRatio +
    yeastRatio +
    hydration * (1 + starterFlourFactor + glutenRatio) -
    starterWaterFactor;

  const mainFlour = totalDoughWeight / coefficient;

  const wholemealFlour = mainFlour * (wholemealPercent / 100);
  const whiteFlour = mainFlour - wholemealFlour;
  const starterWeight = mainFlour * starterRatio;
  const starterFlour = starterWeight / (1 + starterHydrationRatio);
  const starterWater = starterWeight - starterFlour;
  const gluten = mainFlour * glutenRatio;
  const salt = mainFlour * saltRatio;
  const sugar = mainFlour * sugarRatio;
  const yeast = mainFlour * yeastRatio;
  const addedWater = hydration * (mainFlour + starterFlour + gluten) - starterWater;

  const holdBackWater = round(addedWater * HOLD_BACK_SHARE);
  const addFirstWater = round(addedWater) - holdBackWater;

  const ingredients = [
    whiteFlour > 0 && { key: 'white', label: 'White flour', grams: round(whiteFlour) },
    wholemealFlour > 0 && { key: 'wholemeal', label: 'Wholemeal flour', grams: round(wholemealFlour) },
    { key: 'water', label: 'Water', grams: round(addedWater) },
    starterWeight > 0 && {
      key: 'starter',
      label: 'Ripe sourdough starter',
      grams: round(starterWeight),
      note: `Contains ${round(starterFlour)} g flour + ${round(starterWater)} g water (already counted in the water)`,
    },
    { key: 'salt', label: 'Salt', grams: round(salt) },
    sugar > 0 && { key: 'sugar', label: 'Sugar', grams: round(sugar) },
    yeast > 0 && { key: 'yeast', label: 'Instant yeast', grams: round(yeast) },
    gluten > 0 && { key: 'gluten', label: 'Vital wheat gluten', grams: round(gluten) },
  ].filter(Boolean);

  const calculated = ingredients.reduce((sum, item) => sum + item.grams, 0);
  const target = round(totalDoughWeight);
  const check = {
    calculated,
    target,
    ok: Math.abs(calculated - target) <= CHECK_TOLERANCE_G,
  };

  const portions = [
    numberOfLoaves > 0 && {
      count: numberOfLoaves,
      weight: loafWeight,
      singular: 'loaf',
      plural: 'loaves',
    },
    numberOfPizzaBalls > 0 && {
      count: numberOfPizzaBalls,
      weight: pizzaBallWeight,
      singular: 'pizza ball',
      plural: 'pizza balls',
    },
  ].filter(Boolean);

  const warnings = [];
  if (targetHydration > 75) warnings.push(STICKY_WARNING);
  if (targetHydration > 82) warnings.push(VERY_WET_WARNING);
  if (yeastPercentUsed > 1) warnings.push(FAST_RISE_WARNING);
  if (flourType === 'standard' && !glutenOn) warnings.push(STANDARD_FLOUR_WARNING);
  if (wholemealPercent >= 50) warnings.push(WHOLEMEAL_WARNING);
  if (!check.ok) {
    warnings.push(
      `Dough check is off by ${Math.abs(calculated - target)} g. Weigh everything again before mixing.`,
    );
  }

  return {
    empty: false,
    mode,
    totalDoughWeight,
    portions,
    autoHydration,
    targetHydration,
    ingredients,
    addFirstWater,
    holdBackWater,
    check,
    warnings,
  };
}

const plural = (portion) => (portion.count === 1 ? portion.singular : portion.plural);

const round1 = (n) => Math.round(n * 10) / 10;

// Plain text for the Copy recipe button.
export function formatRecipeText(result) {
  if (result.empty) return '';

  const lines = ['Dough Recipe', '', 'Portions:'];
  for (const p of result.portions) {
    lines.push(`- ${p.count} ${plural(p)} @ ${p.weight} g`);
  }

  lines.push('', `Total dough: ${grams(result.totalDoughWeight)}`, '', 'Ingredients:');
  for (const item of result.ingredients) {
    lines.push(`- ${item.label}: ${item.grams} g${item.note ? ` (${item.note})` : ''}`);
  }

  lines.push(
    '',
    'Hydration:',
    `- Target hydration: ${round1(result.targetHydration)}%`,
    `- Add first water: ${result.addFirstWater} g`,
    `- Hold back water: ${result.holdBackWater} g`,
    '',
    'Portioning:',
  );
  for (const p of result.portions) {
    lines.push(`- ${p.count} × ${p.weight} g ${plural(p)}`);
  }

  return lines.join('\n');
}

export { round1 };
