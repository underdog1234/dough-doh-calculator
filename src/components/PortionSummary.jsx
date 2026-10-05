import { grams } from '../calculator.js';

export default function PortionSummary({ result }) {
  if (result.empty) {
    return <p className="text-sm text-muted">Nothing on the bench yet.</p>;
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total dough</p>
      <p className="text-2xl font-black text-accent-soft">{grams(result.totalDoughWeight)}</p>
    </div>
  );
}
