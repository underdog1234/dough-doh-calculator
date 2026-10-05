import { useMemo, useState } from 'react';
import { calculateRecipe, formatRecipeText, round1, suggestedHydration } from './calculator.js';
import { DEFAULTS, MODE_DEFAULTS } from './defaults.js';
import Card from './components/Card.jsx';
import CopyButton from './components/CopyButton.jsx';
import MethodNotes from './components/MethodNotes.jsx';
import NumberField from './components/NumberField.jsx';
import PortionSummary from './components/PortionSummary.jsx';
import RecipeOutput from './components/RecipeOutput.jsx';
import SelectField from './components/SelectField.jsx';
import ToggleCard from './components/ToggleCard.jsx';
import WarningBox from './components/WarningBox.jsx';

const FLOUR_OPTIONS = [
  { value: 'bread', label: 'High-strength / bread flour' },
  { value: 'standard', label: 'Standard / plain flour' },
];

const MODE_OPTIONS = [
  { value: 'sourdough', label: 'Sourdough only', note: 'Wild yeast from your starter. No commercial yeast.' },
  { value: 'hybrid', label: 'Hybrid', note: 'Hybrid mode keeps some sourdough flavour but gives the dough a little rocket fuel.' },
  { value: 'yeast', label: 'Yeast only', note: 'Yeast-only mode is for emergency pizza, starter disasters, and dinner deadlines.' },
];

export default function App() {
  const [form, setForm] = useState(DEFAULTS);

  const result = useMemo(() => calculateRecipe(form), [form]);
  const recipeText = useMemo(() => formatRecipeText(result), [result]);
  const autoHydration = suggestedHydration(form.wholemealPercent);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const changeMode = (mode) => {
    setForm((f) => ({ ...f, mode, ...MODE_DEFAULTS[mode], sugarOn: false }));
  };

  const hasStarter = form.mode !== 'yeast';
  const hasYeast = form.mode !== 'sourdough';
  const whiteShare = 100 - form.wholemealPercent;

  return (
    <div className="min-h-dvh bg-espresso pb-10 text-cream">
      <header className="mx-auto max-w-6xl px-4 pb-3 pt-6">
        <h1 className="text-3xl font-black tracking-tight text-accent">Dough Doh Calculator</h1>
        <p className="text-muted">Bread, pizza, and chaos — calculated in grams.</p>
      </header>

      <div className="sticky top-0 z-10 border-b border-card-alt bg-espresso/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <PortionSummary result={result} />
          <CopyButton text={recipeText} disabled={result.empty} />
        </div>
      </div>

      <main className="mx-auto grid max-w-6xl items-start gap-4 px-4 py-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card title="What are we baking?" subtitle="Choose your dough victims.">
            <NumberField
              label="Loaves"
              value={form.numberOfLoaves}
              onChange={set('numberOfLoaves')}
              min={0}
              step={1}
              unit="loaves"
            />
            <NumberField
              label="Weight per loaf"
              value={form.loafWeight}
              onChange={set('loafWeight')}
              min={300}
              step={10}
            />
            <NumberField
              label="Pizza dough balls"
              value={form.numberOfPizzaBalls}
              onChange={set('numberOfPizzaBalls')}
              min={0}
              step={1}
              unit="balls"
            />
            <NumberField
              label="Weight per pizza ball"
              value={form.pizzaBallWeight}
              onChange={set('pizzaBallWeight')}
              min={150}
              step={10}
            />
          </Card>

          <Card title="Flour situation">
            <SelectField
              label="Flour type"
              value={form.flourType}
              onChange={set('flourType')}
              options={FLOUR_OPTIONS}
            />

            {form.flourType === 'standard' && (
              <ToggleCard
                title="Add vital wheat gluten"
                description="Gives standard flour more structure and pizza stretch. Percent of main flour."
                checked={form.glutenOn}
                onChange={set('glutenOn')}
              >
                <NumberField
                  label="Vital wheat gluten"
                  value={form.glutenPercent}
                  onChange={set('glutenPercent')}
                  min={0}
                  max={5}
                  step={0.5}
                  unit="%"
                />
              </ToggleCard>
            )}

            <NumberField
              label="Wholemeal"
              value={form.wholemealPercent}
              onChange={set('wholemealPercent')}
              min={0}
              max={100}
              step={5}
              unit="%"
              hint={`Split: ${whiteShare}% white · ${form.wholemealPercent}% wholemeal`}
            />
          </Card>

          <Card title="Hydration station" subtitle="Wholemeal is thirsty. Give it a drink.">
            <p className="text-cream">
              Suggested for this flour: <span className="font-bold text-accent-soft">{round1(autoHydration)}%</span>
            </p>

            <ToggleCard
              title="Set hydration manually"
              description="Only if you know what you're doing, or your flour is misbehaving."
              checked={form.manualHydrationOn}
              onChange={(on) =>
                setForm((f) => ({
                  ...f,
                  manualHydrationOn: on,
                  manualHydration: on ? Math.round(autoHydration) : f.manualHydration,
                }))
              }
            >
              <NumberField
                label="Target hydration"
                value={form.manualHydration}
                onChange={set('manualHydration')}
                min={50}
                max={100}
                step={1}
                unit="%"
              />
            </ToggleCard>

            <p className="text-sm text-muted">
              Hydration is a guide, not a law. Hold back 5–10% of the water and add it only if the dough feels
              tight or dry.
            </p>
          </Card>

          <Card title="Fermentation magic">
            <div role="radiogroup" aria-label="Fermentation style" className="grid gap-2">
              {MODE_OPTIONS.map((option) => {
                const selected = form.mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => changeMode(option.value)}
                    className={`rounded-2xl px-4 py-3 text-left transition-colors ${
                      selected ? 'bg-accent text-espresso' : 'bg-card-alt text-cream ring-1 ring-card-alt'
                    }`}
                  >
                    <span className="block font-black">{option.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-muted">
              {MODE_OPTIONS.find((o) => o.value === form.mode).note}
            </p>

            {hasStarter && (
              <>
                <NumberField
                  label="Ripe sourdough starter"
                  value={form.starterPercent}
                  onChange={set('starterPercent')}
                  min={0}
                  max={100}
                  step={1}
                  unit="% of flour"
                  hint="Its flour and water are counted, so the water adds up correctly."
                />
                <NumberField
                  label="Starter hydration"
                  value={form.starterHydration}
                  onChange={set('starterHydration')}
                  min={50}
                  max={150}
                  step={5}
                  unit="%"
                />
              </>
            )}

            {hasYeast && (
              <NumberField
                label="Instant yeast"
                value={form.yeastPercent}
                onChange={set('yeastPercent')}
                min={form.mode === 'yeast' ? 0.2 : 0}
                max={form.mode === 'yeast' ? 1.5 : 1}
                step={0.1}
                unit="% of flour"
              />
            )}
          </Card>

          <Card title="Optional hacks">
            {form.mode === 'sourdough' ? (
              <ToggleCard
                title="Sugar boost"
                description="Off in sourdough by default. A little sweetness helps browning."
                checked={form.sugarOn}
                onChange={(on) =>
                  setForm((f) => ({
                    ...f,
                    sugarOn: on,
                    sugarPercent: on && f.sugarPercent === 0 ? 1 : f.sugarPercent,
                  }))
                }
              >
                <NumberField
                  label="Sugar"
                  value={form.sugarPercent}
                  onChange={set('sugarPercent')}
                  min={0}
                  max={5}
                  step={0.5}
                  unit="%"
                />
              </ToggleCard>
            ) : (
              <ToggleCard
                title="Sugar boost"
                description="Included in this mode. Adjust the amount if you like."
                locked
                lockedText="In this mode"
              >
                <NumberField
                  label="Sugar"
                  value={form.sugarPercent}
                  onChange={set('sugarPercent')}
                  min={0}
                  max={5}
                  step={0.5}
                  unit="%"
                />
              </ToggleCard>
            )}

            <ToggleCard
              title="Yeast boost"
              description="Hybrid mode is the yeast boost: sourdough plus a little rocket fuel."
              checked={form.mode === 'hybrid'}
              onChange={(on) => changeMode(on ? 'hybrid' : 'sourdough')}
            />
          </Card>

          <button
            type="button"
            onClick={() => setForm(DEFAULTS)}
            className="w-full rounded-2xl bg-card-alt px-4 py-4 text-lg font-bold text-cream ring-1 ring-muted/30 active:scale-[0.99]"
          >
            Reset to house dough
          </button>
        </div>

        <div className="space-y-4">
          <WarningBox messages={result.warnings} />
          <RecipeOutput result={result} />
          {!result.empty && <MethodNotes mode={form.mode} />}
        </div>
      </main>
    </div>
  );
}
