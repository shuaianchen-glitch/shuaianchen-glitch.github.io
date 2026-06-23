window.IntroBanner = (() => {
  const MIN_HOLD = 4;

  let canvas;
  let ctx;
  let state;
  let raf = 0;
  let time = 0;
  let mx = 0.5;
  let my = 0.5;
  let dpr = 1;
  let startMs = 0;
  let onMove = null;

  function holdSec() {
    return window.SITE?.intro?.holdSec || MIN_HOLD;
  }

  function resize() {
    if (!canvas || !ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    if (state) window.OrganicField.resize(state, canvas.width, canvas.height);
    else state = window.OrganicField.create(canvas.width, canvas.height);
  }

  function updateUi(elapsedSec) {
    const hold = holdSec();
    const holdT = Math.min(1, elapsedSec / hold);
    const bar = document.getElementById("intro-progress-fill");
    if (bar) bar.style.width = `${Math.round(holdT * 100)}%`;

    const hint = document.getElementById("intro-sub");
    if (!hint) return;
    hint.textContent = holdT < 1
      ? (window.SITE?.intro?.subHold || "粒子场加载中，请稍候…")
      : (window.SITE?.intro?.sub || "");
  }

  function tick() {
    time += 0.016;
    const elapsedSec = startMs ? (performance.now() - startMs) / 1000 : 0;
    window.OrganicField.step(state, time, mx, my, null);
    window.OrganicField.draw(ctx, state, time, mx, my, dpr, null);
    updateUi(elapsedSec);
    raf = requestAnimationFrame(tick);
  }

  function init() {
    canvas = document.getElementById("intro-canvas");
    if (!canvas || !window.OrganicField) return;

    ctx = canvas.getContext("2d");
    startMs = performance.now();
    resize();
    window.addEventListener("resize", resize);
    onMove = (e) => {
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function destroy() {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    if (onMove) window.removeEventListener("mousemove", onMove);
    onMove = null;
  }

  return { init, destroy, MIN_HOLD };
})();
