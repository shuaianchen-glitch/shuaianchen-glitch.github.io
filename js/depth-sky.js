window.DepthSky = (() => {
  let layers, tx, ty, cx, cy, raf, active;

  function tick(t) {
    if (!active) return;
    const drift = Math.sin(t * 0.00028) * 0.008;
    cx += (tx + drift - cx) * 0.04;
    cy += (ty - cy) * 0.04;

    const px = cx * 18;
    const py = cy * 18;
    document.documentElement.style.setProperty("--sky-x", `${px}px`);
    document.documentElement.style.setProperty("--sky-y", `${py}px`);

    layers.forEach((el) => {
      const depth = parseFloat(el.dataset.depth || "0.05");
      const z = parseFloat(el.dataset.z || "0");
      const lx = cx * depth * 28;
      const ly = cy * depth * 28;
      const scale = 1 + depth * 0.06;
      el.style.transform = `translate3d(${lx}px, ${ly}px, ${z}px) scale(${scale})`;
    });

    raf = requestAnimationFrame(tick);
  }

  function onMove(e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onOrient(e) {
    if (e.gamma == null || e.beta == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 40));
    ty = Math.max(-1, Math.min(1, (e.beta - 45) / 40));
  }

  function init() {
    layers = [...document.querySelectorAll("#depth-sky .depth-layer")];
    tx = ty = cx = cy = 0;
    active = layers.length > 0;

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    cancelAnimationFrame(raf);
    if (active) raf = requestAnimationFrame(tick);
  }

  return { init };
})();
