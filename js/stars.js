window.Starfield = (() => {
  let canvas, ctx, w, h, chartStars, ambientStars, raf, running;

  function chartBounds() {
    const c = window.SITE?.chart || {};
    return {
      top: c.insetTop ?? 0.1,
      right: c.insetRight ?? 0.06,
      bottom: c.insetBottom ?? 0.12,
      left: c.insetLeft ?? 0.06,
    };
  }

  function chartToScreen(nx, ny) {
    const b = chartBounds();
    const cw = 1 - b.left - b.right;
    const ch = 1 - b.top - b.bottom;
    return {
      x: (b.left + nx * cw) * w,
      y: (b.top + ny * ch) * h,
    };
  }

  function collectChartStars() {
    const list = [];
    window.SITE.projects.forEach((p) => {
      list.push({ x: p.star.x, y: p.star.y, mag: p.star.mag, chart: true });
    });
    list.push({ x: window.SITE.hub.x, y: window.SITE.hub.y, mag: window.SITE.hub.mag, chart: true });
    window.SITE.decorStars.forEach((s) => {
      list.push({ x: s.x, y: s.y, mag: s.mag, chart: true });
    });
    return list;
  }

  function buildChartStars() {
    return collectChartStars().map((s, i) => {
      const pos = chartToScreen(s.x, s.y);
      return {
        x: pos.x,
        y: pos.y,
        r: Math.max(0.6, 2.2 - s.mag * 0.35),
        base: Math.min(0.95, Math.max(0.35, 1.15 - s.mag * 0.12)),
        phase: (s.x + s.y) * Math.PI * 4 + i,
        freq: 0.35 + (i % 5) * 0.12,
        amp: 0.12 + (3.8 - Math.min(s.mag, 3.8)) * 0.06,
        warm: s.mag < 3.2,
      };
    });
  }

  function buildAmbientStars(count) {
    const b = chartBounds();
    const list = [];
    for (let i = 0; i < count; i += 1) {
      const nx = b.left + Math.random() * (1 - b.left - b.right);
      const ny = b.top + Math.random() * (1 - b.top - b.bottom);
      const pos = chartToScreen(
        (nx - b.left) / (1 - b.left - b.right),
        (ny - b.top) / (1 - b.top - b.bottom)
      );
      list.push({
        x: pos.x,
        y: pos.y,
        r: Math.random() * 0.55 + 0.15,
        base: Math.random() * 0.18 + 0.04,
        phase: Math.random() * Math.PI * 2,
        freq: 0.08 + Math.random() * 0.25,
        amp: 0.04,
        warm: Math.random() > 0.7,
      });
    }
    return list;
  }

  function drawStar(s, time, isNight, reduced) {
    const tw = reduced ? 1 : 0.75 + s.amp * (0.5 + 0.5 * Math.sin(time * s.freq + s.phase));
    const a = s.base * tw * (isNight ? 0.9 : 0.35);
    const r = s.warm ? 255 : 210;
    const g = s.warm ? 248 : 228;
    const b = s.warm ? 240 : 255;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.fill();
    if (s.r > 1.1 && isNight && !reduced) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.12})`;
      ctx.fill();
    }
  }

  function frame(t) {
    if (!running) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isNight = document.documentElement.getAttribute("data-theme") !== "day";
    ctx.clearRect(0, 0, w, h);
    if (!isNight) {
      raf = requestAnimationFrame(frame);
      return;
    }

    const time = t * 0.001;
    ambientStars.forEach((s) => drawStar(s, time, isNight, reduced));
    chartStars.forEach((s) => drawStar(s, time, isNight, reduced));
    raf = requestAnimationFrame(frame);
  }

  function resize() {
    if (!canvas) return;
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const isMobile = w < 768;
    chartStars = buildChartStars();
    ambientStars = buildAmbientStars(isMobile ? 28 : 48);
  }

  function init() {
    canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    running = true;
    resize();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("themechange", resize);
  }

  return { init, resize };
})();
