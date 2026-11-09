/**
 * Owns a single requestAnimationFrame loop for a visual module.
 * The caller controls whether frames may run and supplies the frame callback.
 */
export function createAnimationLoop({ onFrame, shouldRun }) {
  if (typeof onFrame !== "function") {
    throw new TypeError("createAnimationLoop requires an onFrame function.");
  }

  if (typeof shouldRun !== "function") {
    throw new TypeError("createAnimationLoop requires a shouldRun function.");
  }

  let frameId = null;
  let isDisposed = false;

  function tick(timestamp) {
    frameId = null;

    if (isDisposed || !shouldRun()) return;

    const keepRunning = onFrame(timestamp) !== false;

    if (!keepRunning || isDisposed || !shouldRun()) return;

    frameId = window.requestAnimationFrame(tick);
  }

  function start() {
    if (isDisposed || frameId !== null || !shouldRun()) return;

    frameId = window.requestAnimationFrame(tick);
  }

  function stop() {
    if (frameId === null) return;

    window.cancelAnimationFrame(frameId);
    frameId = null;
  }

  function dispose() {
    if (isDisposed) return;

    isDisposed = true;
    stop();
  }

  return Object.freeze({
    start,
    stop,
    dispose,
    get isRunning() {
      return frameId !== null;
    },
  });
}
