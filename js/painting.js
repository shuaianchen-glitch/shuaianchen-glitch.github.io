window.Painting = (() => {
  let canvas, ctx, w, h, dpr, raf;
  let hoverIdx = -1;
  let focusIdx = -1;
  let locked = false;
  let time = 0;
  let introT = 0;
  let mx = 0.5;
  let my = 0.5;
  let panX = 0;
  let panY = 0;
  let scale = 1;
  let targetPanX = 0;
  let targetPanY = 0;
  let targetScale = 1;
  let pulseT = 0;
  let starMap = {};
  let chart = { x: 0, y: 0, w: 0, h: 0 };
  let pointerX = 0;
  let pointerY = 0;
  let lastHoverIdx = -2;
  let lastFigureHover = false;
  let figureHover = false;
  let figureDrawT = 0;
  let particles = [];
  let cometTrail = [];
  let lastCometX = 0;
  let lastCometY = 0;
  let cometSpeed = 0;
  let gestureBurst = 0;
  let prevGestureOpen = 0.5;

  const EASE = (t) => 1 - Math.pow(1 - t, 3);

  function starKey(bayer) {
    const m = { "α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta", "ζ": "zeta", "θ": "theta", "ι": "iota", "ξ": "xi", "ν": "nu" };
    return m[bayer.split(" ")[0]] || bayer;
  }

  function buildMap() {
    starMap = {};
    window.SITE.projects.forEach((p) => {
      starMap[starKey(p.star.bayer)] = { x: p.star.x, y: p.star.y, mag: p.star.mag };
    });
    starMap.delta = { x: window.SITE.hub.x, y: window.SITE.hub.y, mag: window.SITE.hub.mag };
    window.SITE.decorStars.forEach((s) => {
      starMap[starKey(s.bayer)] = { x: s.x, y: s.y, mag: s.mag };
    });
  }

  function isDay() {
    return document.documentElement.getAttribute("data-theme") === "day";
  }

  function palette() {
    if (isDay()) {
      return {
        bg0: "#e8eef5", bg1: "#d4dce8", bg2: "#c2cfe0",
        nebA: "rgba(180, 140, 200, 0.35)", nebB: "rgba(120, 180, 210, 0.28)",
        line: "rgba(30, 80, 120, 0.35)", lineActive: "rgba(14, 116, 144, 0.75)",
        star: "#1e3a5f", starLive: "#0c4a6e", starGlow: "rgba(14, 116, 144, 0.4)",
        hub: "#b45309", tech: "rgba(14, 116, 144, 0.25)", techBright: "rgba(14, 116, 144, 0.65)",
        dust: "rgba(30, 60, 90, 0.15)",
        text: "rgba(15, 40, 70, 0.55)", textBright: "rgba(15, 50, 80, 0.95)",
        labelBg: "rgba(255, 255, 255, 0.82)", labelBorder: "rgba(14, 116, 144, 0.35)",
        figureFill: "rgba(14, 116, 144, 0.08)", figureStroke: "rgba(14, 116, 144, 0.28)",
        figureGlow: "rgba(14, 116, 144, 0.45)",
        illCore: "rgba(255, 255, 255, 0.35)", illMid: "rgba(200, 230, 245, 0.2)",
        illEdge: "rgba(160, 200, 220, 0.1)", illTail: "rgba(180, 220, 240, 0.15)",
      };
    }
    return {
      bg0: "#000000", bg1: "#030208", bg2: "#060412",
      nebA: "rgba(88, 40, 160, 0.35)", nebB: "rgba(30, 80, 160, 0.25)",
      line: "rgba(160, 210, 255, 0.22)", lineActive: "rgba(120, 220, 255, 0.72)",
      star: "#e8f0ff", starLive: "#fff8ec", starGlow: "rgba(180, 220, 255, 0.55)",
      hub: "#f0d890", tech: "rgba(0, 220, 255, 0.18)", techBright: "rgba(0, 220, 255, 0.55)",
      dust: "rgba(200, 220, 255, 0.08)",
      text: "rgba(180, 210, 255, 0.42)", textBright: "rgba(200, 235, 255, 0.92)",
      labelBg: "rgba(8, 12, 28, 0.72)", labelBorder: "rgba(126, 200, 255, 0.35)",
      figureFill: "rgba(100, 180, 255, 0.12)", figureStroke: "rgba(160, 220, 255, 0.38)",
      figureGlow: "rgba(120, 220, 255, 0.55)",
      illCore: "rgba(230, 245, 255, 0.28)", illMid: "rgba(180, 215, 255, 0.16)",
      illEdge: "rgba(130, 175, 230, 0.08)", illTail: "rgba(140, 200, 240, 0.14)",
    };
  }

  function chartRect() {
    const padX = w * 0.06;
    const padY = h * 0.1;
    chart = { x: padX, y: padY, w: w - padX * 2, h: h - padY * 2 };
    return chart;
  }

  function toScreen(nx, ny) {
    const c = chartRect();
    const px = c.x + nx * c.w;
    const py = c.y + ny * c.h;
    const cx = w / 2 + panX;
    const cy = h / 2 + panY;
    return {
      x: cx + (px - cx) * scale,
      y: cy + (py - cy) * scale,
    };
  }

  function fromScreen(sx, sy) {
    const cx = w / 2 + panX;
    const cy = h / 2 + panY;
    const px = cx + (sx - cx) / scale;
    const py = cy + (sy - cy) / scale;
    const c = chart;
    return { nx: (px - c.x) / c.w, ny: (py - c.y) / c.h };
  }

  function initParticles() {
    const mobile = window.innerWidth < 768;
    const count = mobile ? 320 : 1100;
    particles = Array.from({ length: count }, () => {
      const roll = Math.random();
      const type = roll > 0.97 ? "orb" : roll > 0.72 ? "spark" : "dust";
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: type === "orb" ? 2 + Math.random() * 5 : type === "spark" ? 0.7 + Math.random() * 1.6 : 0.25 + Math.random() * 0.7,
        type,
        hue: Math.random() > 0.55 ? 42 + Math.random() * 18 : 188 + Math.random() * 40,
        alpha: type === "orb" ? 0.12 + Math.random() * 0.18 : 0.25 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
      };
    });
  }

  function pushComet(x, y) {
    const speed = Math.hypot(x - lastCometX, y - lastCometY);
    lastCometX = x;
    lastCometY = y;
    cometSpeed = cometSpeed * 0.65 + speed * 0.35;
    cometTrail.unshift({ x, y, life: 1 });
    if (cometTrail.length > 48) cometTrail.pop();
  }

  function updateComet() {
    cometTrail.forEach((p) => {
      p.life *= 0.93;
    });
    cometTrail = cometTrail.filter((p) => p.life > 0.04);
    cometSpeed *= 0.92;
  }

  function drawComet() {
    if (isDay() || cometTrail.length < 2) return;

    ctx.globalCompositeOperation = "screen";
    const tailEnd = cometTrail[cometTrail.length - 1];

    for (let i = 1; i < cometTrail.length; i += 1) {
      const a = cometTrail[i - 1];
      const b = cometTrail[i];
      const t = 1 - i / cometTrail.length;
      const alpha = Math.pow(t, 1.6) * a.life * 0.65;
      const width = (2 + t * 14) * dpr;
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, `rgba(255, 230, 180, ${alpha})`);
      grad.addColorStop(0.35, `rgba(255, 140, 50, ${alpha * 0.55})`);
      grad.addColorStop(1, `rgba(100, 180, 255, ${alpha * 0.08})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    if (tailEnd && cometTrail.length > 4) {
      const head = cometTrail[0];
      ctx.strokeStyle = `rgba(80, 160, 255, ${0.08 * tailEnd.life})`;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(tailEnd.x, tailEnd.y);
      ctx.lineTo(head.x, head.y);
      ctx.stroke();
    }

    const head = cometTrail[0];
    if (head) {
      const fireR = (22 + Math.min(cometSpeed, 55) * 0.45) * dpr;
      const outer = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, fireR * 2.2);
      outer.addColorStop(0, "rgba(255, 255, 240, 1)");
      outer.addColorStop(0.08, "rgba(255, 210, 80, 0.95)");
      outer.addColorStop(0.22, "rgba(255, 120, 30, 0.65)");
      outer.addColorStop(0.45, "rgba(255, 60, 20, 0.22)");
      outer.addColorStop(0.7, "rgba(120, 180, 255, 0.08)");
      outer.addColorStop(1, "transparent");
      ctx.fillStyle = outer;
      ctx.beginPath();
      ctx.arc(head.x, head.y, fireR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      const core = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, fireR * 0.45);
      core.addColorStop(0, "rgba(255, 255, 255, 1)");
      core.addColorStop(0.5, "rgba(255, 200, 100, 0.85)");
      core.addColorStop(1, "rgba(255, 100, 40, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(head.x, head.y, fireR * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
  }

  function flowAt(x, y, t) {
    const nx = x / w;
    const ny = y / h;
    const a =
      Math.sin(ny * 8 + t * 0.45 + nx * 3) * 1.8 +
      Math.cos(nx * 7 - t * 0.35) * 1.2 +
      Math.sin((nx + ny) * 6 + t * 0.25) * 0.9;
    return a;
  }

  function updateParticles(t) {
    const g = window.HandGesture;
    const useGesture = !isDay() && g?.enabled && g.hasHand;
    const gx = (useGesture ? g.x : mx) * w;
    const gy = (useGesture ? g.y : my) * h;
    const pullR = useGesture ? 580 * dpr : 260 * dpr;
    const pushR = pullR * 2.4;

    if (useGesture) {
      const opened = g.openness;
      if (opened > 0.52 && prevGestureOpen <= 0.52) gestureBurst = 1;
      prevGestureOpen = opened;
    } else {
      prevGestureOpen = 0.5;
    }

    if (gestureBurst > 0) gestureBurst = Math.max(0, gestureBurst - 0.022);

    particles.forEach((pt) => {
      const angle = flowAt(pt.x, pt.y, t) + pt.phase * 0.15;
      const drift = pt.type === "orb" ? 0.12 : pt.type === "spark" ? 0.28 : 0.1;
      const flowMix = useGesture ? 0.25 : 1;
      pt.vx += Math.cos(angle) * drift * 0.06 * flowMix;
      pt.vy += Math.sin(angle) * drift * 0.06 * flowMix;

      const dx = gx - pt.x;
      const dy = gy - pt.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (useGesture) {
        const closed = 1 - g.openness;
        const opened = g.openness;

        if (closed > 0.18 && dist < pullR * 1.5) {
          const pull = Math.pow(1 - Math.min(dist / (pullR * 1.5), 1), 1.1) * closed * 2.6;
          pt.vx += (dx / dist) * pull * 1.2;
          pt.vy += (dy / dist) * pull * 1.2;
        }

        if (opened > 0.28 && dist < pushR) {
          const falloff = Math.pow(1 - Math.min(dist / pushR, 1), 0.75);
          const push = falloff * opened * 3.2;
          pt.vx -= (dx / dist) * push * 1.5;
          pt.vy -= (dy / dist) * push * 1.5;
          pt.vx += (-dy / dist) * push * 0.65;
          pt.vy += (dx / dist) * push * 0.65;
          pt.vx += (Math.random() - 0.5) * opened * 0.45;
          pt.vy += (Math.random() - 0.5) * opened * 0.45;
        }

        if (gestureBurst > 0 && dist < pushR * 1.1) {
          const blast = gestureBurst * Math.pow(1 - Math.min(dist / (pushR * 1.1), 1), 0.6) * 4.5;
          pt.vx -= (dx / dist) * blast;
          pt.vy -= (dy / dist) * blast;
        }
      } else if (dist < pullR * 0.65) {
        const pull = Math.pow(1 - dist / (pullR * 0.65), 1.8);
        const swirl = pull * 0.35;
        pt.vx += (dx / dist) * swirl * 0.15 + (-dy / dist) * swirl * 0.05;
        pt.vy += (dy / dist) * swirl * 0.15 + (dx / dist) * swirl * 0.05;
      }

      pt.vx *= useGesture ? 0.86 : 0.92;
      pt.vy *= useGesture ? 0.86 : 0.92;
      pt.x += pt.vx * dpr;
      pt.y += pt.vy * dpr;

      if (pt.x < -8) pt.x = w + 8;
      if (pt.x > w + 8) pt.x = -8;
      if (pt.y < -8) pt.y = h + 8;
      if (pt.y > h + 8) pt.y = -8;
    });
  }

  function particleColor(hue, alpha) {
    return `hsla(${hue}, ${hue < 80 ? 90 : 75}%, ${hue < 80 ? 68 : 72}%, ${alpha})`;
  }

  function drawParticleLinks(t) {
    if (window.innerWidth < 768) return;
    const sparks = particles.filter((p) => p.type === "spark");
    const maxD = 75 * dpr;
    const cap = Math.min(sparks.length, 90);
    ctx.lineWidth = 0.5 * dpr;
    for (let i = 0; i < cap; i += 1) {
      const a = sparks[i];
      for (let j = i + 1; j < cap; j += 1) {
        const b = sparks[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > maxD) continue;
        const alpha = (1 - d / maxD) * 0.1 * (0.55 + 0.45 * Math.sin(t * 1.2 + i * 0.3));
        ctx.strokeStyle = particleColor(200, alpha);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  function drawOneParticle(pt, t) {
    const tw = 0.55 + 0.45 * Math.sin(t * 1.6 + pt.phase);
    const alpha = pt.alpha * tw * (pt.type === "orb" ? 0.85 : 1);
    const r = pt.size * dpr * (pt.type === "orb" ? 1.8 : 1);

    if (pt.type === "orb") {
      const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 8);
      g.addColorStop(0, particleColor(pt.hue, alpha * 0.55));
      g.addColorStop(0.35, particleColor(pt.hue, alpha * 0.18));
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r * 8, 0, Math.PI * 2);
      ctx.fill();
    }

    const core = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 2.5);
    core.addColorStop(0, particleColor(pt.hue, alpha));
    core.addColorStop(0.4, particleColor(pt.hue, alpha * 0.35));
    core.addColorStop(1, "transparent");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHandAura(t) {
    const g = window.HandGesture;
    if (!g?.enabled || !g.hasHand || isDay()) return;

    const hx = g.x * w;
    const hy = g.y * h;
    const closed = 1 - g.openness;
    const opened = g.openness;
    const r = (120 + closed * 200 + opened * 160) * dpr;

    ctx.globalCompositeOperation = "screen";
    const aura = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
    if (closed > opened) {
      aura.addColorStop(0, `rgba(255, 210, 120, ${0.35 + closed * 0.35})`);
      aura.addColorStop(0.4, `rgba(120, 200, 255, ${0.12 + closed * 0.15})`);
    } else {
      aura.addColorStop(0, `rgba(160, 240, 255, ${0.2 + opened * 0.35})`);
      aura.addColorStop(0.35, `rgba(80, 200, 255, ${0.1 + opened * 0.2})`);
      aura.addColorStop(0.6, "rgba(255, 200, 100, 0.08)");
    }
    aura.addColorStop(1, "transparent");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.fill();

    if (gestureBurst > 0) {
      const br = (gestureBurst * 420 + 80) * dpr;
      ctx.strokeStyle = `rgba(140, 220, 255, ${gestureBurst * 0.55})`;
      ctx.lineWidth = (3 + gestureBurst * 8) * dpr;
      ctx.beginPath();
      ctx.arc(hx, hy, br, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(200, 235, 255, ${0.15 + closed * 0.25 + opened * 0.2})`;
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(hx, hy, 28 * dpr + Math.sin(t * 3) * 6 * dpr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

  function drawParticleBanner(t) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.52, h * 0.46, 0, w * 0.5, h * 0.48, Math.max(w, h) * 0.55);
    glow.addColorStop(0, "rgba(30, 50, 90, 0.22)");
    glow.addColorStop(0.35, "rgba(12, 18, 40, 0.1)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    updateParticles(t);

    ctx.globalCompositeOperation = "screen";
    drawParticleLinks(t);
    particles.forEach((pt) => drawOneParticle(pt, t));
    drawHandAura(t);
    ctx.globalCompositeOperation = "source-over";

    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.72);
    vig.addColorStop(0, "transparent");
    vig.addColorStop(1, "rgba(0, 0, 0, 0.72)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  function drawNebula(p) {
    const cx = w * (0.48 + (mx - 0.5) * 0.02);
    const cy = h * (0.46 + (my - 0.5) * 0.02);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.65);
    g.addColorStop(0, p.bg2);
    g.addColorStop(0.45, p.bg1);
    g.addColorStop(1, p.bg0);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "screen";
    const wash = ctx.createRadialGradient(w * 0.55, h * 0.42, 0, w * 0.5, h * 0.45, w * 0.55);
    wash.addColorStop(0, p.nebA);
    wash.addColorStop(0.5, p.nebB);
    wash.addColorStop(1, "transparent");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);

    const wash2 = ctx.createRadialGradient(w * 0.35, h * 0.55, 0, w * 0.35, h * 0.55, w * 0.35);
    wash2.addColorStop(0, p.nebB);
    wash2.addColorStop(1, "transparent");
    ctx.fillStyle = wash2;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }

  function drawDust(p, t) {
    const seed = 42;
    for (let i = 0; i < 120; i += 1) {
      const fx = ((seed + i * 7919) % 1000) / 1000;
      const fy = ((seed + i * 6271) % 1000) / 1000;
      const tw = 0.5 + 0.5 * Math.sin(t * 0.4 + i);
      ctx.beginPath();
      ctx.arc(fx * w, fy * h, 0.4 + (i % 3) * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = p.dust.replace("0.08", String(0.04 + tw * 0.06));
      ctx.fill();
    }
  }

  function figurePoints() {
    const keys = ["beta", "xi", "gamma", "alpha", "zeta", "theta", "delta", "iota", "nu"];
    const pts = {};
    keys.forEach((key) => {
      if (starMap[key]) pts[key] = toScreen(starMap[key].x, starMap[key].y);
    });
    return pts;
  }

  function traceFigurePath(pts, expand) {
    const e = expand * dpr;
    if (!pts.beta || !pts.xi || !pts.gamma) return false;

    ctx.beginPath();
    ctx.moveTo(pts.beta.x - e * 0.3, pts.beta.y + e * 0.2);
    ctx.bezierCurveTo(
      pts.beta.x - 38 * dpr - e, pts.beta.y - 48 * dpr - e,
      pts.xi.x - 12 * dpr, pts.xi.y - 42 * dpr - e * 0.5,
      pts.xi.x, pts.xi.y - e * 0.4
    );
    ctx.bezierCurveTo(
      pts.xi.x + 14 * dpr, pts.xi.y - 36 * dpr - e * 0.3,
      pts.gamma.x + 28 * dpr + e * 0.5, pts.gamma.y - 28 * dpr - e,
      pts.gamma.x + e * 0.2, pts.gamma.y
    );

    if (pts.delta) {
      ctx.bezierCurveTo(
        pts.gamma.x + 20 * dpr, pts.gamma.y + 28 * dpr,
        pts.delta.x - 8 * dpr, pts.delta.y - 12 * dpr,
        pts.delta.x, pts.delta.y
      );
    }

    if (pts.iota) {
      ctx.bezierCurveTo(
        pts.delta.x + 40 * dpr, pts.delta.y - 24 * dpr,
        pts.iota.x - 16 * dpr, pts.iota.y - 20 * dpr,
        pts.iota.x + 8 * dpr, pts.iota.y + 4 * dpr
      );
      ctx.bezierCurveTo(
        pts.iota.x + 36 * dpr, pts.iota.y + 12 * dpr,
        pts.iota.x + 8 * dpr, pts.iota.y + 32 * dpr,
        pts.iota.x - 20 * dpr, pts.iota.y + 8 * dpr
      );
    }

    if (pts.nu && pts.theta && pts.alpha) {
      ctx.bezierCurveTo(
        pts.nu.x + 8 * dpr, pts.nu.y + 8 * dpr,
        pts.theta.x - 16 * dpr, pts.theta.y + 12 * dpr,
        pts.theta.x, pts.theta.y
      );
      ctx.bezierCurveTo(
        pts.alpha.x - 24 * dpr, pts.alpha.y + 16 * dpr,
        pts.alpha.x - 8 * dpr, pts.alpha.y - 8 * dpr,
        pts.alpha.x, pts.alpha.y
      );
      ctx.bezierCurveTo(
        pts.beta.x - 20 * dpr, pts.beta.y + 8 * dpr,
        pts.beta.x - 8 * dpr, pts.beta.y + 4 * dpr,
        pts.beta.x - e * 0.3, pts.beta.y + e * 0.2
      );
    } else {
      ctx.closePath();
    }
    return true;
  }

  function traceFishTail(pts) {
    if (!pts.delta || !pts.iota) return false;
    ctx.beginPath();
    ctx.moveTo(pts.delta.x, pts.delta.y);
    ctx.bezierCurveTo(
      pts.delta.x + 50 * dpr, pts.delta.y - 30 * dpr,
      pts.iota.x - 10 * dpr, pts.iota.y - 24 * dpr,
      pts.iota.x + 12 * dpr, pts.iota.y
    );
    ctx.bezierCurveTo(
      pts.iota.x + 40 * dpr, pts.iota.y + 20 * dpr,
      pts.iota.x, pts.iota.y + 40 * dpr,
      pts.delta.x + 20 * dpr, pts.delta.y + 16 * dpr
    );
    ctx.closePath();
    return true;
  }

  function traceHorns(pts) {
    if (!pts.beta || !pts.xi || !pts.gamma) return;
    ctx.beginPath();
    ctx.moveTo(pts.beta.x, pts.beta.y);
    ctx.bezierCurveTo(pts.beta.x - 32 * dpr, pts.beta.y - 44 * dpr, pts.xi.x - 18 * dpr, pts.xi.y - 22 * dpr, pts.xi.x - 4 * dpr, pts.xi.y - 8 * dpr);
    ctx.bezierCurveTo(pts.beta.x - 8 * dpr, pts.beta.y - 4 * dpr, pts.beta.x, pts.beta.y, pts.beta.x, pts.beta.y);
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(pts.gamma.x, pts.gamma.y);
    ctx.bezierCurveTo(pts.gamma.x + 26 * dpr, pts.gamma.y - 36 * dpr, pts.xi.x + 14 * dpr, pts.xi.y - 18 * dpr, pts.xi.x + 2 * dpr, pts.xi.y - 6 * dpr);
    ctx.bezierCurveTo(pts.gamma.x + 6 * dpr, pts.gamma.y - 2 * dpr, pts.gamma.x, pts.gamma.y, pts.gamma.x, pts.gamma.y);
    ctx.closePath();
  }

  function drawSkyGuideIllustration(p, t, intro) {
    const pts = figurePoints();
    if (!pts.beta) return;

    const lit = figureHover || hoverIdx >= 0 || focusIdx >= 0;
    const fade = EASE(intro) * (lit ? 1 : 0.9);
    const breathe = 0.92 + 0.08 * Math.sin(t * 0.5);
    figureDrawT = Math.min(1, figureDrawT + 0.005);

    const cx = pts.delta ? pts.delta.x * 0.4 + pts.xi.x * 0.3 + pts.beta.x * 0.3 : w * 0.5;
    const cy = pts.delta ? pts.delta.y * 0.45 + pts.xi.y * 0.35 + pts.theta.y * 0.2 : h * 0.45;
    const scaleB = breathe * (lit ? 1.02 : 1);

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(cx, cy);
    ctx.scale(scaleB, scaleB);
    ctx.translate(-cx, -cy);

    ctx.globalCompositeOperation = "screen";

    traceFigurePath(pts, 10);
    ctx.filter = `blur(${18 * dpr}px)`;
    ctx.fillStyle = lit ? "rgba(160, 210, 255, 0.14)" : "rgba(130, 180, 240, 0.08)";
    ctx.fill();
    ctx.filter = "none";

    traceFigurePath(pts, 4);
    ctx.filter = `blur(${8 * dpr}px)`;
    ctx.fillStyle = lit ? "rgba(190, 225, 255, 0.18)" : "rgba(160, 205, 245, 0.1)";
    ctx.fill();
    ctx.filter = "none";

    ctx.globalCompositeOperation = "source-over";

    traceFigurePath(pts, 0);
    const bodyGrad = ctx.createLinearGradient(cx, cy - 90 * dpr, cx, cy + 100 * dpr);
    bodyGrad.addColorStop(0, lit ? p.illCore.replace(/[\d.]+\)$/, "0.32)") : p.illCore);
    bodyGrad.addColorStop(0.45, p.illMid);
    bodyGrad.addColorStop(1, p.illEdge);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    if (traceFishTail(pts)) {
      const tailGrad = ctx.createLinearGradient(pts.delta.x, pts.delta.y, pts.iota.x, pts.iota.y);
      tailGrad.addColorStop(0, p.illMid);
      tailGrad.addColorStop(0.6, lit ? p.illTail.replace(/[\d.]+\)$/, "0.22)") : p.illTail);
      tailGrad.addColorStop(1, "rgba(100, 160, 220, 0.04)");
      ctx.fillStyle = tailGrad;
      ctx.fill();
    }

    traceHorns(pts);
    ctx.fillStyle = lit ? "rgba(220, 238, 255, 0.2)" : "rgba(200, 225, 250, 0.12)";
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    for (let i = 4; i >= 0; i -= 1) {
      traceFigurePath(pts, 0);
      ctx.filter = `blur(${i * 2.5 * dpr}px)`;
      ctx.strokeStyle = `rgba(200, 230, 255, ${(lit ? 0.14 : 0.07) - i * 0.012})`;
      ctx.lineWidth = (2 + i * 2.5) * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";

    traceFigurePath(pts, 0);
    ctx.strokeStyle = lit ? "rgba(235, 248, 255, 0.45)" : "rgba(210, 235, 255, 0.22)";
    ctx.lineWidth = 1.1 * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.restore();
  }

  function hitTestFigure(sx, sy) {
    const pts = figurePoints();
    if (!traceFigurePath(pts, 14)) return false;
    return ctx.isPointInPath(sx, sy);
  }

  function orbitLit() {
    return figureHover || hoverIdx >= 0 || focusIdx >= 0;
  }

  function drawTechFrame(p, t) {
    const c = chartRect();
    const pad = 12 * dpr;
    const x = c.x - pad;
    const y = c.y - pad;
    const fw = c.w + pad * 2;
    const fh = c.h + pad * 2;

    ctx.strokeStyle = p.tech;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, fw, fh);

    const corner = 22 * dpr;
    ctx.strokeStyle = p.techBright;
    ctx.lineWidth = 1.5;
    [[x, y, 1, 1], [x + fw, y, -1, 1], [x, y + fh, 1, -1], [x + fw, y + fh, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + sy * corner);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + sx * corner, cy);
      ctx.stroke();
    });

    ctx.strokeStyle = p.tech.replace(/[\d.]+\)$/, "0.06)");
    ctx.lineWidth = 0.5;
    const step = fw / 12;
    for (let i = 1; i < 12; i += 1) {
      const lx = x + step * i;
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(lx, y + fh);
      ctx.stroke();
    }
    const vstep = fh / 10;
    for (let j = 1; j < 10; j += 1) {
      const ly = y + vstep * j;
      ctx.beginPath();
      ctx.moveTo(x, ly);
      ctx.lineTo(x + fw, ly);
      ctx.stroke();
    }

    const tick = Math.floor(t * 4) % 10000;
    ctx.font = `${9 * dpr}px SF Mono, Menlo, monospace`;
    ctx.fillStyle = p.text;
    ctx.textAlign = "left";
    ctx.fillText(`ORBIT · ${String(tick).padStart(4, "0")}`, x + 8 * dpr, y - 6 * dpr);
    ctx.textAlign = "right";
    ctx.fillText("TRACK", x + fw - 8 * dpr, y + fh + 14 * dpr);
  }

  function drawCrosshair(p) {
    if (locked || hoverIdx < 0) return;
    ctx.save();
    ctx.strokeStyle = p.techBright.replace(/[\d.]+\)$/, "0.25)");
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4 * dpr, 6 * dpr]);
    ctx.beginPath();
    ctx.moveTo(pointerX, 0);
    ctx.lineTo(pointerX, h);
    ctx.moveTo(0, pointerY);
    ctx.lineTo(w, pointerY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawLabelBox(x, y, lines, p, active) {
    const fs = 9 * dpr;
    const lh = 13 * dpr;
    const padX = 8 * dpr;
    const padY = 6 * dpr;
    ctx.font = `500 ${fs}px SF Mono, Menlo, monospace`;
    const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const bw = maxW + padX * 2;
    const bh = lines.length * lh + padY * 2;
    let bx = x + 14 * dpr;
    let by = y - bh / 2;
    if (bx + bw > w - 20 * dpr) bx = x - bw - 14 * dpr;
    if (by < 20 * dpr) by = 20 * dpr;
    if (by + bh > h - 20 * dpr) by = h - bh - 20 * dpr;

    ctx.fillStyle = active ? p.labelBg : p.labelBg.replace(/[\d.]+\)$/, "0.45)");
    ctx.strokeStyle = active ? p.labelBorder : p.labelBorder.replace(/[\d.]+\)$/, "0.18)");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4 * dpr);
    ctx.fill();
    ctx.stroke();

    if (active) {
      ctx.strokeStyle = p.techBright;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(bx + (bx > x ? 0 : bw), by + bh / 2);
      ctx.stroke();
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? (active ? p.textBright : p.text) : p.text;
      if (i === 0 && active) ctx.font = `600 ${fs}px SF Mono, Menlo, monospace`;
      else ctx.font = `500 ${fs}px SF Mono, Menlo, monospace`;
      ctx.fillText(line, bx + padX, by + padY + i * lh);
    });
    ctx.textBaseline = "alphabetic";
  }

  function drawFaintLabel(x, y, text, p, offsetY) {
    ctx.font = `500 ${8 * dpr}px SF Mono, Menlo, monospace`;
    ctx.fillStyle = p.text;
    ctx.textAlign = "center";
    ctx.fillText(text, x, y + offsetY);
  }

  function drawTechRing(p, t) {
    const c = chartRect();
    const cx = c.x + c.w * 0.52;
    const cy = c.y + c.h * 0.48;
    const r = Math.min(c.w, c.h) * 0.46;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.015);
    ctx.strokeStyle = p.tech;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 12]);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([2, 8]);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.82, r * 0.58, 0.3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = p.techBright.replace(/[\d.]+\)$/, "0.15)");
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2 + t * 0.02;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.62);
      ctx.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.67);
      ctx.stroke();
    }
    ctx.restore();

    const scan = (t * 0.08) % (Math.PI * 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(scan);
    const sg = ctx.createLinearGradient(0, 0, r, 0);
    sg.addColorStop(0, "transparent");
    sg.addColorStop(0.7, p.tech.replace("0.12", "0.25").replace("0.2", "0.3"));
    sg.addColorStop(1, "transparent");
    ctx.strokeStyle = sg;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.95, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawOrbitArc(x1, y1, x2, y2, prog, active, p) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.12;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);

    if (prog >= 1) {
      ctx.strokeStyle = active ? p.lineActive : p.line;
      ctx.lineWidth = active ? 1.6 * dpr : 0.9 * dpr;
      ctx.lineCap = "round";
      ctx.shadowColor = active ? p.lineActive : "transparent";
      ctx.shadowBlur = active ? 14 : 0;
      ctx.stroke();
      ctx.shadowBlur = 0;
      return;
    }

    const steps = 40;
    const end = Math.floor(steps * prog);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    for (let i = 1; i <= end; i += 1) {
      const t = i / steps;
      const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
      const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
      ctx.lineTo(px, py);
    }
    ctx.strokeStyle = active ? p.lineActive : p.line;
    ctx.lineWidth = active ? 1.6 * dpr : 0.9 * dpr;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function drawConstellation(p, t, intro) {
    const lines = window.SITE.lines || [];
    const lit = orbitLit();
    const activeKey = focusIdx >= 0 ? starKey(window.SITE.projects[focusIdx].star.bayer) : hoverIdx >= 0 ? starKey(window.SITE.projects[hoverIdx].star.bayer) : null;

    lines.forEach(([a, b], i) => {
      const sa = starMap[a];
      const sb = starMap[b];
      if (!sa || !sb) return;
      const p1 = toScreen(sa.x, sa.y);
      const p2 = toScreen(sb.x, sb.y);
      const lineProg = Math.min(1, Math.max(0, intro - i * 0.08));
      const active = lit && (activeKey ? (a === activeKey || b === activeKey) : true);
      drawOrbitArc(p1.x, p1.y, p2.x, p2.y, lineProg, active, p);
    });
  }

  function drawStarPoint(x, y, radius, color, glow, twinkle, flare) {
    const t = 0.75 + twinkle * 0.25;
    if (glow) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 6);
      g.addColorStop(0, glow.replace(/[\d.]+\)$/, `${0.35 * t})`));
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (flare) {
      ctx.strokeStyle = `rgba(255,255,255,${0.15 * t})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - radius * 4, y);
      ctx.lineTo(x + radius * 4, y);
      ctx.moveTo(x, y - radius * 4);
      ctx.lineTo(x, y + radius * 4);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius * t, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawDecorStars(p, t, intro) {
    window.SITE.decorStars.forEach((s, i) => {
      const fade = Math.min(1, Math.max(0, intro - 0.5 - i * 0.06));
      if (fade <= 0) return;
      const pos = toScreen(s.x, s.y);
      const tw = 0.5 + 0.5 * Math.sin(t * 1.2 + i * 2);
      ctx.globalAlpha = fade * 0.7;
      drawStarPoint(pos.x, pos.y, Math.max(1, 2.8 - s.mag * 0.35), p.star, null, tw, false);
      drawFaintLabel(pos.x, pos.y, `${s.bayer} · ${s.cn}`, p, 18 * dpr);
      ctx.globalAlpha = 1;
    });
  }

  function drawHub(p, t, intro) {
    const h = window.SITE.hub;
    const fade = Math.min(1, Math.max(0, intro - 0.35));
    if (fade <= 0) return;
    const pos = toScreen(h.x, h.y);
    const tw = 0.6 + 0.4 * Math.sin(t * 0.9);
    ctx.globalAlpha = fade;
    drawStarPoint(pos.x, pos.y, 4.5, p.hub, "rgba(240, 216, 144, 0.6)", tw, true);

    ctx.strokeStyle = `rgba(240, 216, 144, ${0.2 * tw})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 14 + Math.sin(t) * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = `500 ${9 * dpr}px SF Mono, Menlo, monospace`;
    ctx.fillStyle = p.textBright.replace(/[\d.]+\)$/, "0.7)");
    ctx.textAlign = "center";
    ctx.fillText(`${h.bayer} · ${h.cn}`, pos.x, pos.y + 26 * dpr);
    ctx.font = `500 ${8 * dpr}px SF Mono, Menlo, monospace`;
    ctx.fillStyle = p.text;
    ctx.fillText(`${h.name} · mag ${h.mag}`, pos.x, pos.y + 38 * dpr);
    ctx.globalAlpha = 1;
  }

  function drawProjectStars(p, t, intro) {
    window.SITE.projects.forEach((proj, i) => {
      const fade = Math.min(1, Math.max(0, intro - 0.55 - i * 0.05));
      if (fade <= 0) return;
      const s = proj.star;
      const pos = toScreen(s.x, s.y);
      const isHover = hoverIdx === i;
      const isFocus = focusIdx === i;
      const tw = 0.55 + 0.45 * Math.sin(t * 1.4 + i * 1.7);
      const r = Math.max(2.2, 4.2 - s.mag * 0.35) * (isHover || isFocus ? 1.35 : 1);
      const color = proj.live ? p.starLive : p.star;
      const glowHue = proj.hue || 200;
      const glow = proj.live
        ? `hsla(${glowHue}, 80%, 70%, 0.5)`
        : `rgba(160, 180, 210, 0.3)`;

      ctx.globalAlpha = fade * (proj.live ? 1 : 0.65);
      drawStarPoint(pos.x, pos.y, r, color, glow, tw, s.mag < 3.7 || isFocus || isHover);

      const labelY = 20 * dpr;
      if (isHover || isFocus) {
        const status = proj.live ? "LIVE" : "CLIMB";
        drawLabelBox(pos.x, pos.y, [
          `${s.bayer} · ${s.cn}`,
          `${proj.title} · ${status}`,
          `${s.name} · mag ${s.mag}`,
        ], p, true);
      } else {
        drawFaintLabel(pos.x, pos.y, `${s.bayer} · ${s.cn}`, p, labelY);
        if (proj.live) {
          ctx.font = `600 ${7 * dpr}px SF Mono, Menlo, monospace`;
          ctx.fillStyle = p.techBright.replace(/[\d.]+\)$/, "0.35)");
          ctx.textAlign = "center";
          ctx.fillText("●", pos.x, pos.y + labelY + 10 * dpr);
        }
      }
      ctx.globalAlpha = 1;
    });
  }

  function drawFocusVignette() {
    if (focusIdx < 0) return;
    const proj = window.SITE.projects[focusIdx];
    const pos = toScreen(proj.star.x, proj.star.y);
    const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, Math.max(w, h) * 0.55);
    g.addColorStop(0, "transparent");
    g.addColorStop(0.35, "transparent");
    g.addColorStop(1, isDay() ? "rgba(200,210,225,0.55)" : "rgba(5,3,16,0.65)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawPulse(p) {
    if (pulseT <= 0 || focusIdx < 0) return;
    const proj = window.SITE.projects[focusIdx];
    const pos = toScreen(proj.star.x, proj.star.y);
    const r = 20 + pulseT * Math.max(w, h) * 0.35;
    ctx.strokeStyle = p.lineActive.replace(/[\d.]+\)$/, `${(1 - pulseT) * 0.5})`);
    ctx.lineWidth = 2 * (1 - pulseT);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function frame(ts) {
    time = ts * 0.001;
    if (introT < 1) introT = Math.min(1, introT + 0.008);

    panX += (targetPanX - panX) * 0.07;
    panY += (targetPanY - panY) * 0.07;
    scale += (targetScale - scale) * 0.07;
    if (pulseT > 0) pulseT = Math.max(0, pulseT - 0.018);
    updateComet();

    const p = palette();
    ctx.clearRect(0, 0, w, h);
    if (isDay()) {
      drawNebula(p);
      drawDust(p, time);
    } else {
      drawParticleBanner(time);
    }
    drawTechRing(p, time);
    drawTechFrame(p, time);
    drawSkyGuideIllustration(p, time, EASE(introT));
    drawConstellation(p, time, EASE(introT));
    drawDecorStars(p, time, EASE(introT));
    drawHub(p, time, EASE(introT));
    drawProjectStars(p, time, EASE(introT));
    drawComet();
    drawCrosshair(p);
    drawFocusVignette();
    drawPulse(p);

    raf = requestAnimationFrame(frame);
  }

  function hitTest(sx, sy) {
    let best = -1;
    let bestD = 28;
    window.SITE.projects.forEach((proj, i) => {
      const pos = toScreen(proj.star.x, proj.star.y);
      const d = Math.hypot(sx - pos.x, sy - pos.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  function focusStar(idx, sx, sy) {
    focusIdx = idx;
    locked = true;
    pulseT = 1;
    const proj = window.SITE.projects[idx];
    const pos = toScreen(proj.star.x, proj.star.y);
    targetPanX = (w / 2 - pos.x) * 0.85;
    targetPanY = (h / 2 - pos.y) * 0.85;
    targetScale = 1.18;
    canvas.style.cursor = "default";

    window.Detail?.open(proj, sx ?? pos.x, sy ?? pos.y, {
      onClose: () => {
        locked = false;
        focusIdx = -1;
        targetPanX = 0;
        targetPanY = 0;
        targetScale = 1;
      },
    });
  }

  function emitHover(idx) {
    if (idx === lastHoverIdx && figureHover === lastFigureHover) return;
    lastHoverIdx = idx;
    lastFigureHover = figureHover;
    window.dispatchEvent(new CustomEvent("starhover", {
      detail: idx >= 0 ? { idx, project: window.SITE.projects[idx] } : { idx: -1 },
    }));
    window.dispatchEvent(new CustomEvent("orbithover", {
      detail: { lit: orbitLit(), figure: figureHover },
    }));
  }

  function onMove(e) {
    if (locked) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * dpr;
    const sy = (e.clientY - rect.top) * dpr;
    pointerX = sx;
    pointerY = sy;
    mx = (e.clientX - rect.left) / rect.width;
    my = (e.clientY - rect.top) / rect.height;
    if (!isDay()) pushComet(sx, sy);
    hoverIdx = hitTest(sx, sy);
    figureHover = hoverIdx < 0 && hitTestFigure(sx, sy);
    canvas.style.cursor = hoverIdx >= 0 ? "pointer" : figureHover ? "pointer" : "crosshair";
    emitHover(hoverIdx);
  }

  function onLeave() {
    hoverIdx = -1;
    figureHover = false;
    emitHover(-1);
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * dpr;
    const sy = (e.clientY - rect.top) * dpr;
    const idx = hitTest(sx, sy);
    if (idx >= 0 && !locked) {
      focusStar(idx, e.clientX, e.clientY);
    }
  }

  function resize() {
    if (!canvas) return;
    const container = canvas.parentElement;
    const rect = container?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight };
    if (rect.width < 1 || rect.height < 1) {
      requestAnimationFrame(resize);
      return;
    }
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = Math.floor(rect.width * dpr);
    h = canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    chartRect();
    initParticles();
  }

  function init() {
    canvas = document.getElementById("painting");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    buildMap();
    resize();
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    window.addEventListener("resize", resize);
    if (canvas.parentElement && typeof ResizeObserver !== "undefined") {
      new ResizeObserver(resize).observe(canvas.parentElement);
    }
    window.addEventListener("themechange", () => {
      buildMap();
      initParticles();
    });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function openProject(idx) {
    if (idx < 0 || locked) return;
    const proj = window.SITE.projects[idx];
    const pos = toScreen(proj.star.x, proj.star.y);
    const rect = canvas.getBoundingClientRect();
    focusStar(idx, rect.left + pos.x / dpr, rect.top + pos.y / dpr);
  }

  function resetView() {
    locked = false;
    focusIdx = -1;
    hoverIdx = -1;
    targetPanX = targetPanY = 0;
    targetScale = 1;
  }

  return { init, resetView, openProject, toScreen, focusStar, resize };
})();
