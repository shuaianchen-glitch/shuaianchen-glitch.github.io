window.Starfield = (() => {
  let canvas, ctx, w, h, stars, raf, running;

  function starColor(temp) {
    if (temp > 0.85) return { r: 200, g: 220, b: 255 };
    if (temp > 0.6) return { r: 240, g: 245, b: 255 };
    if (temp > 0.35) return { r: 255, g: 248, b: 235 };
    return { r: 255, g: 210, b: 170 };
  }

  function createStars(count) {
    return Array.from({ length: count }, () => {
      const mag = Math.pow(Math.random(), 2) * 4 + 0.5;
      return {
        x: Math.random(),
        y: Math.random(),
        mag,
        r: Math.max(0.25, 1.4 - mag * 0.22),
        base: Math.min(0.7, Math.max(0.08, 0.85 - mag * 0.14)),
        phase: Math.random() * Math.PI * 2,
        freq: 0.15 + Math.random() * 0.9,
        amp: 0.08 + Math.random() * 0.18,
        color: starColor(Math.random()),
      };
    });
  }

  function frame(t) {
    if (!running) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isNight = document.documentElement.getAttribute("data-theme") !== "day";

    ctx.clearRect(0, 0, w, h);

    const time = t * 0.001;
    stars.forEach((s) => {
      const tw = reduced ? 1 : 0.7 + s.amp * (0.5 + 0.5 * Math.sin(time * s.freq + s.phase));
      const a = s.base * tw * (isNight ? 0.85 : 0.4);
      const { r, g, b } = s.color;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(frame);
  }

  function resize() {
    if (!canvas) return;
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const isMobile = w < 768;
    const isNight = document.documentElement.getAttribute("data-theme") !== "day";
    stars = createStars(isMobile ? 80 : isNight ? 140 : 100);
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
