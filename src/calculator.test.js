import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRecipe, formatRecipeText } from './calculator.js';
import { DEFAULTS, MODE_DEFAULTS } from './defaults.js';

const find = (result, key) => result.ingredients.find((i) => i.key === key);

test('Test 1: default sourdough', () => {
  const r = calculateRecipe(DEFAULTS);
  assert.equal(r.totalDoughWeight, 2750);
  assert.equal(find(r, 'yeast'), undefined, 'no yeast in sourdough mode');
  assert.ok(find(r, 'starter'), 'starter shown');
  assert.equal(r.check.ok, true);

  // Water must be reduced by the water already in the starter.
  const main = find(r, 'white').grams;
  const starter = find(r, 'starter').grams;
  const starterFlour = starter / 2;
  const expectedWater = 0.65 * (main + starterFlour) - starter / 2;
  assert.ok(Math.abs(find(r, 'water').grams - expectedWater) < 2);
});

test('Test 2: 50% wholemeal', () => {
  const r = calculateRecipe({
    ...DEFAULTS,
    wholemealPercent: 50,
    baseHydration: 65,
    extraHydrationPer10: 1,
  });
  assert.equal(r.targetHydration, 70);
  assert.ok(Math.abs(find(r, 'white').grams - find(r, 'wholemeal').grams) <= 1);
  assert.ok(r.warnings.some((w) => w.startsWith('Wholemeal dough')));
  assert.equal(r.check.ok, true);
});

test('Test 3: yeast only', () => {
  const r = calculateRecipe({ ...DEFAULTS, ...MODE_DEFAULTS.yeast, mode: 'yeast' });
  assert.equal(find(r, 'starter'), undefined, 'no starter in yeast mode');
  assert.ok(find(r, 'yeast'), 'yeast shown');
  assert.ok(find(r, 'sugar'), 'sugar shown');
  assert.equal(r.check.ok, true);
});

test('Test 4: standard flour with gluten', () => {
  const r = calculateRecipe({ ...DEFAULTS, flourType: 'standard', glutenOn: true, glutenPercent: 2 });
  assert.ok(find(r, 'gluten'), 'gluten shown');
  assert.equal(r.check.target, 2750);
  assert.equal(r.check.ok, true);
  assert.ok(!r.warnings.some((w) => w.includes('vital wheat gluten')));
});

test('Test 4b: standard flour without gluten warns and hides gluten', () => {
  const r = calculateRecipe({ ...DEFAULTS, flourType: 'standard', glutenOn: false });
  assert.equal(find(r, 'gluten'), undefined);
  assert.ok(r.warnings.some((w) => w.startsWith('Standard flour may be softer')));
});

test('Test 5: high hydration warnings', () => {
  const r = calculateRecipe({
    ...DEFAULTS,
    wholemealPercent: 100,
    baseHydration: 70,
    extraHydrationPer10: 1.5,
  });
  assert.equal(r.targetHydration, 85);
  assert.ok(r.warnings.some((w) => w.startsWith('Sticky dough alert')));
  assert.ok(r.warnings.some((w) => w.startsWith('This is very wet dough')));
});

test('Hybrid mode has starter and yeast, no sugar toggle needed', () => {
  const r = calculateRecipe({ ...DEFAULTS, ...MODE_DEFAULTS.hybrid, mode: 'hybrid' });
  assert.ok(find(r, 'starter'));
  assert.ok(find(r, 'yeast'));
  assert.ok(find(r, 'sugar'));
  assert.equal(r.check.ok, true);
});

test('Sourdough sugar only when the sugar boost is on', () => {
  assert.equal(find(calculateRecipe({ ...DEFAULTS, sugarOn: false, sugarPercent: 2 }), 'sugar'), undefined);
  assert.ok(find(calculateRecipe({ ...DEFAULTS, sugarOn: true, sugarPercent: 2 }), 'sugar'));
});

test('Zero portions gives the empty warning', () => {
  const r = calculateRecipe({ ...DEFAULTS, numberOfLoaves: 0, numberOfPizzaBalls: 0 });
  assert.equal(r.empty, true);
  assert.equal(r.warnings[0].startsWith('Add at least one loaf'), true);
});

test('Hold back water is 8% of added water and the two parts add up', () => {
  const r = calculateRecipe(DEFAULTS);
  assert.equal(r.addFirstWater + r.holdBackWater, find(r, 'water').grams);
});

test('Recipe text is in grams and has no yeast in sourdough mode', () => {
  const text = formatRecipeText(calculateRecipe(DEFAULTS));
  assert.match(text, /Total dough: 2750 g/);
  assert.doesNotMatch(text, /yeast/i);
  assert.doesNotMatch(text, /cup|ounce|tablespoon|teaspoon/i);
});
