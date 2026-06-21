window.Starfield = (() => {
  let canvas, ctx, w, h, stars, nebulae, raf, running;

  function magToSize(mag) {
    return Math.max(0.4, 3.2 - mag * 0.5);
  }

  function magToAlpha(mag) {
    return Math.min(1, Math.max(0.18, 1.2 - mag * 0.17));
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
        freq: 0.35 + Math.random() * 1.8,
        amp: 0.18 + Math.random() * 0.4,
        tint: Math.random() > 0.9 ? "warm" : Math.random() > 0.96 ? "violet" : "cool",
      };
    });
  }

  function createNebulae() {
    return [
      { x: 0.18, y: 0.28, rx: 0.32, ry: 0.18, hue: [88, 52, 168], a: 0.11 },
      { x: 0.78, y: 0.62, rx: 0.28, ry: 0.22, hue: [24, 80, 160], a: 0.09 },
      { x: 0.52, y: 0.12, rx: 0.4, ry: 0.12, hue: [140, 90, 200], a: 0.07 },
      { x: 0.35, y: 0.78, rx: 0.22, ry: 0.16, hue: [200, 100, 140], a: 0.06 },
    ];
  }

  function palette() {
    const theme = document.documentElement.getAttribute("data-theme");
    if (theme === "day") {
      return {
        clear: "rgba(238, 244, 251, 0.22)",
        cool: "rgba(80, 130, 190, ",
        warm: "rgba(255, 190, 130, ",
        violet: "rgba(160, 130, 220, ",
        trail: 0.22,
      };
    }
    return {
      clear: "rgba(2, 4, 14, 0.18)",
      cool: "rgba(220, 235, 255, ",
      warm: "rgba(255, 230, 190, ",
      violet: "rgba(200, 180, 255, ",
      trail: 0.14,
    };
  }

  function drawGalaxyBand(theme) {
    if (theme === "day") return;
    ctx.save();
    ctx.translate(w * 0.5, h * 0.48);
    ctx.rotate(-0.55);
    const g = ctx.createLinearGradient(-w * 0.55, 0, w * 0.55, 0);
    g.addColorStop(0, "transparent");
    g.addColorStop(0.15, "rgba(90, 110, 180, 0.04)");
    g.addColorStop(0.35, "rgba(180, 190, 240, 0.09)");
    g.addColorStop(0.5, "rgba(220, 225, 255, 0.12)");
    g.addColorStop(0.65, "rgba(160, 140, 220, 0.08)");
    g.addColorStop(0.85, "rgba(80, 100, 160, 0.04)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(-w * 0.6, -h * 0.08, w * 1.2, h * 0.16);
    ctx.restore();
  }

  function drawNebulae(theme) {
    if (theme === "day") return;
    nebulae.forEach((n) => {
      const cx = n.x * w;
      const cy = n.y * h;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, n.rx * w);
      const [r, gCol, b] = n.hue;
      g.addColorStop(0, `rgba(${r}, ${gCol}, ${b}, ${n.a})`);
      g.addColorStop(0.55, `rgba(${r}, ${gCol}, ${b}, ${n.a * 0.35})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, n.rx * w, n.ry * h, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function frame(t) {
    if (!running) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const theme = document.documentElement.getAttribute("data-theme");
    const p = palette();

    ctx.fillStyle = p.clear;
    ctx.fillRect(0, 0, w, h);
    drawNebulae(theme);
    drawGalaxyBand(theme);

    const time = t * 0.001;
    stars.forEach((s) => {
      const tw = reduced ? 1 : 0.5 + s.amp * (0.5 + 0.5 * Math.sin(time * s.freq + s.phase));
      const a = s.base * tw;
      let prefix = p.cool;
      if (s.tint === "warm") prefix = p.warm;
      if (s.tint === "violet") prefix = p.violet;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `${prefix}${a})`;
      ctx.fill();
      if (s.r > 1.8 && !reduced && theme === "night") {
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `${prefix}${a * 0.12})`;
        ctx.fill();
      }
    });

    raf = requestAnimationFrame(frame);
  }

  function resize() {
    if (!canvas) return;
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const isMobile = w < 768;
    const isNight = document.documentElement.getAttribute("data-theme") !== "day";
    stars = createStars(isMobile ? 160 : isNight ? 420 : 200);
    nebulae = createNebulae();
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

  function init() {
    start();
    window.addEventListener("resize", resize);
    window.addEventListener("themechange", resize);
  }

  return { init, start, resize };
})();
