/**
 * Owns document visibility observation for a visual module.
 * The callback receives true when the document is hidden.
 */
export function createVisibilityController({ onVisibilityChange }) {
  if (typeof onVisibilityChange !== "function") {
    throw new TypeError("createVisibilityController requires an onVisibilityChange callback.");
  }

  let isDisposed = false;

  function handleVisibilityChange() {
    if (isDisposed) return;

    onVisibilityChange(document.hidden);
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return Object.freeze({
    dispose() {
      if (isDisposed) return;

      isDisposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    },
  });
}
