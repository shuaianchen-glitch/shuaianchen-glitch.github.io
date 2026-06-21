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
      const mag = Math.pow(Math.random(), 1.6) * 5 + 0.4;
      const temp = Math.random();
      return {
        x: Math.random(),
        y: Math.random(),
        mag,
        r: Math.max(0.35, 2.6 - mag * 0.42),
        base: Math.min(0.95, Math.max(0.12, 1.15 - mag * 0.16)),
        phase: Math.random() * Math.PI * 2,
        freq: 0.2 + Math.random() * 1.2,
        amp: 0.1 + Math.random() * 0.25,
        color: starColor(temp),
      };
    });
  }

  function frame(t) {
    if (!running) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const theme = document.documentElement.getAttribute("data-theme");
    const isNight = theme !== "day";

    ctx.clearRect(0, 0, w, h);

    const time = t * 0.001;
    stars.forEach((s) => {
      const tw = reduced ? 1 : 0.65 + s.amp * (0.5 + 0.5 * Math.sin(time * s.freq + s.phase));
      const a = s.base * tw * (isNight ? 1 : 0.55);
      const { r, g, b } = s.color;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fill();

      if (s.r > 1.4 && isNight && !reduced) {
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.06})`;
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
    stars = createStars(isMobile ? 220 : isNight ? 520 : 280);
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
