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

  function ensureGlowFilter(svg) {
    if (svg.querySelector("#cap-glow")) return;
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <filter id="cap-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="0.8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
    svg.appendChild(defs);
  }

  function renderChartFrame(svg) {
    const frame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    frame.setAttribute("class", "chart-frame");
    frame.setAttribute("x", "4");
    frame.setAttribute("y", "6");
    frame.setAttribute("width", "92");
    frame.setAttribute("height", "88");
    frame.setAttribute("rx", "2");
    svg.appendChild(frame);

    for (let i = 1; i < 10; i += 1) {
      const v = document.createElementNS("http://www.w3.org/2000/svg", "line");
      v.setAttribute("class", "chart-grid");
      v.setAttribute("x1", String(i * 10));
      v.setAttribute("y1", "6");
      v.setAttribute("x2", String(i * 10));
      v.setAttribute("y2", "94");
      svg.appendChild(v);

      const h = document.createElementNS("http://www.w3.org/2000/svg", "line");
      h.setAttribute("class", "chart-grid");
      h.setAttribute("x1", "4");
      h.setAttribute("y1", String(6 + i * 8.8));
      h.setAttribute("x2", "96");
      h.setAttribute("y2", String(6 + i * 8.8));
      svg.appendChild(h);
    }

    const corners = [
      "M 4 6 L 4 14 M 4 6 L 12 6",
      "M 96 6 L 96 14 M 96 6 L 88 6",
      "M 4 94 L 4 86 M 4 94 L 12 94",
      "M 96 94 L 96 86 M 96 94 L 88 94",
    ];
    corners.forEach((d) => {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "path");
      c.setAttribute("class", "chart-corner");
      c.setAttribute("d", d);
      svg.appendChild(c);
    });
  }

  function renderSilhouette(svg) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "path");
    g.setAttribute("class", "capricorn-silhouette");
    g.setAttribute(
      "d",
      "M 35 25 L 48 18 L 58 28 L 58 58 L 82 42 L 58 58 L 38 48 L 22 55 L 28 38 Z"
    );
    svg.appendChild(g);
  }

  function renderLines(svg, map) {
    const lines = window.SITE.lines || [];
    lines.forEach(([a, b], idx) => {
      const sa = map[a];
      const sb = map[b];
      if (!sa || !sb) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "constellation-line");
      line.setAttribute("filter", "url(#line-glow)");
      line.setAttribute("data-a", a);
      line.setAttribute("data-b", b);
      line.dataset.idx = String(idx);
      line.setAttribute("x1", `${sa.x * 100}`);
      line.setAttribute("y1", `${sa.y * 100}`);
      line.setAttribute("x2", `${sb.x * 100}`);
      line.setAttribute("y2", `${sb.y * 100}`);
      svg.appendChild(line);
    });
  }

  function renderDecor(svg) {
    window.SITE.decorStars.forEach((s, i) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      g.setAttribute("class", `decor-star ${magClass(s.mag)}`);
      g.setAttribute("cx", `${s.x * 100}`);
      g.setAttribute("cy", `${s.y * 100}`);
      g.setAttribute("r", Math.max(0.35, 1.1 - s.mag * 0.15));
      g.style.setProperty("--twinkle-delay", twinkleDelay(s.mag, i + 3));
      svg.appendChild(g);
    });
  }

  function renderHub(container) {
    const h = window.SITE.hub;
    const el = document.createElement("div");
    el.className = `hub-star ${magClass(h.mag)}`;
    el.style.left = `${h.x * 100}%`;
    el.style.top = `${h.y * 100}%`;
    el.style.setProperty("--twinkle-delay", twinkleDelay(h.mag, 0));
    el.innerHTML = `
      <span class="astro-star" aria-hidden="true">
        <span class="astro-core"></span>
        <span class="astro-flare"></span>
        <span class="astro-ring"></span>
      </span>
      <span class="astro-label hub-label">
        <span class="astro-bayer">${h.bayer}</span>
        <span class="astro-cn">${h.cn}</span>
      </span>`;
    container.appendChild(el);
  }

  function renderNodes(container, onLive, onSoon) {
    container.innerHTML = "";
    window.SITE.projects.forEach((p, i) => {
      const { star } = p;
      const cls = p.live ? "star-node live" : "star-node evolving";

      const el = document.createElement("button");
      el.type = "button";
      el.className = cls;
      el.dataset.idx = String(i);
      el.dataset.bayer = star.bayer;
      el.dataset.key = starKeyFromBayer(star.bayer);
      el.style.left = `${star.x * 100}%`;
      el.style.top = `${star.y * 100}%`;
      el.style.setProperty("--twinkle-delay", twinkleDelay(star.mag, i + 1));
      el.setAttribute("aria-label", `${star.bayer} ${star.cn} · ${p.title}`);

      el.innerHTML = `
        <span class="astro-star ${magClass(star.mag)}" aria-hidden="true">
          <span class="astro-core"></span>
          <span class="astro-flare"></span>
          <span class="astro-pulse"></span>
        </span>
        <span class="astro-label">
          <span class="astro-bayer">${star.bayer}</span>
          <span class="astro-cn">${star.cn}</span>
        </span>
        <span class="astro-card">
          <span class="astro-card-icon">${p.icon}</span>
          <span class="astro-card-title">${p.title}</span>
          <span class="astro-card-meta">${star.name} · 视星等 ${star.mag}${p.live ? " · LIVE" : " · 攀登中"}</span>
        </span>`;

      el.addEventListener("mouseenter", () => highlightStar(el.dataset.key));
      el.addEventListener("focus", () => highlightStar(el.dataset.key));
      el.addEventListener("mouseleave", clearHighlight);
      el.addEventListener("blur", clearHighlight);
      el.addEventListener("click", () => (p.live ? onLive(p) : onSoon(p)));

      container.appendChild(el);
    });
  }

  function highlightStar(key) {
    document.querySelectorAll(".star-node").forEach((n) => {
      n.classList.toggle("is-linked", n.dataset.key === key);
    });
    document.querySelectorAll(".constellation-line").forEach((line) => {
      const active = line.dataset.a === key || line.dataset.b === key;
      line.classList.toggle("is-active", active);
    });
    document.querySelector(".capricorn-silhouette")?.classList.toggle("is-lit", Boolean(key));
  }

  function clearHighlight() {
    document.querySelectorAll(".star-node").forEach((n) => n.classList.remove("is-linked"));
    document.querySelectorAll(".constellation-line").forEach((line) => line.classList.remove("is-active"));
    document.querySelector(".capricorn-silhouette")?.classList.remove("is-lit");
  }

  function render() {
    const wrap = document.getElementById("constellation-wrap");
    const svg = document.getElementById("constellation-svg");
    if (!wrap || !svg) return;

    svg.innerHTML = "";
    wrap.querySelectorAll(".hub-star").forEach((n) => n.remove());

    ensureGlowFilter(svg);
    renderChartFrame(svg);
    renderSilhouette(svg);
    const map = buildStarMap();
    renderDecor(svg);
    renderLines(svg, map);
    renderHub(wrap);
    return map;
  }

  function init(onLive, onSoon) {
    render();
    renderNodes(document.getElementById("star-nodes"), onLive, onSoon);
  }

  return { init, render };
})();
