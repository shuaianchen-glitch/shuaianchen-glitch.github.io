window.StructuredField = (() => {
  const GEOM = {
    primary: { count: 6, rx: 34, ry: 24, offset: -90, depth: [0, 4, -2, 3, -3, 2] },
    secondary: { count: 8, radius: 46, offset: -67.5, depth: [0, 2, -1, 3, -2, 1, -3, 2] },
  };

  let stage;
  let hoverNode = null;
  let focusNode = null;
  let parallaxTarget = { x: 0, y: 0 };
  let parallaxCurrent = { x: 0, y: 0 };
  let raf = 0;

  function ringPoint(index, total, radius, offsetDeg, rxScale, ryScale) {
    const angle = ((offsetDeg + (360 / total) * index) * Math.PI) / 180;
    const rx = radius * (rxScale ?? 1);
    const ry = radius * (ryScale ?? rxScale ?? 1);
    return {
      x: 50 + rx * Math.cos(angle),
      y: 50 + ry * Math.sin(angle),
    };
  }

  function nodeScale(weight) {
    return 0.82 + weight * 0.38;
  }

  function nodeGlow(weight) {
    return 0.12 + weight * 0.35;
  }

  function createNode(item, layer, index) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `sfg-node sfg-node--${layer} sfg-node--${item.type}`;
    btn.dataset.id = item.id;
    btn.dataset.type = item.type;
    btn.dataset.weight = item.weight;
    btn.dataset.relevance = item.relevance;
    btn.setAttribute("aria-label", `${item.title} · ${item.type}`);

    const geom = layer === "primary" ? GEOM.primary : GEOM.secondary;
    const pos = layer === "primary"
      ? ringPoint(index, geom.count, 1, geom.offset, geom.rx, geom.ry)
      : ringPoint(index, geom.count, geom.radius, geom.offset, 1, 0.72);
    const depth = geom.depth[index] || 0;

    btn.style.setProperty("--x", `${pos.x}%`);
    btn.style.setProperty("--y", `${pos.y}%`);
    btn.style.setProperty("--z", `${depth}px`);
    btn.style.setProperty("--scale", nodeScale(item.weight));
    btn.style.setProperty("--glow", nodeGlow(item.weight));
    btn.style.setProperty("--rel", item.relevance);

    btn.innerHTML = `
      <span class="sfg-node-ring" aria-hidden="true"></span>
      <span class="sfg-node-core" aria-hidden="true"></span>
      <span class="sfg-node-label">${item.title}</span>
      <span class="sfg-node-type">${formatType(item.type)}</span>
    `;

    btn.addEventListener("mouseenter", () => setHover(item, btn));
    btn.addEventListener("mouseleave", () => clearHover(btn));
    btn.addEventListener("focus", () => setHover(item, btn));
    btn.addEventListener("blur", () => clearHover(btn));
    btn.addEventListener("click", () => openPanel(item));

    return btn;
  }

  function formatType(type) {
    const map = {
      project: "Project",
      capability: "Capability",
      note: "Note",
      experiment: "Experiment",
      skill: "Skill",
    };
    return map[type] || type;
  }

  function renderNodes() {
    const primaryRoot = document.getElementById("ring-primary");
    const secondaryRoot = document.getElementById("ring-secondary");
    if (!primaryRoot || !secondaryRoot) return;

    window.SITE.primary.forEach((item, i) => {
      primaryRoot.appendChild(createNode(item, "primary", i));
    });
    window.SITE.secondary.forEach((item, i) => {
      secondaryRoot.appendChild(createNode(item, "secondary", i));
    });
  }

  function drawGuides() {
    const svg = document.getElementById("sfg-guides");
    if (!svg) return;

    const primaryEllipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    primaryEllipse.setAttribute("cx", "50%");
    primaryEllipse.setAttribute("cy", "50%");
    primaryEllipse.setAttribute("rx", `${GEOM.primary.rx}%`);
    primaryEllipse.setAttribute("ry", `${GEOM.primary.ry}%`);
    primaryEllipse.setAttribute("class", "sfg-guide sfg-guide--primary");
    svg.appendChild(primaryEllipse);

    const outerCircle = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    outerCircle.setAttribute("cx", "50%");
    outerCircle.setAttribute("cy", "50%");
    outerCircle.setAttribute("rx", `${GEOM.secondary.radius}%`);
    outerCircle.setAttribute("ry", `${GEOM.secondary.radius * 0.72}%`);
    outerCircle.setAttribute("class", "sfg-guide sfg-guide--secondary");
    svg.appendChild(outerCircle);

    window.SITE.primary.forEach((_, i) => {
      const p = ringPoint(i, GEOM.primary.count, 1, GEOM.primary.offset, GEOM.primary.rx, GEOM.primary.ry);
      appendSpoke(svg, 50, 50, p.x, p.y, "sfg-guide-spoke");
    });

    for (let i = 0; i < GEOM.secondary.count; i += 1) {
      const angle = ((GEOM.secondary.offset + (360 / GEOM.secondary.count) * i) * Math.PI) / 180;
      const x2 = 50 + GEOM.secondary.radius * Math.cos(angle);
      const y2 = 50 + GEOM.secondary.radius * 0.72 * Math.sin(angle);
      appendSpoke(svg, 50, 50, x2, y2, "sfg-guide-ray");
    }
  }

  function appendSpoke(svg, x1, y1, x2, y2, className) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", `${x1}%`);
    line.setAttribute("y1", `${y1}%`);
    line.setAttribute("x2", `${x2}%`);
    line.setAttribute("y2", `${y2}%`);
    line.setAttribute("class", className);
    svg.appendChild(line);
  }

  function setHover(item, btn) {
    if (focusNode) return;
    hoverNode = item;
    btn.classList.add("is-active");
    document.querySelectorAll(".sfg-node").forEach((n) => {
      if (n !== btn) n.classList.add("is-dim");
    });
    showMeta(item);
  }

  function clearHover(btn) {
    if (focusNode) return;
    hoverNode = null;
    btn.classList.remove("is-active");
    document.querySelectorAll(".sfg-node").forEach((n) => n.classList.remove("is-dim"));
    hideMeta();
  }

  function showMeta(item) {
    const panel = document.getElementById("sfg-meta");
    if (!panel) return;
    panel.hidden = false;
    document.getElementById("meta-type").textContent = formatType(item.type);
    document.getElementById("meta-title").textContent = item.title;
    document.getElementById("meta-body").textContent = item.desc || "";
    document.getElementById("meta-weight").textContent = `${Math.round(item.weight * 100)}`;
    document.getElementById("meta-relevance").textContent = `${Math.round(item.relevance * 100)}`;
    const tags = document.getElementById("meta-tags");
    tags.innerHTML = "";
    (item.tags || []).forEach((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.appendChild(span);
    });
  }

  function hideMeta() {
    const panel = document.getElementById("sfg-meta");
    if (panel) panel.hidden = true;
  }

  function openPanel(item) {
    focusNode = item;
    hideMeta();
    document.body.classList.add("sfg-focused");

    const panel = document.getElementById("sfg-panel");
    panel.hidden = false;
    document.getElementById("panel-type").textContent = formatType(item.type);
    document.getElementById("panel-title").textContent = item.title;
    document.getElementById("panel-body").textContent = item.desc || "";
    document.getElementById("panel-weight").textContent = `${Math.round(item.weight * 100)}`;
    document.getElementById("panel-relevance").textContent = `${Math.round(item.relevance * 100)}`;

    const tags = document.getElementById("panel-tags");
    tags.innerHTML = "";
    (item.tags || []).forEach((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.appendChild(span);
    });

    const cta = document.getElementById("panel-cta");
    if (item.type === "project" && item.link) {
      cta.hidden = false;
      cta.textContent = item.live ? "Open project →" : window.SITE.soon.message;
      cta.disabled = !item.live;
      cta.onclick = () => {
        if (!item.live) return;
        if (item.external) window.open(item.link, "_blank", "noopener");
        else window.location.href = item.link;
      };
    } else {
      cta.hidden = true;
    }

    document.querySelectorAll(".sfg-node").forEach((n) => {
      n.classList.toggle("is-selected", n.dataset.id === item.id);
      n.classList.toggle("is-dim", n.dataset.id !== item.id);
    });
  }

  function closePanel() {
    focusNode = null;
    document.body.classList.remove("sfg-focused");
    document.getElementById("sfg-panel").hidden = true;
    document.querySelectorAll(".sfg-node").forEach((n) => {
      n.classList.remove("is-selected", "is-dim", "is-active");
    });
  }

  function bindIdentity() {
    const id = window.SITE.identity;
    document.getElementById("sfg-name").textContent = id.name;
    document.getElementById("sfg-name-en").textContent = id.nameEn;
    document.getElementById("sfg-role").textContent = id.role;
    document.getElementById("sfg-philosophy").textContent = id.philosophy;
    document.getElementById("sfg-label").textContent = window.SITE.system.label;
    document.getElementById("sfg-version").textContent = window.SITE.system.version;
    document.getElementById("sfg-hint-hover").textContent = window.SITE.system.hints.hover;
    document.getElementById("sfg-hint-focus").textContent = window.SITE.system.hints.focus;
    document.getElementById("year").textContent = new Date().getFullYear();
  }

  function bindParallax() {
    stage = document.getElementById("sfg-stage");
    window.addEventListener("pointermove", (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      parallaxTarget.x = nx * 6;
      parallaxTarget.y = ny * 4;
    });
    window.addEventListener("pointerleave", () => {
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
    });
  }

  function tick() {
    parallaxCurrent.x += (parallaxTarget.x - parallaxCurrent.x) * 0.06;
    parallaxCurrent.y += (parallaxTarget.y - parallaxCurrent.y) * 0.06;
    if (stage && !focusNode) {
      stage.style.setProperty("--px", `${parallaxCurrent.x}px`);
      stage.style.setProperty("--py", `${parallaxCurrent.y}px`);
    }
    raf = requestAnimationFrame(tick);
  }

  function bindChrome() {
    document.getElementById("panel-close")?.addEventListener("click", closePanel);
    document.getElementById("panel-backdrop")?.addEventListener("click", closePanel);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanel();
    });
  }

  function init() {
    bindIdentity();
    drawGuides();
    renderNodes();
    bindParallax();
    bindChrome();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function destroy() {
    cancelAnimationFrame(raf);
  }

  return { init, destroy, closePanel };
})();
