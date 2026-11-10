/*
 * Start each newly loaded page at the top instead of inheriting a browser-
 * restored scroll position. In-page hash links remain supported, and pages
 * restored from the back/forward cache keep their browser-managed position.
 */

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function resetNewPageToTop() {
  if (window.location.hash) return;
  window.scrollTo(0, 0);
}

// Run immediately, then reinforce the position after the browser's page-show
// lifecycle. Do not disturb a page revived from the back/forward cache.
resetNewPageToTop();

window.addEventListener("pageshow", (event) => {
  if (event.persisted) return;
  resetNewPageToTop();
});
