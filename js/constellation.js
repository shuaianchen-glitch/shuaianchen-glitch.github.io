window.Constellation = (() => {
  function starKeyFromBayer(bayer) {
    const map = {
      "α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta",
      "ζ": "zeta", "θ": "theta", "ι": "iota", "ξ": "xi", "ν": "nu",
    };
    return map[bayer.split(" ")[0]] || bayer;
  }

  function buildStarMap() {
    const map = {};
    window.SITE.projects.forEach((p) => {
      map[starKeyFromBayer(p.star.bayer)] = { x: p.star.x, y: p.star.y, mag: p.star.mag };
    });
    map.delta = { x: window.SITE.hub.x, y: window.SITE.hub.y, mag: window.SITE.hub.mag };
    window.SITE.decorStars.forEach((s) => {
      map[starKeyFromBayer(s.bayer)] = { x: s.x, y: s.y, mag: s.mag };
    });
    return map;
  }

  function magClass(mag) {
    if (mag < 3.2) return "mag-bright";
    if (mag < 3.8) return "mag-medium";
    if (mag < 4.2) return "mag-dim";
    return "mag-faint";
  }

  function twinkleDelay(mag, seed) {
    return `${((seed * 1.7 + mag) % 4).toFixed(2)}s`;
  }

  function renderLines(svg, map) {
    const lines = window.SITE.lines || [];
    lines.forEach(([a, b]) => {
      const sa = map[a];
      const sb = map[b];
      if (!sa || !sb) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "constellation-line");
      line.setAttribute("x1", `${sa.x * 100}%`);
      line.setAttribute("y1", `${sa.y * 100}%`);
      line.setAttribute("x2", `${sb.x * 100}%`);
      line.setAttribute("y2", `${sb.y * 100}%`);
      svg.appendChild(line);
    });
  }

  function renderHub(wrap) {
    const h = window.SITE.hub;
    const el = document.createElement("div");
    el.className = `hub-star ${magClass(h.mag)}`;
    el.style.left = `${h.x * 100}%`;
    el.style.top = `${h.y * 100}%`;
    el.style.setProperty("--twinkle-delay", twinkleDelay(h.mag, 0));
    el.innerHTML = `
      <span class="star-glow" aria-hidden="true"></span>
      <span class="star-core" aria-hidden="true"></span>
      <span class="hub-tooltip">
        <span class="star-bayer">${h.bayer}</span>
        <span class="star-cn">${h.cn}</span>
        <span class="star-meta">${h.name} · 视星等 ${h.mag}</span>
      </span>`;
    wrap.appendChild(el);
  }

  function renderDecor(svg, wrap, map) {
    window.SITE.decorStars.forEach((s, i) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      g.setAttribute("class", `decor-star ${magClass(s.mag)}`);
      g.setAttribute("cx", `${s.x * 100}%`);
      g.setAttribute("cy", `${s.y * 100}%`);
      g.setAttribute("r", Math.max(1.2, 3.2 - s.mag * 0.35));
      g.style.setProperty("--twinkle-delay", twinkleDelay(s.mag, i + 3));
      svg.appendChild(g);
    });
  }

  function renderNodes(container, onLive, onSoon) {
    const projects = window.SITE.projects;
    container.innerHTML = "";

    projects.forEach((p, i) => {
      const { star } = p;
      const cls = p.live ? "star-node live" : "star-node evolving";
      const badge = p.live
        ? '<span class="star-badge live">LIVE</span>'
        : '<span class="star-badge evolve">🧬</span>';

      const el = document.createElement("button");
      el.type = "button";
      el.className = cls;
      el.dataset.idx = String(i);
      el.style.left = `${star.x * 100}%`;
      el.style.top = `${star.y * 100}%`;
      el.style.setProperty("--twinkle-delay", twinkleDelay(star.mag, i + 1));
      el.style.setProperty("--star-scale", String(Math.max(1, 1.5 - star.mag * 0.1)));

      el.innerHTML = `
        ${badge}
        <div class="star-chip">
          <span class="star-orbit-ring" aria-hidden="true"></span>
          <span class="star-glow" aria-hidden="true"></span>
          <span class="star-core ${magClass(star.mag)}" aria-hidden="true"></span>
          <span class="star-icon">${p.icon}</span>
          <span class="star-id">${star.bayer}</span>
        </div>
        <span class="star-tooltip">
          <span class="star-bayer">${star.bayer}${star.binary ? " · 双星" : ""}</span>
          <span class="star-cn">${star.cn}</span>
          <span class="star-meta">${star.name} · 视星等 ${star.mag}</span>
          <span class="star-project">${p.title}</span>
        </span>`;

      el.addEventListener("click", () => {
        if (p.live) onLive(p);
        else onSoon(p);
      });

      container.appendChild(el);
    });
  }

  function render() {
    const wrap = document.getElementById("constellation-wrap");
    const svg = document.getElementById("constellation-svg");
    const nodes = document.getElementById("star-nodes");
    if (!wrap || !svg || !nodes) return;

    svg.innerHTML = "";
    wrap.querySelectorAll(".hub-star").forEach((n) => n.remove());

    const map = buildStarMap();
    renderDecor(svg, wrap, map);
    renderLines(svg, map);
    renderHub(wrap);

    return map;
  }

  function init(onLive, onSoon) {
    render();
    renderNodes(document.getElementById("star-nodes"), onLive, onSoon);

    const wrap = document.getElementById("constellation-wrap");
    if (!wrap) return;

    wrap.addEventListener("pointermove", (e) => {
      const rect = wrap.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const py = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
      wrap.style.setProperty("--parallax-x", `${px}px`);
      wrap.style.setProperty("--parallax-y", `${py}px`);
    });
  }

  return { init, render };
})();
