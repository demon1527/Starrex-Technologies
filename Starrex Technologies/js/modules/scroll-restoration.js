/*
 * Start newly visited pages at the document top, not at a browser-restored
 * position. The homepage's #home links are treated as true "back to top"
 * controls so they do not scroll the header out of view.
 */

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function resetNewPageToTop() {
  if (window.location.hash && window.location.hash !== "#home") return;

  if (window.location.hash === "#home") {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`
    );
  }

  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

// Apply before page modules initialize.
resetNewPageToTop();

window.addEventListener("pageshow", (event) => {
  if (event.persisted) return;
  resetNewPageToTop();
});

// The homepage header, logo and footer brand use #home. Override the native
// hero-anchor jump so these controls return to the actual top of the page.
document.addEventListener("click", (event) => {
  const target = event.target instanceof Element
    ? event.target
    : event.target?.parentElement;
  const link = target?.closest('a[href="#home"]');

  if (!link || window.location.pathname.split("/").pop() !== "index.html" &&
      window.location.pathname !== "/") return;

  event.preventDefault();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`
  );
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
});
