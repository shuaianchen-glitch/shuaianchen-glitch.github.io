window.SpatialOS = (() => {
  const ZONES = {
    project: { cx: 52, cy: 42, spreadX: 28, spreadY: 22 },
    capability: { cx: 58, cy: 38, spreadX: 24, spreadY: 20 },
    experiment: { cx: 48, cy: 52, spreadX: 22, spreadY: 18 },
    note: { cx: 55, cy: 58, spreadX: 20, spreadY: 16 },
    skill: { cx: 62, cy: 50, spreadX: 16, spreadY: 14 },
  };

  let state = {
    modeIndex: 0,
    domainIndex: 0,
    depth: 32,
    activeId: null,
    hoverId: null,
  };

  let lensEl;
  let fieldEl;
  let raf = 0;
  let lens = { x: 50, y: 50, tx: 50, ty: 50 };

  function nodes() {
    return window.SITE.nodes;
  }

  function nodeById(id) {
    return nodes().find((n) => n.id === id);
  }

  function mode() {
    return window.SITE.modes[state.modeIndex];
  }

  function domain() {
    return window.SITE.domains[state.domainIndex];
  }

  function computePosition(node, index, siblings) {
    const zone = ZONES[node.category] || ZONES.note;
    const t = siblings.length > 1 ? index / (siblings.length - 1) : 0.5;
    const rel = node.relevance / 100;
    const pull = (1 - rel) * 6;
    const x = zone.cx + (t - 0.5) * zone.spreadX + (52 - zone.cx) * pull * 0.06;
    const y = zone.cy + (0.5 - t) * zone.spreadY * 0.3 + (48 - zone.cy) * pull * 0.05;
    return { x, y };
  }

  function nodeScale(weight) {
    return 0.88 + (weight / 100) * 0.28;
  }

  function padNum(n) {
    return String(n).padStart(2, "0");
  }

  function renderIndex() {
    const list = document.getElementById("index-list");
    if (!list) return;
    list.innerHTML = "";

    nodes().forEach((n, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "index-item";
      btn.dataset.id = n.id;
      const sub = n.live === false ? "In formation" : n.category;
      btn.innerHTML = `
        <span class="index-num">${padNum(i + 1)}</span>
        <span class="index-title">${n.title}</span>
        <span class="index-sub">${sub}</span>
      `;
      btn.classList.toggle("is-active", state.activeId === n.id);
      btn.classList.toggle("is-dim", state.activeId && state.activeId !== n.id);
      btn.addEventListener("click", () => focusNode(n.id));
      list.appendChild(btn);
    });
  }

  function renderField() {
    const primary = document.getElementById("layer-primary");
    const secondary = document.getElementById("layer-secondary");
    if (!primary || !secondary) return;

    primary.innerHTML = "";
    secondary.innerHTML = "";

    const byCategory = {};
    nodes().forEach((n) => {
      if (!byCategory[n.category]) byCategory[n.category] = [];
      byCategory[n.category].push(n);
    });

    nodes().forEach((n) => {
      const siblings = byCategory[n.category];
      const index = siblings.indexOf(n);
      const pos = computePosition(n, index, siblings);
      const layer = n.depth === 1 ? primary : secondary;
      layer.appendChild(createFieldNode(n, pos));
    });
  }

  function createFieldNode(node, pos) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `field-node field-node--d${node.depth} field-node--${node.category}`;
    btn.dataset.id = node.id;
    btn.setAttribute("aria-label", node.title);
    btn.style.setProperty("--x", `${pos.x}%`);
    btn.style.setProperty("--y", `${pos.y}%`);
    btn.style.setProperty("--scale", nodeScale(node.weight));
    btn.style.setProperty("--wt", node.weight / 100);
    btn.style.setProperty("--rel", node.relevance / 100);

    btn.innerHTML = `
      <span class="field-node-glow" aria-hidden="true"></span>
      <span class="field-node-body"></span>
      <span class="field-node-title">${node.title}</span>
      <span class="field-node-cat">${node.category}</span>
    `;

    btn.addEventListener("mouseenter", () => setHover(node.id));
    btn.addEventListener("mouseleave", () => clearHover());
    btn.addEventListener("click", () => focusNode(node.id));
    return btn;
  }

  function bindStaticCopy() {
    const ui = window.SITE.ui;
    document.getElementById("crumb-1").textContent = ui.breadcrumbLine1;
    document.getElementById("crumb-2").textContent = ui.breadcrumbLine2;
    document.getElementById("room-label").textContent = ui.roomLabel;
    document.getElementById("tech-meta").textContent = ui.techMeta;
    document.getElementById("index-label").textContent = ui.indexLabel;
    document.getElementById("hero-title").textContent = ui.heroTitle;
    document.getElementById("hero-desc").textContent = ui.heroDesc;
  }

  function updateHud() {
    document.getElementById("hud-focus").textContent = domain().focus;
    document.getElementById("hud-mode").textContent = mode().label;
    document.getElementById("hud-depth").textContent = `${Math.round(state.depth)}%`;
    const active = state.activeId ? nodeById(state.activeId) : null;
    document.getElementById("hud-active").textContent = active ? active.title : "None";

    const d = domain();
    document.getElementById("crumb-2").textContent =
      `${window.SITE.ui.breadcrumbLine2.split("/")[0].trim()} / ${d.label.toUpperCase()}`;
  }

  function updateHero(node) {
    const ui = window.SITE.ui;
    const titleEl = document.getElementById("hero-title");
    const descEl = document.getElementById("hero-desc");
    const detailEl = document.getElementById("hero-detail");

    if (!node) {
      titleEl.textContent = ui.heroTitle;
      descEl.textContent = ui.heroDesc;
      detailEl.hidden = true;
      return;
    }

    titleEl.textContent = node.title;
    descEl.textContent = node.desc;
    detailEl.hidden = false;

    document.getElementById("detail-category").textContent = node.category;
    document.getElementById("detail-weight").textContent = node.weight;
    document.getElementById("detail-relevance").textContent = node.relevance;
    document.getElementById("detail-depth-level").textContent = `L${node.depth}`;

    const tags = document.getElementById("detail-tags");
    tags.innerHTML = "";
    (node.tags || [node.domain]).forEach((t) => {
      const s = document.createElement("span");
      s.textContent = t;
      tags.appendChild(s);
    });

    const cta = document.getElementById("detail-cta");
    const clearBtn = document.getElementById("detail-clear");
    if (node.category === "project" && node.link) {
      cta.hidden = false;
      clearBtn.hidden = !state.activeId;
      cta.textContent = node.live ? "Open →" : window.SITE.soon.message;
      cta.disabled = !node.live;
      cta.onclick = () => {
        if (!node.live) return;
        if (node.external) window.open(node.link, "_blank", "noopener");
        else window.location.href = node.link;
      };
    } else {
      cta.hidden = true;
      clearBtn.hidden = !state.activeId;
    }
  }

  function applyFieldState() {
    const m = mode();
    document.body.dataset.mode = m.id;
    document.body.dataset.domain = domain().id;
    document.body.style.setProperty("--field-density", m.density);
    document.body.style.setProperty("--secondary-opacity", m.secondaryOpacity);
    fieldEl?.style.setProperty("--depth-scale", `${0.96 + (state.depth / 100) * 0.06}`);

    document.querySelectorAll(".field-node").forEach((el) => {
      const id = el.dataset.id;
      el.classList.toggle("is-active", state.activeId === id);
      el.classList.toggle("is-hover", state.hoverId === id);
      el.classList.toggle("is-dim", state.activeId && state.activeId !== id);
    });

    document.querySelectorAll(".index-item").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.id === state.activeId);
      el.classList.toggle("is-dim", state.activeId && el.dataset.id !== state.activeId);
    });
  }

  function setDomain(index) {
    state.domainIndex = index;
    updateHud();
    applyFieldState();
  }

  function cycleMode() {
    state.modeIndex = (state.modeIndex + 1) % window.SITE.modes.length;
    updateHud();
    applyFieldState();
  }

  function setHover(id) {
    if (state.activeId) return;
    state.hoverId = id;
    updateHero(nodeById(id));
    applyFieldState();
  }

  function clearHover() {
    if (state.activeId) return;
    state.hoverId = null;
    updateHero(null);
    applyFieldState();
  }

  function focusNode(id) {
    state.activeId = state.activeId === id ? null : id;
    state.hoverId = null;
    const node = state.activeId ? nodeById(state.activeId) : null;
    if (node) {
      const dIdx = window.SITE.domains.findIndex((d) => d.id === node.domain);
      if (dIdx >= 0) state.domainIndex = dIdx;
    }
    updateHud();
    updateHero(node);
    applyFieldState();
    document.body.classList.toggle("is-focused", !!state.activeId);
  }

  function bindHud() {
    document.getElementById("hud-mode-btn")?.addEventListener("click", cycleMode);
    document.getElementById("detail-clear")?.addEventListener("click", () => {
      if (state.activeId) focusNode(state.activeId);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.activeId) focusNode(state.activeId);
    });
  }

  function bindDepthScroll() {
    fieldEl = document.getElementById("spos-field");
    window.addEventListener("wheel", (e) => {
      e.preventDefault();
      state.depth = Math.max(0, Math.min(100, state.depth + e.deltaY * 0.06));
      updateHud();
      applyFieldState();
    }, { passive: false });
  }

  function bindLens() {
    lensEl = document.getElementById("focus-lens");
    fieldEl?.addEventListener("pointermove", (e) => {
      const rect = fieldEl.getBoundingClientRect();
      lens.tx = ((e.clientX - rect.left) / rect.width) * 100;
      lens.ty = ((e.clientY - rect.top) / rect.height) * 100;
    });
    fieldEl?.addEventListener("pointerleave", () => {
      lens.tx = 52;
      lens.ty = 48;
    });
  }

  function tick() {
    lens.x += (lens.tx - lens.x) * 0.08;
    lens.y += (lens.ty - lens.y) * 0.08;
    if (lensEl) {
      lensEl.style.setProperty("--lx", `${lens.x}%`);
      lensEl.style.setProperty("--ly", `${lens.y}%`);
    }
    raf = requestAnimationFrame(tick);
  }

  function init() {
    fieldEl = document.getElementById("spos-field");
    bindStaticCopy();
    renderIndex();
    renderField();
    updateHud();
    updateHero(null);
    applyFieldState();
    bindHud();
    bindDepthScroll();
    bindLens();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function destroy() {
    cancelAnimationFrame(raf);
  }

  return { init, destroy };
})();
