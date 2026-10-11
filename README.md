# Dough Doh Calculator

Bread, pizza, and chaos — calculated in grams.

A mobile-first web app that works backwards from the total dough you want and tells you exactly how many grams of everything to weigh out. Sourdough, hybrid, or yeast only. Dark mode by default. Installable, and works offline once loaded.

## Run it

```bash
npm install
npm run dev       # local dev server
npm run test      # calculator + time-planner tests
npm run build     # production build in dist/
npm run preview   # serve the production build locally
```

## How it works

All the maths is in `src/calculator.js`, with no React in it:

- Total dough = loaves × weight + pizza balls × weight.
- Main flour is solved backwards from the total, so the flour, starter, water, salt, sugar, yeast and gluten all add up to the target weight.
- Starter flour and water are subtracted from the water you add, so hydration stays correct.
- Water is split into "add first" (92%) and "hold back" (8%).
- Ingredients list in the order you weigh them out: starter, water, yeast, sugar, flours, then salt last.

Hydration rises with wholemeal: 65% base, plus 1% for every 10% wholemeal. You can type your own value instead.

### Time planning

Optional, in `src/timePlanner.js`. Pick a bake time — later today or days out — and it builds a schedule backwards from now: mix, add starter/yeast, stretch-and-folds, divide and shape, proof (or an overnight fridge retard if there's time to spare), bake. If the window is too tight for the current starter/yeast amount, it suggests a bigger one and offers to apply it to the recipe.

### Installable and offline

Built with `vite-plugin-pwa`. The service worker precaches the whole app, so once it's loaded it keeps working with no connection, and it can be installed to a home screen. Icons are generated (no image library needed) by `scripts/generate-icons.cjs`, run once and committed under `public/icons/`.

### Persistence

The current recipe and bake plan are saved to `localStorage` on every change and reloaded on startup (`src/storage.js`), so they survive a reload, a sleeping phone, or relaunching the installed app. The "Reset to house dough" button only resets the recipe, not a chosen bake time.

## Structure

```txt
src/
  App.jsx
  calculator.js         dough maths and recipe text
  calculator.test.js
  timePlanner.js         bake-time scheduling
  timePlanner.test.js
  storage.js              localStorage persistence
  defaults.js
  components/            inputs, cards, recipe output, warnings, method notes, time planner
  styles/theme.css       Tailwind and the bakery palette
scripts/
  generate-icons.cjs     PWA icon generator (run once, output is committed)
public/icons/            generated PWA icons
```
