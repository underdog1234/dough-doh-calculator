// House dough. Everything the Reset button puts back.

// Mode-specific defaults. Switching mode applies these.
export const MODE_DEFAULTS = {
  sourdough: { starterPercent: 20, yeastPercent: 0, sugarPercent: 0 },
  hybrid: { starterPercent: 15, yeastPercent: 0.2, sugarPercent: 1 },
  yeast: { starterPercent: 0, yeastPercent: 1, sugarPercent: 1.5 },
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
  sugarOn: false, // only used in sourdough mode; other modes always use sugarPercent

  ...MODE_DEFAULTS.sourdough,
};
