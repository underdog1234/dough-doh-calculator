import { grams, round1 } from '../calculator.js';
import Card from './Card.jsx';

function Line({ label, value, note, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-card-alt py-3 last:border-0">
      <div className="min-w-0">
        <p className={strong ? 'font-bold text-cream' : 'font-semibold text-cream'}>{label}</p>
        {note && <p className="text-xs text-muted">{note}</p>}
      </div>
      <p className="shrink-0 text-xl font-black text-accent-soft">{value}</p>
    </div>
  );
}

function pluralise(portion) {
  return portion.count === 1 ? portion.singular : portion.plural;
}

export default function RecipeOutput({ result }) {
  if (result.empty) return null;

  const { check } = result;

  return (
    <Card title="Recipe ready" subtitle={`${grams(result.totalDoughWeight)} of dough, all in grams.`}>
      <div>
        <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Ingredients</h3>
        {result.ingredients.map((item) => (
          <Line key={item.key} label={item.label} value={`${item.grams} g`} note={item.note} />
        ))}
      </div>

      <div>
        <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Hydration station</h3>
        <Line label="Target hydration" value={`${round1(result.targetHydration)}%`} />
        <Line label="Add first" value={`${result.addFirstWater} g`} />
        <Line label="Hold back" value={`${result.holdBackWater} g`} />
        <p className="pt-2 text-sm text-muted">
          Add the first water when mixing. Keep the held-back water nearby and add it slowly only if the
          dough feels dry or tight. Hydration is a vibe, not a law.
        </p>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Portioning</h3>
        {result.portions.map((portion) => (
          <Line
            key={pluralise(portion)}
            label={`${portion.count} × ${portion.weight} g ${pluralise(portion)}`}
            value={`${portion.count * portion.weight} g`}
          />
        ))}
      </div>

      <p className={`text-sm font-semibold ${check.ok ? 'text-success' : 'text-warn'}`}>
        Dough check: {check.calculated} g / {check.target} g
      </p>
    </Card>
  );
}
