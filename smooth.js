// inertia scrolling (Lenis); skipped for reduced-motion users or if the CDN is blocked
(() => {
  if (!window.Lenis || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, anchors: true });
  window.lenis = lenis;
  (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
})();
