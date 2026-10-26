// House dough. Everything the Reset button puts back.

// Mode-specific defaults. Switching mode applies these.
// sugarOn is just each mode's starting point — it's a real toggle in every
// mode, not a fixed setting, so you can turn sugar off in hybrid/yeast too.
export const MODE_DEFAULTS = {
  sourdough: { starterPercent: 20, yeastPercent: 0, sugarPercent: 0, sugarOn: false },
  hybrid: { starterPercent: 15, yeastPercent: 0.2, sugarPercent: 1, sugarOn: true },
  yeast: { starterPercent: 0, yeastPercent: 1, sugarPercent: 1.5, sugarOn: true },
};

export const DEFAULTS = {
  numberOfLoaves: 2,
  loafWeight: 1000,
  numberOfPizzaBalls: 3,
  pizzaBallWeight: 250,

  flourType: 'bread', // 'bread' | 'standard'
  glutenOn: false,
  glutenPercent: 2,
  wholemealPercent: 0,

  manualHydrationOn: false,
  manualHydration: 65,

  mode: 'sourdough', // 'sourdough' | 'hybrid' | 'yeast'
  starterHydration: 100,

  ...MODE_DEFAULTS.sourdough,
};
