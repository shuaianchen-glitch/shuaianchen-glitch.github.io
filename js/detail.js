window.Detail = (() => {
  let layer, card, backdrop, ripple, closeBtn, ctaBtn;
  let currentProject = null;
  let onCloseCb = null;
  let open = false;

  function $(id) {
    return document.getElementById(id);
  }

  function fill(project) {
    $("detail-icon").textContent = project.icon;
    $("detail-star").textContent = `${project.star.bayer} · ${project.star.cn} · ${project.star.name}`;
    $("detail-title").textContent = project.title;
    $("detail-desc").textContent = project.desc;
    $("detail-tags").innerHTML = (project.tags || [])
      .map((t) => `<span>${t}</span>`)
      .join("");
    $("detail-whisper").textContent = project.live
      ? window.SITE.transition.whispers[Math.floor(Math.random() * window.SITE.transition.whispers.length)]
      : window.SITE.soon.message;

    if (project.live) {
      ctaBtn.textContent = window.SITE.showcase.ctaLive;
      ctaBtn.className = "detail-cta is-live";
    } else {
      ctaBtn.textContent = window.SITE.showcase.ctaSoon;
      ctaBtn.className = "detail-cta is-soon";
    }
  }

  function openPanel(project, ox, oy, opts = {}) {
    if (open) closePanel(true);
    currentProject = project;
    onCloseCb = opts.onClose;
    fill(project);

    layer.style.setProperty("--ox", `${ox}px`);
    layer.style.setProperty("--oy", `${oy}px`);
    layer.setAttribute("aria-hidden", "false");
    ripple.style.left = `${ox}px`;
    ripple.style.top = `${oy}px`;

    layer.classList.add("is-opening");
    requestAnimationFrame(() => {
      layer.classList.add("is-open");
      open = true;
      card.focus();
    });

    document.body.classList.add("detail-open");
  }

  function closePanel(instant = false) {
    if (!open && !instant) return;
    layer.classList.remove("is-open");
    document.body.classList.remove("detail-open");

    const done = () => {
      layer.classList.remove("is-opening");
      layer.setAttribute("aria-hidden", "true");
      open = false;
      currentProject = null;
      onCloseCb?.();
      onCloseCb = null;
    };

    if (instant) {
      done();
      return;
    }
    setTimeout(done, 680);
  }

  function onCtaClick() {
    if (!currentProject) return;
    if (currentProject.live) {
      const p = currentProject;
      closePanel(true);
      window.Main?.navigate(p);
    } else {
      ctaBtn.classList.add("is-pulse");
      setTimeout(() => ctaBtn.classList.remove("is-pulse"), 600);
    }
  }

  function init() {
    layer = $("detail-layer");
    card = $("detail-card");
    backdrop = $("detail-backdrop");
    ripple = $("detail-ripple");
    closeBtn = $("detail-close");
    ctaBtn = $("detail-cta");

    closeBtn?.addEventListener("click", () => closePanel());
    backdrop?.addEventListener("click", () => closePanel());
    ctaBtn?.addEventListener("click", onCtaClick);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) closePanel();
    });
  }

  return { init, open: openPanel, close: closePanel };
})();
