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
        hub: "#b45309", tech: "rgba(14, 116, 144, 0.2)", dust: "rgba(30, 60, 90, 0.15)",
        text: "rgba(15, 40, 70, 0.5)",
      };
    }
    return {
      bg0: "#050310", bg1: "#0c0820", bg2: "#140a32",
      nebA: "rgba(88, 40, 160, 0.55)", nebB: "rgba(30, 80, 160, 0.4)",
      line: "rgba(160, 210, 255, 0.22)", lineActive: "rgba(120, 220, 255, 0.72)",
      star: "#e8f0ff", starLive: "#fff8ec", starGlow: "rgba(180, 220, 255, 0.55)",
      hub: "#f0d890", tech: "rgba(0, 220, 255, 0.12)", dust: "rgba(200, 220, 255, 0.08)",
      text: "rgba(180, 210, 255, 0.35)",
    };
  }

  function chartRect() {
    const padX = w * 0.08;
    const padY = h * 0.12;
    const top = padY + (window.innerWidth < 768 ? 60 : 0);
    chart = { x: padX, y: top, w: w - padX * 2, h: h - top - padY };
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

  function drawLine(x1, y1, x2, y2, prog, active, p) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    const ex = x1 + dx * prog;
    const ey = y1 + dy * prog;

    ctx.strokeStyle = active ? p.lineActive : p.line;
    ctx.lineWidth = active ? 1.8 : 1;
    ctx.lineCap = "round";
    ctx.shadowColor = active ? p.lineActive : "transparent";
    ctx.shadowBlur = active ? 12 : 0;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (active && prog > 0.5) {
      ctx.fillStyle = p.lineActive;
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawConstellation(p, t, intro) {
    const lines = window.SITE.lines || [];
    const activeKey = focusIdx >= 0 ? starKey(window.SITE.projects[focusIdx].star.bayer) : hoverIdx >= 0 ? starKey(window.SITE.projects[hoverIdx].star.bayer) : null;

    lines.forEach(([a, b], i) => {
      const sa = starMap[a];
      const sb = starMap[b];
      if (!sa || !sb) return;
      const p1 = toScreen(sa.x, sa.y);
      const p2 = toScreen(sb.x, sb.y);
      const lineProg = Math.min(1, Math.max(0, intro - i * 0.08));
      const active = activeKey && (a === activeKey || b === activeKey);
      drawLine(p1.x, p1.y, p2.x, p2.y, lineProg, active, p);
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

    ctx.font = "500 10px SF Mono, Menlo, monospace";
    ctx.fillStyle = p.text;
    ctx.textAlign = "center";
    ctx.fillText(`${h.bayer} · ${h.cn}`, pos.x, pos.y + 24);
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
      drawStarPoint(pos.x, pos.y, r, color, glow, tw, s.mag < 3.7 || isFocus);

      if (isHover || isFocus) {
        ctx.font = "500 10px SF Mono, Menlo, monospace";
        ctx.fillStyle = isFocus ? p.lineActive : p.text;
        ctx.textAlign = "center";
        ctx.fillText(`${s.bayer} · ${s.cn}`, pos.x, pos.y + 22);
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

    const p = palette();
    ctx.clearRect(0, 0, w, h);
    drawNebula(p);
    drawDust(p, time);
    drawTechRing(p, time);
    drawConstellation(p, time, EASE(introT));
    drawDecorStars(p, time, EASE(introT));
    drawHub(p, time, EASE(introT));
    drawProjectStars(p, time, EASE(introT));
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

  function onMove(e) {
    if (locked) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * dpr;
    const sy = (e.clientY - rect.top) * dpr;
    mx = e.clientX / window.innerWidth;
    my = e.clientY / window.innerHeight;
    hoverIdx = hitTest(sx, sy);
    canvas.style.cursor = hoverIdx >= 0 ? "pointer" : "crosshair";
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
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    chartRect();
  }

  function init() {
    canvas = document.getElementById("painting");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    buildMap();
    resize();
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("click", onClick);
    window.addEventListener("resize", resize);
    window.addEventListener("themechange", () => {
      buildMap();
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

  return { init, resetView, openProject, toScreen, focusStar };
})();
