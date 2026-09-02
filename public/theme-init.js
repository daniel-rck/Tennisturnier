/*
 * Apply the persisted theme before first paint, so a forced light/dark choice
 * doesn't flash the wrong colors on load.
 *
 * External file rather than an inline <script>: an app with a Worker CSP would
 * otherwise have to pin a sha256 hash of the snippet, and that hash breaks the
 * theme silently the moment the snippet changes.
 */
(() => {
  try {
    // One-time migration off the app-local key used before web-base 0.3.
    // The old hook removed the key entirely for "system", so an absent key
    // correctly means "follow the OS" and nothing is lost.
    const legacy = localStorage.getItem("tennisturnier:theme");
    if (legacy && !localStorage.getItem("theme")) {
      localStorage.setItem("theme", legacy);
      localStorage.removeItem("tennisturnier:theme");
    }
    const t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch {
    /* localStorage unavailable (private mode, quota) — fall back to the OS. */
  }
})();
