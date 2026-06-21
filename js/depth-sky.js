window.DepthSky = (() => {
  let scene, layers, tx, ty, cx, cy, raf, active;

  function tick(t) {
    if (!active) return;
    const drift = Math.sin(t * 0.00035) * 0.012;
    cx += (tx + drift - cx) * 0.055;
    cy += (ty - cy) * 0.055;

    layers.forEach((el) => {
      const depth = parseFloat(el.dataset.depth || "0.05");
      const z = parseFloat(el.dataset.z || "0");
      const px = cx * depth * 42;
      const py = cy * depth * 42;
      const scale = 1 + depth * 0.12;
      el.style.transform = `translate3d(${px}px, ${py}px, ${z}px) scale(${scale})`;
    });

    raf = requestAnimationFrame(tick);
  }

  function onMove(e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onOrient(e) {
    if (e.gamma == null || e.beta == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 35));
    ty = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
  }

  function bindTheme() {
    const theme = document.documentElement.getAttribute("data-theme");
    scene?.setAttribute("data-active-theme", theme);
  }

  function init() {
    scene = document.getElementById("depth-sky");
    if (!scene) return;
    layers = [...scene.querySelectorAll(".depth-layer")];
    tx = ty = cx = cy = 0;
    active = true;

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    window.addEventListener("themechange", bindTheme);

    bindTheme();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  return { init };
})();
