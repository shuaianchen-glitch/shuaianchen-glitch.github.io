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
  let badgeEl = null;

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
      };
    }
    return {
      bg0: "#050310", bg1: "#0c0820", bg2: "#140a32",
      nebA: "rgba(88, 40, 160, 0.55)", nebB: "rgba(30, 80, 160, 0.4)",
      line: "rgba(160, 210, 255, 0.22)", lineActive: "rgba(120, 220, 255, 0.72)",
      star: "#e8f0ff", starLive: "#fff8ec", starGlow: "rgba(180, 220, 255, 0.55)",
      hub: "#f0d890", tech: "rgba(0, 220, 255, 0.18)", techBright: "rgba(0, 220, 255, 0.55)",
      dust: "rgba(200, 220, 255, 0.08)",
      text: "rgba(180, 210, 255, 0.42)", textBright: "rgba(200, 235, 255, 0.92)",
      labelBg: "rgba(8, 12, 28, 0.72)", labelBorder: "rgba(126, 200, 255, 0.35)",
      figureFill: "rgba(100, 180, 255, 0.12)", figureStroke: "rgba(160, 220, 255, 0.38)",
      figureGlow: "rgba(120, 220, 255, 0.55)",
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

  function figurePoints() {
    const keys = ["beta", "xi", "gamma", "alpha", "zeta", "theta", "delta", "iota", "nu"];
    const pts = {};
    keys.forEach((key) => {
      if (starMap[key]) pts[key] = toScreen(starMap[key].x, starMap[key].y);
    });
    return pts;
  }

  function traceCapricornPath(pts, expand) {
    const ex = expand ? 18 * dpr : 0;
    if (!pts.beta || !pts.xi || !pts.gamma) return false;

    ctx.beginPath();
    ctx.moveTo(pts.beta.x, pts.beta.y);
    ctx.quadraticCurveTo(pts.beta.x - ex * 1.2, pts.beta.y - ex * 2.2, pts.xi.x, pts.xi.y - ex * 0.3);
    ctx.quadraticCurveTo(pts.gamma.x + ex * 0.8, pts.gamma.y - ex * 1.8, pts.gamma.x, pts.gamma.y);

    if (pts.delta) {
      ctx.quadraticCurveTo(pts.gamma.x + ex * 0.4, pts.delta.y - ex * 0.5, pts.delta.x, pts.delta.y);
    }
    if (pts.iota) {
      ctx.quadraticCurveTo(
        pts.iota.x - ex * 0.2,
        pts.iota.y - ex * 0.8,
        pts.iota.x + ex * 0.6,
        pts.iota.y + ex * 0.2
      );
      ctx.quadraticCurveTo(pts.iota.x, pts.iota.y + ex * 1.2, pts.iota.x - ex * 1.5, pts.iota.y);
    }
    if (pts.nu && pts.theta) {
      ctx.quadraticCurveTo(pts.nu.x, pts.nu.y, pts.theta.x - ex * 0.3, pts.theta.y);
      ctx.lineTo(pts.alpha?.x ?? pts.theta.x, pts.alpha?.y ?? pts.theta.y);
      ctx.quadraticCurveTo(pts.alpha?.x ?? pts.beta.x, (pts.alpha?.y ?? pts.beta.y) + ex, pts.beta.x, pts.beta.y);
    } else {
      ctx.lineTo(pts.beta.x, pts.beta.y);
    }
    ctx.closePath();
    return true;
  }

  function drawCapricornHorns(pts, p, lit, t) {
    if (!pts.beta || !pts.gamma || !pts.xi) return;
    const horn = lit ? p.lineActive : p.figureStroke;
    ctx.strokeStyle = horn;
    ctx.lineWidth = (lit ? 2 : 1.2) * dpr;
    ctx.lineCap = "round";
    ctx.shadowColor = p.figureGlow;
    ctx.shadowBlur = lit ? 16 : 6;

    ctx.beginPath();
    ctx.moveTo(pts.beta.x, pts.beta.y);
    ctx.quadraticCurveTo(pts.beta.x - 28 * dpr, pts.beta.y - 38 * dpr, pts.xi.x - 8 * dpr, pts.xi.y - 12 * dpr);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pts.gamma.x, pts.gamma.y);
    ctx.quadraticCurveTo(pts.gamma.x + 22 * dpr, pts.gamma.y - 32 * dpr, pts.xi.x + 6 * dpr, pts.xi.y - 10 * dpr);
    ctx.stroke();

    if (pts.iota) {
      ctx.beginPath();
      ctx.moveTo(pts.iota.x, pts.iota.y);
      ctx.quadraticCurveTo(pts.iota.x + 24 * dpr, pts.iota.y - 8 * dpr, pts.iota.x + 32 * dpr, pts.iota.y + 14 * dpr);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pts.iota.x, pts.iota.y);
      ctx.quadraticCurveTo(pts.iota.x + 18 * dpr, pts.iota.y + 18 * dpr, pts.iota.x - 4 * dpr, pts.iota.y + 26 * dpr);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  function drawCapricornFigure(p, t, intro) {
    const pts = figurePoints();
    if (!traceCapricornPath(pts, false)) return;

    const lit = figureHover || hoverIdx >= 0 || focusIdx >= 0;
    const fade = EASE(intro) * (lit ? 1 : 0.82);
    const breathe = 0.88 + 0.12 * Math.sin(t * 0.65);
    figureDrawT = Math.min(1, figureDrawT + 0.006);
    const drawProg = EASE(figureDrawT);

    ctx.save();
    ctx.globalAlpha = fade * breathe;

    const cx = pts.delta ? pts.delta.x : (pts.beta.x + pts.gamma.x) / 2;
    const cy = pts.delta ? pts.delta.y : (pts.beta.y + pts.theta?.y) / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.28);
    grad.addColorStop(0, lit ? p.figureFill.replace(/[\d.]+\)$/, "0.18)") : p.figureFill);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.setLineDash([120 * dpr, 40 * dpr]);
    ctx.lineDashOffset = -t * 18 * dpr;
    ctx.strokeStyle = lit ? p.lineActive : p.figureStroke;
    ctx.lineWidth = (lit ? 2.2 : 1.3) * dpr;
    ctx.shadowColor = p.figureGlow;
    ctx.shadowBlur = lit ? 22 : 10;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    drawCapricornHorns(pts, p, lit, t);

    if (pts.delta && pts.iota) {
      ctx.strokeStyle = p.techBright.replace(/[\d.]+\)$/, lit ? "0.35)" : "0.12)");
      ctx.lineWidth = 0.8 * dpr;
      ctx.setLineDash([3 * dpr, 5 * dpr]);
      ctx.beginPath();
      ctx.moveTo(pts.delta.x, pts.delta.y);
      ctx.quadraticCurveTo((pts.delta.x + pts.iota.x) / 2, pts.delta.y - 20 * dpr, pts.iota.x, pts.iota.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
    updateBadge(pts, lit);
  }

  function updateBadge(pts, lit) {
    if (!badgeEl) return;
    const cx = ((pts.xi?.x ?? 0) + (pts.delta?.x ?? 0)) / 2;
    const cy = ((pts.xi?.y ?? 0) + (pts.theta?.y ?? pts.delta?.y ?? 0)) / 2;
    badgeEl.style.left = `${cx / dpr}px`;
    badgeEl.style.top = `${cy / dpr}px`;
    badgeEl.classList.toggle("is-lit", lit);
    badgeEl.classList.toggle("is-visible", figureDrawT > 0.35);
  }

  function hitTestFigure(sx, sy) {
    const pts = figurePoints();
    if (!traceCapricornPath(pts, true)) return false;
    return ctx.isPointInPath(sx, sy);
  }

  function constellationLit() {
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
    ctx.fillText(`SECTOR-♑ · ${String(tick).padStart(4, "0")}`, x + 8 * dpr, y - 6 * dpr);
    ctx.textAlign = "right";
    ctx.fillText("J2000.0", x + fw - 8 * dpr, y + fh + 14 * dpr);
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
    const lit = constellationLit();
    const activeKey = focusIdx >= 0 ? starKey(window.SITE.projects[focusIdx].star.bayer) : hoverIdx >= 0 ? starKey(window.SITE.projects[hoverIdx].star.bayer) : null;

    lines.forEach(([a, b], i) => {
      const sa = starMap[a];
      const sb = starMap[b];
      if (!sa || !sb) return;
      const p1 = toScreen(sa.x, sa.y);
      const p2 = toScreen(sb.x, sb.y);
      const lineProg = Math.min(1, Math.max(0, intro - i * 0.08));
      const active = lit && (activeKey ? (a === activeKey || b === activeKey) : true);
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

    const p = palette();
    ctx.clearRect(0, 0, w, h);
    drawNebula(p);
    drawDust(p, time);
    drawTechRing(p, time);
    drawTechFrame(p, time);
    drawCapricornFigure(p, time, EASE(introT));
    drawConstellation(p, time, EASE(introT));
    drawDecorStars(p, time, EASE(introT));
    drawHub(p, time, EASE(introT));
    drawProjectStars(p, time, EASE(introT));
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
    window.dispatchEvent(new CustomEvent("constellationhover", {
      detail: { lit: constellationLit(), figure: figureHover },
    }));
  }

  function onMove(e) {
    if (locked) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * dpr;
    const sy = (e.clientY - rect.top) * dpr;
    pointerX = sx;
    pointerY = sy;
    mx = e.clientX / window.innerWidth;
    my = e.clientY / window.innerHeight;
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
      return;
    }
    if (figureHover && !locked) {
      pulseT = 0.6;
      window.dispatchEvent(new CustomEvent("constellationtap", { detail: window.SITE.capricornus }));
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
    badgeEl = document.getElementById("cap-badge");
    if (badgeEl && window.SITE.capricornus) {
      badgeEl.querySelector(".cap-badge-en").textContent = window.SITE.capricornus.en;
      badgeEl.querySelector(".cap-badge-cn").textContent = `${window.SITE.capricornus.cn} · 海山羊`;
      const myth = document.getElementById("cap-badge-myth");
      if (myth) myth.textContent = `${window.SITE.capricornus.myth} · ♑`;
    }
    buildMap();
    resize();
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
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
