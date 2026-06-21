const INTRO_KEY = "sa-studio-intro-seen";
const $ = (sel) => document.querySelector(sel);

function projects() {
  return window.SITE.projects;
}

function liveProjects() {
  return projects().filter((p) => p.live);
}

function climbingProjects() {
  return projects().filter((p) => !p.live);
}

function enterSite(skipIntro = false) {
  const intro = $("#intro");
  const app = $("#app");
  if (!skipIntro && intro) {
    intro.classList.add("is-leaving");
    setTimeout(() => {
      intro.style.display = "none";
      app.classList.remove("is-hidden");
      app.classList.add("is-visible");
    }, 700);
  } else {
    if (intro) intro.style.display = "none";
    app.classList.remove("is-hidden");
    app.classList.add("is-visible");
  }
  sessionStorage.setItem(INTRO_KEY, "1");
}

function initIntro() {
  const intro = $("#intro");
  const go = () => enterSite(false);

  if (sessionStorage.getItem(INTRO_KEY) === "1") {
    enterSite(true);
    return;
  }

  $("#intro-enter")?.addEventListener("click", go);
  intro?.addEventListener("click", () => {
    if (!intro.classList.contains("is-leaving")) go();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !intro.classList.contains("is-leaving")) go();
  });
}

function randomWhisper() {
  const list = window.SITE.transition.whispers;
  return list[Math.floor(Math.random() * list.length)];
}

function navigateWithTransition(project, href, external) {
  const overlay = $("#transition");
  $("#transition-icon").textContent = project.icon;
  $("#transition-title").textContent = window.SITE.transition.entering(project.title);
  $("#transition-whisper").textContent = randomWhisper();
  overlay.classList.add("is-active");

  setTimeout(() => {
    if (external) {
      window.open(href, "_blank", "noopener");
      overlay.classList.remove("is-active");
    } else {
      window.location.href = href;
    }
  }, 650);
}

let toastTimer;
function showSoonToast(project) {
  const toast = $("#toast");
  const soon = window.SITE.soon;
  $("#toast-icon").textContent = project.icon;
  $("#toast-title").textContent = soon.title;
  $("#toast-msg").textContent = `${project.title} · ${soon.message}`;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function renderShowcase() {
  const track = $("#showcase-track");
  const dots = $("#showcase-dots");
  const copy = window.SITE.showcase;
  if (!track) return;

  track.innerHTML = projects()
    .map((p) => {
      const cls = p.live ? "showcase-card" : "showcase-card evolving";
      const style = p.glow ? `style="--card-glow:${p.glow}"` : "";
      const starLine = `<span class="showcase-star">${p.star.bayer} · ${p.star.cn}</span>`;
      const cta = p.live ? copy.ctaLive : copy.ctaSoon;
      const tag = p.live ? "" : ' data-soon="1"';

      if (p.live) {
        const ext = p.external ? ' target="_blank" rel="noopener"' : "";
        return `<a href="${p.link}" class="${cls}" ${style}${ext}${tag}>
          <div class="showcase-card-inner">
            ${starLine}
            <div class="showcase-icon">${p.icon}</div>
            <h3 class="showcase-title">${p.title}</h3>
            <p class="showcase-desc">${p.desc}</p>
            <span class="showcase-cta">${cta}</span>
          </div>
        </a>`;
      }

      return `<button type="button" class="${cls}" ${style}${tag}>
        <div class="showcase-card-inner">
          ${starLine}
          <div class="showcase-icon">${p.icon}</div>
          <h3 class="showcase-title">${p.title}</h3>
          <p class="showcase-desc">${p.desc}</p>
          <span class="showcase-cta">${cta}</span>
        </div>
      </button>`;
    })
    .join("");

  track.querySelectorAll("a.showcase-card").forEach((el, i) => {
    el.addEventListener("click", (e) => {
      const p = projects()[i];
      if (p.external) return;
      e.preventDefault();
      navigateWithTransition(p, p.link, false);
    });
  });

  track.querySelectorAll("button.showcase-card").forEach((el, i) => {
    el.addEventListener("click", () => {
      const p = projects()[i];
      showSoonToast(p);
    });
  });

  if (dots) {
    const count = projects().length;
    dots.innerHTML = Array.from({ length: count }, (_, i) =>
      `<span data-i="${i}"${i === 0 ? ' class="active"' : ""}></span>`
    ).join("");

    track.addEventListener("scroll", () => {
      const w = track.querySelector(".showcase-card")?.offsetWidth || 300;
      const idx = Math.round(track.scrollLeft / (w + 20));
      dots.querySelectorAll("span").forEach((d, j) => {
        d.classList.toggle("active", j === idx);
      });
    });
  }
}

function initNav() {
  document.querySelectorAll("[data-scroll]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const id = el.dataset.scroll;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      document.querySelectorAll(".pill[data-scroll]").forEach((p) => {
        p.classList.toggle("active", p.dataset.scroll === id);
      });
    });
  });
}

function typeText() {
  const el = $("#typing-text");
  if (!el) return;
  const text = window.SITE.about.vibe;
  let i = 0;
  const timer = setInterval(() => {
    el.textContent = text.slice(0, i);
    i++;
    if (i > text.length) clearInterval(timer);
  }, 55);
}

function fillProjectList() {
  const el = $("#project-list");
  if (!el) return;
  el.textContent = projects()
    .map((p) =>
      p.live
        ? `${p.icon} ${p.title} [${p.star.bayer}]`
        : `${p.icon} ${p.title} [${p.star.bayer}] · ${window.SITE.about.climbingLabel}`
    )
    .join("  ·  ");
}

function applyCopy() {
  const s = window.SITE.stage;
  $("#stage-tag").textContent = s.tag;
  $("#stage-headline").innerHTML = `${s.headline[0]}<br><span class="gradient-text">${s.headline[1]}</span>`;
  $("#stage-desc").textContent = s.desc;
  $("#stage-quote").textContent = s.quote;
  $("#stage-hint").innerHTML = `<span class="pulse-dot"></span> ${s.hint}`;
  $("#stat-live-label").textContent = s.stats.live;
  $("#stat-climb-label").textContent = s.stats.climbing;
}

function init() {
  Theme.init();
  applyCopy();
  $("#year").textContent = new Date().getFullYear();
  $("#project-count").textContent = liveProjects().length;
  $("#climbing-count").textContent = climbingProjects().length;

  initIntro();
  Starfield.init();
  Constellation.init(
    (p) => navigateWithTransition(p, p.link, p.external),
    (p) => showSoonToast(p)
  );
  Capricorn3D.init();
  Capricorn3D.setVisible(Theme.current() === "day");

  renderShowcase();
  initNav();
  typeText();
  fillProjectList();

  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    Theme.current() === "day" ? "#c8d4e0" : "#010308"
  );
  window.addEventListener("themechange", (e) => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      e.detail.theme === "day" ? "#c8d4e0" : "#010308"
    );
    const hint = window.SITE.stage.hint;
    const capHint = window.SITE.capricorn?.hint;
    $("#stage-hint").innerHTML =
      e.detail.theme === "day" && capHint
        ? `<span class="pulse-dot"></span> ${capHint} · ${hint}`
        : `<span class="pulse-dot"></span> ${hint}`;
    Capricorn3D.setVisible(e.detail.theme === "day");
    if (window.Starfield?.resize) Starfield.resize();
  });
}

init();
