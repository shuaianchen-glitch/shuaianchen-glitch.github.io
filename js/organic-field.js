window.OrganicField = (() => {
  function create(w, h) {
    const cx = w * 0.5;
    const cy = h * 0.44;

    const petals = Array.from({ length: 14 }, (_, i) => {
      const side = i < 7 ? -1 : 1;
      const lane = i % 7;
      return {
        side,
        lane,
        phase: Math.random() * Math.PI * 2,
        spread: 0.55 + lane * 0.08 + Math.random() * 0.12,
        lift: 0.15 + lane * 0.04,
      };
    });

    const roots = Array.from({ length: 72 }, (_, i) => ({
      angle: ((i / 72) - 0.5) * 1.35,
      len: 0.22 + Math.random() * 0.55,
      wobble: Math.random() * Math.PI * 2,
      thick: 0.4 + Math.random() * 0.9,
    }));

    const dust = Array.from({ length: 220 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: 0.6 + Math.random() * 1.8,
      alpha: 0.15 + Math.random() * 0.45,
      hue: Math.random() > 0.6 ? 42 : 205,
    }));

    const filaments = Array.from({ length: 48 }, (_, i) => ({
      base: (i / 48) * Math.PI * 2,
      radius: 40 + Math.random() * 120,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
    }));

    return { cx, cy, petals, roots, dust, filaments, w, h };
  }

  function resize(state, w, h) {
    state.w = w;
    state.h = h;
    state.cx = w * 0.5;
    state.cy = h * 0.44;
  }

  function step(state, t, mx, my, gesture) {
    const { w, h, dust } = state;
    const gx = mx * w;
    const gy = my * h;
    const pull = gesture?.enabled && gesture.hasHand ? 1 - gesture.openness : 0;
    const push = gesture?.enabled && gesture.hasHand ? gesture.openness : 0;

    dust.forEach((d) => {
      d.x += d.vx * 0.6 + Math.sin(t * 0.4 + d.y * 0.01) * 0.08;
      d.y += d.vy * 0.6 + Math.cos(t * 0.35 + d.x * 0.01) * 0.06;

      const dx = gx - d.x;
      const dy = gy - d.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (pull > 0.2 && dist < 280) {
        const f = (1 - dist / 280) * pull * 0.35;
        d.x += (dx / dist) * f * 8;
        d.y += (dy / dist) * f * 8;
      }
      if (push > 0.25 && dist < 360) {
        const f = (1 - dist / 360) * push * 0.5;
        d.x -= (dx / dist) * f * 10;
        d.y -= (dy / dist) * f * 10;
      }

      if (d.x < 0) d.x = w;
      if (d.x > w) d.x = 0;
      if (d.y < 0) d.y = h;
      if (d.y > h) d.y = 0;
    });
  }

  function drawPetal(ctx, cx, cy, p, t, w, h, dpr) {
    const sway = Math.sin(t * 0.55 + p.phase) * 0.12;
    const spread = p.spread + sway;
    const y0 = cy - h * p.lift;
    const x0 = cx + p.side * w * 0.02;
    const x1 = cx + p.side * w * spread * 0.38;
    const y1 = cy - h * (0.08 + p.lane * 0.015);
    const x2 = cx + p.side * w * spread * 0.48;
    const y2 = cy + h * 0.02;

    ctx.lineWidth = 1.2 * dpr;
    for (let i = 0; i <= 24; i += 1) {
      const u = i / 24;
      const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * x1 + u * u * x2;
      const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * y1 + u * u * y2;
      const r = (2.2 + Math.sin(t + i * 0.4) * 0.6) * dpr;
      const a = 0.25 + (1 - u) * 0.45;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      g.addColorStop(0, `rgba(255, 248, 230, ${a})`);
      g.addColorStop(0.35, `rgba(200, 220, 255, ${a * 0.35})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRoot(ctx, cx, cy, r, t, w, h, dpr) {
    const len = r.len * h * 0.55;
    const x0 = cx + Math.sin(r.angle) * w * 0.04;
    const y0 = cy + h * 0.04;
    const cpX = x0 + Math.sin(r.angle + Math.sin(t * 0.7 + r.wobble) * 0.3) * w * 0.12;
    const cpY = y0 + len * 0.45;
    const x1 = x0 + Math.sin(r.angle) * w * 0.18;
    const y1 = y0 + len;

    const alpha = 0.12 + r.thick * 0.08;
    ctx.strokeStyle = `rgba(255, 190, 90, ${alpha})`;
    ctx.lineWidth = r.thick * dpr;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cpX, cpY, x1, y1);
    ctx.stroke();

    for (let i = 0; i < 8; i += 1) {
      const u = i / 8;
      const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cpX + u * u * x1;
      const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cpY + u * u * y1;
      const pr = (1.2 + r.thick * 0.8) * dpr;
      const g = ctx.createRadialGradient(x, y, 0, x, y, pr * 3);
      g.addColorStop(0, `rgba(255, 220, 140, ${alpha * 1.2})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, pr * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw(ctx, state, t, mx, my, dpr, gesture) {
    const { w, h, cx, cy, petals, roots, dust, filaments } = state;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "screen";

    const pulse = 0.85 + Math.sin(t * 0.9) * 0.15;
    const beamW = 55 * dpr * pulse;
    const beam = ctx.createLinearGradient(cx, cy - h * 0.28, cx, cy + h * 0.18);
    beam.addColorStop(0, "rgba(255, 230, 180, 0)");
    beam.addColorStop(0.32, "rgba(255, 210, 120, 0.35)");
    beam.addColorStop(0.5, "rgba(255, 255, 245, 0.75)");
    beam.addColorStop(0.68, "rgba(255, 185, 80, 0.35)");
    beam.addColorStop(1, "rgba(255, 160, 60, 0)");
    ctx.fillStyle = beam;
    ctx.fillRect(cx - beamW * 0.5, cy - h * 0.28, beamW, h * 0.46);

    const core = ctx.createRadialGradient(cx, cy - h * 0.02, 0, cx, cy, Math.min(w, h) * 0.22);
    core.addColorStop(0, "rgba(255, 255, 250, 0.55)");
    core.addColorStop(0.25, "rgba(255, 210, 130, 0.22)");
    core.addColorStop(0.55, "rgba(140, 180, 255, 0.06)");
    core.addColorStop(1, "transparent");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.22, 0, Math.PI * 2);
    ctx.fill();

    filaments.forEach((f) => {
      const a = f.base + Math.sin(t * f.speed + f.phase) * 0.25;
      const r = f.radius * (0.9 + Math.sin(t * 0.6 + f.phase) * 0.1);
      const x = cx + Math.cos(a) * r * dpr;
      const y = cy + Math.sin(a) * r * 0.55 * dpr;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 8 * dpr);
      g.addColorStop(0, "rgba(220, 235, 255, 0.12)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 8 * dpr, 0, Math.PI * 2);
      ctx.fill();
    });

    roots.forEach((r) => drawRoot(ctx, cx, cy, r, t, w, h, dpr));
    petals.forEach((p) => drawPetal(ctx, cx, cy, p, t, w, h, dpr));

    dust.forEach((d) => {
      const tw = d.alpha * (0.7 + 0.3 * Math.sin(t * 1.5 + d.x * 0.02));
      const r = d.size * dpr;
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 3);
      if (d.hue < 80) {
        g.addColorStop(0, `rgba(255, 210, 120, ${tw})`);
        g.addColorStop(1, "transparent");
      } else {
        g.addColorStop(0, `rgba(180, 215, 255, ${tw * 0.7})`);
        g.addColorStop(1, "transparent");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r * 3, 0, Math.PI * 2);
      ctx.fill();
    });

    if (gesture?.enabled && gesture.hasHand) {
      const hx = gesture.x * w;
      const hy = gesture.y * h;
      const opened = gesture.openness;
      const closed = 1 - opened;
      const gr = (80 + opened * 160 + closed * 100) * dpr;
      const aura = ctx.createRadialGradient(hx, hy, 0, hx, hy, gr);
      aura.addColorStop(0, `rgba(255, 220, 150, ${0.15 + closed * 0.25})`);
      aura.addColorStop(0.4, `rgba(160, 210, 255, ${0.08 + opened * 0.15})`);
      aura.addColorStop(1, "transparent");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(hx, hy, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";

    const vig = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.12, cx, cy, Math.max(w, h) * 0.65);
    vig.addColorStop(0, "transparent");
    vig.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  return { create, resize, step, draw };
})();
