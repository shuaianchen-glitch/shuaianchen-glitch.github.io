window.Starfield = (() => {
  let canvas, ctx, w, h, stars, raf, running;

  function magToSize(mag) {
    return Math.max(0.35, 2.8 - mag * 0.45);
  }

  function magToAlpha(mag) {
    return Math.min(1, Math.max(0.15, 1.15 - mag * 0.18));
  }

  function createStars(count) {
    return Array.from({ length: count }, () => {
      const mag = Math.random() * 4 + 0.5;
      return {
        x: Math.random(),
        y: Math.random(),
        mag,
        r: magToSize(mag),
        base: magToAlpha(mag),
        phase: Math.random() * Math.PI * 2,
        freq: 0.4 + Math.random() * 1.6,
        amp: 0.15 + Math.random() * 0.35,
        tint: Math.random() > 0.92 ? "warm" : "cool",
      };
    });
  }

  function palette() {
    const theme = document.documentElement.getAttribute("data-theme");
    if (theme === "day") {
      return {
        clear: "rgba(244, 247, 251, 0.35)",
        cool: "rgba(120, 160, 210, ",
        warm: "rgba(255, 200, 140, ",
        milky: "rgba(180, 200, 240, 0.04)",
      };
    }
    return {
      clear: "rgba(3, 5, 16, 0.28)",
      cool: "rgba(210, 225, 255, ",
      warm: "rgba(255, 220, 180, ",
      milky: "rgba(120, 140, 220, 0.035)",
    };
  }

  function drawMilky(p) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "transparent");
    g.addColorStop(0.45, p.milky);
    g.addColorStop(0.7, p.milky);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function frame(t) {
    if (!running) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const p = palette();
    ctx.fillStyle = p.clear;
    ctx.fillRect(0, 0, w, h);
    drawMilky(p);

    const time = t * 0.001;
    stars.forEach((s) => {
      const tw = reduced ? 1 : 0.55 + s.amp * (0.5 + 0.5 * Math.sin(time * s.freq + s.phase));
      const a = s.base * tw;
      const prefix = s.tint === "warm" ? p.warm : p.cool;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `${prefix}${a})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(frame);
  }

  function resize() {
    if (!canvas) return;
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = window.innerWidth < 768 ? 120 : 280;
    stars = createStars(count);
  }

  function start() {
    canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    running = true;
    resize();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function init() {
    start();
    window.addEventListener("resize", resize);
    window.addEventListener("themechange", () => {
      /* palette switches on next frame */
    });
  }

  return { init, start, stop, resize };
})();
