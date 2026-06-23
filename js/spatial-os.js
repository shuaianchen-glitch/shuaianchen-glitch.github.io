window.SpatialOS = (() => {
  const ZONES = {
    project: { cx: 38, cy: 36, spreadX: 22, spreadY: 18 },
    capability: { cx: 62, cy: 36, spreadX: 22, spreadY: 18 },
    experiment: { cx: 38, cy: 66, spreadX: 20, spreadY: 16 },
    note: { cx: 62, cy: 66, spreadX: 20, spreadY: 16 },
    skill: { cx: 62, cy: 58, spreadX: 18, spreadY: 12 },
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
    const pull = (1 - rel) * 8;
    const x = zone.cx + (t - 0.5) * zone.spreadX + (50 - zone.cx) * pull * 0.08;
    const y = zone.cy + (0.5 - t) * zone.spreadY * 0.35 + (50 - zone.cy) * pull * 0.06;
    return { x, y };
  }

  function nodeScale(weight) {
    return 0.88 + (weight / 100) * 0.28;
  }

  function renderRail() {
    const nav = document.getElementById("rail-nav");
    const groups = document.getElementById("rail-groups");
    if (!nav || !groups) return;

    nav.innerHTML = "";
    window.SITE.domains.forEach((d, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rail-item";
      btn.dataset.domain = d.id;
      btn.innerHTML = `<span class="rail-item-label">${d.label}</span><span class="rail-item-sub">${d.focus}</span>`;
      btn.classList.toggle("is-active", i === state.domainIndex);
      btn.addEventListener("click", () => setDomain(i));
      nav.appendChild(btn);
    });

    groups.innerHTML = "";
    const filtered = nodes().filter((n) => n.domain === domain().id);
    filtered.forEach((n) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "rail-node";
      row.dataset.id = n.id;
      row.innerHTML = `
        <span class="rail-node-title">${n.title}</span>
        <span class="rail-node-meta">${n.category} · ${n.weight}</span>
      `;
      row.classList.toggle("is-active", state.activeId === n.id);
      row.addEventListener("click", () => focusNode(n.id));
      groups.appendChild(row);
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
    btn.style.setProperty("--x", `${pos.x}%`);
    btn.style.setProperty("--y", `${pos.y}%`);
    btn.style.setProperty("--scale", nodeScale(node.weight));
    btn.style.setProperty("--wt", node.weight / 100);
    btn.style.setProperty("--rel", node.relevance / 100);

    btn.innerHTML = `
      <span class="field-node-glow" aria-hidden="true"></span>
      <span class="field-node-body">
        <span class="field-node-title">${node.title}</span>
        <span class="field-node-cat">${node.category}</span>
      </span>
    `;

    btn.addEventListener("mouseenter", () => setHover(node.id));
    btn.addEventListener("mouseleave", () => clearHover());
    btn.addEventListener("click", () => focusNode(node.id));
    return btn;
  }

  function updateHud() {
    document.getElementById("hud-focus").textContent = domain().focus;
    document.getElementById("hud-mode").textContent = mode().label;
    document.getElementById("hud-depth").textContent = `${Math.round(state.depth)}%`;
    const active = state.activeId ? nodeById(state.activeId) : null;
    document.getElementById("hud-active").textContent = active ? active.title : "None";
    document.getElementById("os-version").textContent = window.SITE.os.version;
    document.getElementById("os-operator").textContent = window.SITE.os.operator;
    document.getElementById("year").textContent = new Date().getFullYear();
  }

  function updateDetail(node) {
    const empty = document.getElementById("detail-empty");
    const body = document.getElementById("detail-body");
    if (!node) {
      empty.hidden = false;
      body.hidden = true;
      return;
    }
    empty.hidden = true;
    body.hidden = false;

    document.getElementById("detail-category").textContent = node.category;
    document.getElementById("detail-title").textContent = node.title;
    document.getElementById("detail-desc").textContent = node.desc;
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
    if (node.category === "project" && node.link) {
      cta.hidden = false;
      cta.textContent = node.live ? "Open project →" : window.SITE.soon.message;
      cta.disabled = !node.live;
      cta.onclick = () => {
        if (!node.live) return;
        if (node.external) window.open(node.link, "_blank", "noopener");
        else window.location.href = node.link;
      };
    } else {
      cta.hidden = true;
    }
  }

  function applyFieldState() {
    const m = mode();
    document.body.dataset.mode = m.id;
    document.body.dataset.domain = domain().id;
    document.body.style.setProperty("--field-density", m.density);
    document.body.style.setProperty("--secondary-opacity", m.secondaryOpacity);
    document.body.style.setProperty("--engage-depth", state.depth / 100);

    fieldEl?.style.setProperty("--depth-scale", `${0.94 + (state.depth / 100) * 0.08}`);

    document.querySelectorAll(".field-node").forEach((el) => {
      const id = el.dataset.id;
      const isActive = state.activeId === id;
      const isHover = state.hoverId === id;
      const isDim = state.activeId && state.activeId !== id;
      el.classList.toggle("is-active", isActive);
      el.classList.toggle("is-hover", isHover);
      el.classList.toggle("is-dim", isDim);
    });

    document.querySelectorAll(".rail-node").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.id === state.activeId);
    });

    document.querySelectorAll(".rail-item").forEach((el, i) => {
      el.classList.toggle("is-active", i === state.domainIndex);
    });

    const clearBtn = document.getElementById("detail-clear");
    if (clearBtn) clearBtn.hidden = !state.activeId;
  }

  function setDomain(index) {
    state.domainIndex = index;
    if (state.activeId) {
      const active = nodeById(state.activeId);
      if (active && active.domain !== domain().id) state.activeId = null;
    }
    renderRail();
    updateHud();
    updateDetail(state.activeId ? nodeById(state.activeId) : null);
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
    updateDetail(nodeById(id));
    applyFieldState();
  }

  function clearHover() {
    if (state.activeId) return;
    state.hoverId = null;
    updateDetail(null);
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
    renderRail();
    updateHud();
    updateDetail(node);
    applyFieldState();
    document.body.classList.toggle("is-focused", !!state.activeId);
  }

  function bindHud() {
    document.getElementById("hud-mode-btn")?.addEventListener("click", cycleMode);
    document.getElementById("detail-clear")?.addEventListener("click", () => focusNode(state.activeId));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.activeId) focusNode(state.activeId);
    });
  }

  function bindDepthScroll() {
    fieldEl = document.getElementById("spos-field");
    fieldEl?.addEventListener("wheel", (e) => {
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
      lens.tx = 50;
      lens.ty = 50;
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
    renderRail();
    renderField();
    updateHud();
    updateDetail(null);
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
