const INTRO_KEY = "sa-studio-intro-v3";
const $ = (sel) => document.querySelector(sel);

function projects() {
  return window.SITE.projects;
}

function enterSite(skipIntro = false) {
  const intro = $("#intro");
  const app = $("#app");
  const onVisible = () => {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      window.Painting?.resize?.();
      startHeroTypewriter();
    });
  };
  if (!skipIntro && intro) {
    intro.classList.add("is-leaving");
    window.IntroPig?.destroy?.();
    setTimeout(() => {
      intro.style.display = "none";
      app.classList.remove("is-hidden");
      app.classList.add("is-visible");
      onVisible();
    }, 850);
  } else {
    if (intro) intro.style.display = "none";
    window.IntroPig?.destroy?.();
    app.classList.remove("is-hidden");
    app.classList.add("is-visible");
    onVisible();
  }
  sessionStorage.setItem(INTRO_KEY, "1");
}

function initIntro() {
  const introCopy = window.SITE.intro;
  $("#intro-eyebrow").textContent = introCopy.eyebrow;
  $("#intro-sub").textContent = introCopy.sub;
  $("#intro-btn-label").textContent = introCopy.btn;

  const go = () => {
    if ($("#intro")?.classList.contains("is-leaving")) return;
    enterSite(false);
  };

  if (sessionStorage.getItem(INTRO_KEY) === "1") {
    enterSite(true);
    return;
  }

  $("#intro-enter")?.addEventListener("click", (e) => {
    e.stopPropagation();
    go();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !$("#intro")?.classList.contains("is-leaving")) go();
  });

  window.IntroPig?.init(go);
}

function randomWhisper() {
  const list = window.SITE.transition.whispers;
  return list[Math.floor(Math.random() * list.length)];
}

function navigateWithTransition(project) {
  const overlay = $("#transition");
  $("#transition-icon").textContent = project.icon;
  $("#transition-title").textContent = window.SITE.transition.entering(project.title);
  overlay.classList.add("is-active");

  setTimeout(() => {
    if (project.external) {
      window.open(project.link, "_blank", "noopener");
      overlay.classList.remove("is-active");
    } else {
      window.location.href = project.link;
    }
  }, 600);
}

function renderShowcase() {
  window.FanCarousel?.init();
}

function initNav() {
  document.querySelectorAll("[data-scroll]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const id = el.dataset.scroll;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      document.querySelectorAll(".pill[data-scroll]").forEach((p) => {
        p.classList.toggle("active", p.dataset.scroll === id);
        if (p.dataset.scroll === id) window.CascadeNav?.replay(p);
      });
    });
  });
  window.CascadeNav?.init();
}

function applyCopy() {
  const s = window.SITE.stage;
  $("#stage-tag").textContent = s.tag;
  $("#stage-hint").innerHTML = `<span class="hint-pulse"></span> ${s.hint}`;
  $("#stat-live-label").textContent = s.stats.live;
  $("#stat-climb-label").textContent = s.stats.climbing;
  $("#showcase-desc").textContent = window.SITE.showcase.desc;
  $("#manifesto-text").textContent = window.SITE.about.manifesto;
}

function startHeroTypewriter() {
  const s = window.SITE.stage;
  window.Typewriter?.run({
    lines: s.headline,
    desc: s.desc,
    delay: 500,
    speed: 46,
    descSpeed: 24,
  });
}

function initStarReadout() {
  const panel = $("#star-readout");
  if (!panel) return;

  window.addEventListener("starhover", (e) => {
    const { idx, project: p } = e.detail;
    if (idx < 0 || !p) {
      panel.classList.remove("is-visible");
      panel.hidden = true;
      $("#telemetry-mag").textContent = "—";
      $("#telemetry-sig").textContent = "STANDBY";
      return;
    }

    const s = p.star;
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add("is-visible"));
    $("#readout-icon").textContent = p.icon;
    $("#readout-bayer").textContent = `${s.bayer} · ${s.cn}`;
    $("#readout-title").textContent = p.title;
    $("#readout-latin").textContent = `${s.name} · 视星等 ${s.mag}`;
    $("#readout-desc").textContent = p.desc;
    $("#readout-mag").textContent = `mag ${s.mag}`;
    $("#readout-tags").textContent = (p.tags || []).join(" · ");
    const status = $("#readout-status");
    status.textContent = p.live ? "LIVE" : "CLIMB";
    status.className = `readout-status ${p.live ? "is-live" : "is-climb"}`;
    $("#telemetry-mag").textContent = s.mag.toFixed(2);
    $("#telemetry-sig").textContent = p.live ? "LOCKED" : "EVOLVING";
  });

  window.addEventListener("orbithover", (e) => {
    document.body.classList.toggle("orbit-lit", e.detail.lit);
    const sig = $("#telemetry-sig");
    if (!sig || e.detail.lit) return;
    sig.textContent = "STANDBY";
  });

  let scan = 0;
  setInterval(() => {
    scan = (scan + 1) % 10000;
    const el = $("#telemetry-scan");
    if (el) el.textContent = String(scan).padStart(4, "0");
  }, 120);
}

function typeText() {
  const el = $("#typing-text");
  if (!el) return;
  const text = window.SITE.about.vibe;
  let i = 0;
  const timer = setInterval(() => {
    el.textContent = text.slice(0, i);
    i += 1;
    if (i > text.length) clearInterval(timer);
  }, 50);
}

function fillProjectList() {
  const el = $("#project-list");
  if (!el) return;
  el.textContent = projects()
    .map((p) =>
      p.live
        ? `${p.icon} ${p.title}`
        : `${p.icon} ${p.title} · ${window.SITE.about.climbingLabel}`
    )
    .join("  ·  ");
}

function init() {
  Theme.init();
  applyCopy();
  $("#year").textContent = new Date().getFullYear();
  $("#project-count").textContent = projects().filter((p) => p.live).length;
  $("#climbing-count").textContent = projects().filter((p) => !p.live).length;
  initIntro();
  initStarReadout();
  Painting.init();
  requestAnimationFrame(() => window.Painting?.resize?.());
  Detail.init();
  renderShowcase();
  initNav();
  typeText();
  fillProjectList();

  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    Theme.current() === "day" ? "#e4eaf2" : "#07050f"
  );

  window.addEventListener("themechange", (e) => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      e.detail.theme === "day" ? "#e4eaf2" : "#07050f"
    );
  });
}

window.Main = { navigate: navigateWithTransition };
init();
