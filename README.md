# Dough Doh Calculator

Bread, pizza, and chaos — calculated in grams.

A mobile-first web app that works backwards from the total dough you want and tells you exactly how many grams of everything to weigh out. Sourdough, hybrid, or yeast only. Dark mode by default.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run test     # calculator tests (the brief's five test cases plus extras)
npm run build    # production build in dist/
```

## How it works

All the maths is in `src/calculator.js`, with no React in it:

- Total dough = loaves × weight + pizza balls × weight.
- Main flour is solved backwards from the total, so the flour, starter, water, salt, sugar, yeast and gluten all add up to the target weight.
- Starter flour and water are subtracted from the water you add, so hydration stays correct.
- Water is split into "add first" (92%) and "hold back" (8%).

Hydration rises with wholemeal: 65% base, plus 1% for every 10% wholemeal. You can type your own value instead.

## Structure

```txt
src/
  App.jsx
  calculator.js       maths and recipe text
  calculator.test.js
  defaults.js
  components/         inputs, cards, recipe output, warnings, method notes
  styles/theme.css    Tailwind and the bakery palette
```
