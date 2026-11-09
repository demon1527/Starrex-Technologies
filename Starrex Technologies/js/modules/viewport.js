/**
 * Owns renderer sizing and perspective-camera viewport updates.
 * The caller supplies any scene-specific composition changes.
 */
export function createViewportController({ renderer, camera, onResize }) {
  if (!renderer || typeof renderer.setSize !== "function") {
    throw new TypeError("createViewportController requires a WebGL renderer.");
  }

  if (!camera || typeof camera.updateProjectionMatrix !== "function") {
    throw new TypeError("createViewportController requires a perspective camera.");
  }

  if (typeof onResize !== "function") {
    throw new TypeError("createViewportController requires an onResize callback.");
  }

  let isDisposed = false;

  function resize() {
    if (isDisposed) return false;

    const context = renderer.getContext();

    if (!context || context.isContextLost()) return false;

    const width = window.innerWidth;
    const height = window.innerHeight;

    if (!width || !height) return false;

    const aspect = width / height;

    renderer.setSize(width, height, false);

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    const halfViewWidth =
      Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * aspect;

    onResize({
      width,
      height,
      aspect,
      portrait: aspect < 1,
      halfViewWidth,
    });

    return true;
  }

  function dispose() {
    if (isDisposed) return;

    isDisposed = true;
    window.removeEventListener("resize", resize);
  }

  window.addEventListener("resize", resize, { passive: true });

  return Object.freeze({
    resize,
    dispose,
  });
}
