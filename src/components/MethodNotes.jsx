import Card from './Card.jsx';

const METHODS = {
  sourdough: {
    title: 'Sourdough only',
    steps: [
      'Mix flour and most of the water. Rest 20–30 minutes.',
      'Add ripe starter and salt. Mix until combined.',
      'Perform 3–4 stretch and folds over the first 2 hours.',
      'Bulk ferment until puffy and risen.',
      'Divide into loaves and pizza balls.',
      'Proof loaves, then bake.',
      'Rest pizza balls until relaxed, then stretch and bake.',
    ],
  },
  hybrid: {
    title: 'Hybrid',
    steps: [
      'Mix flour, most of the water, starter, and yeast.',
      'Add salt after the dough comes together.',
      'Rest and fold 2–3 times.',
      'Watch the dough closely — yeast will speed things up.',
      'Divide, proof, and bake.',
    ],
  },
  yeast: {
    title: 'Yeast only',
    steps: [
      'Mix flour, water, yeast, sugar, and salt.',
      'Knead or fold until smooth.',
      'Rise until doubled.',
      'Divide into loaves and pizza balls.',
      'Proof until puffy, then bake.',
    ],
  },
};

export default function MethodNotes({ mode }) {
  const method = METHODS[mode];

  return (
    <Card title="Method notes" subtitle={`${method.title} method`}>
      <ol className="list-decimal space-y-3 pl-5 text-cream marker:font-bold marker:text-accent">
        {method.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </Card>
  );
}
