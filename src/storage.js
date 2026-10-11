// Tiny localStorage helpers so the current recipe and bake plan survive a
// reload, a sleeping phone, or the PWA being relaunched. Browser storage can
// throw (private browsing, blocked site data) so every call is wrapped.

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable — the app still works, it just won't remember next time.
  }
}
