const PROJECTS = [
  {
    icon: "🐍",
    title: "贪吃蛇",
    desc: "经典贪吃蛇赛博重制。难度、穿墙、音效，手机电脑都能玩。",
    tags: ["游戏", "Canvas"],
    link: "/snake-game/snake/",
    live: true,
    glow: "linear-gradient(135deg, rgba(74,222,128,0.12), transparent)",
  },
  {
    icon: "🐱",
    title: "Idle Companion",
    desc: "空闲时透明动物全屏陪伴，Cat Gatekeeper 风格 Chrome 扩展。",
    tags: ["扩展", "WebM"],
    link: "/snake-game/idle-companion/",
    live: true,
    glow: "linear-gradient(135deg, rgba(255,46,166,0.12), transparent)",
  },
  {
    icon: "🗺️",
    title: "扣门地图",
    desc: "微信小程序 — 分享与发现扣门地点。",
    tags: ["小程序"],
    link: "https://github.com/shuaianchen-glitch/snake-game/tree/main/koumen-map",
    live: true,
    external: true,
    glow: "linear-gradient(135deg, rgba(167,139,250,0.12), transparent)",
  },
  {
    icon: "🤖",
    title: "AI 实验台",
    desc: "AI 与交互结合的实验，即将上线。",
    tags: ["AI"],
    live: false,
    glow: "linear-gradient(135deg, rgba(0,240,255,0.08), transparent)",
  },
  {
    icon: "🛠️",
    title: "效率工具箱",
    desc: "开发效率小工具集合，构建中。",
    tags: ["工具"],
    live: false,
  },
  {
    icon: "🎨",
    title: "视觉实验室",
    desc: "Shader 与生成艺术 playground。",
    tags: ["视觉"],
    live: false,
  },
];

const TYPING_TEXT = "把想法变成可触摸的数字体验。";
const INTRO_KEY = "sa-studio-intro-seen";

const $ = (sel) => document.querySelector(sel);

function liveProjects() {
  return PROJECTS.filter((p) => p.live);
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
  const btn = $("#intro-enter");
  const intro = $("#intro");

  const go = () => enterSite(false);

  if (sessionStorage.getItem(INTRO_KEY) === "1") {
    enterSite(true);
    return;
  }

  btn?.addEventListener("click", go);
  intro?.addEventListener("click", () => {
    if (!intro.classList.contains("is-leaving")) go();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !intro.classList.contains("is-leaving")) go();
  });

  setTimeout(() => {
    if (!intro.classList.contains("is-leaving")) {
      btn?.focus();
    }
  }, 2200);
}

function navigateWithTransition(project, href, external) {
  const overlay = $("#transition");
  $("#transition-icon").textContent = project.icon;
  $("#transition-title").textContent = `正在进入 ${project.title}…`;
  overlay.classList.add("is-active");

  setTimeout(() => {
    if (external) {
      window.open(href, "_blank", "noopener");
      overlay.classList.remove("is-active");
    } else {
      window.location.href = href;
    }
  }, 600);
}

function renderOrbit() {
  const container = $("#orbit-nodes");
  const wrap = $("#orbit-wrap");
  if (!container || !wrap) return;

  const items = PROJECTS;
  const radius = wrap.offsetWidth * 0.38;
  let rotation = 0;
  let dragging = false;
  let lastX = 0;

  container.innerHTML = items
    .map((p, i) => {
      const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2;
      const tx = `${Math.cos(angle) * radius}px`;
      const ty = `${Math.sin(angle) * radius}px`;
      const cls = p.live ? "orbit-node live" : "orbit-node soon";
      const badge = p.live
        ? '<span class="orbit-badge">LIVE</span>'
        : '<span class="orbit-badge soon">SOON</span>';

      if (p.live) {
        return `<button type="button" class="${cls}" data-idx="${i}" style="--tx:${tx};--ty:${ty}">
          <div class="orbit-node-inner">
            ${badge}
            <span class="orbit-icon">${p.icon}</span>
            <span class="orbit-label">${p.title}</span>
          </div>
        </button>`;
      }
      return `<div class="${cls}" style="--tx:${tx};--ty:${ty}">
        <div class="orbit-node-inner">
          ${badge}
          <span class="orbit-icon">${p.icon}</span>
          <span class="orbit-label">${p.title}</span>
        </div>
      </div>`;
    })
    .join("");

  container.querySelectorAll(".orbit-node.live").forEach((el) => {
    el.addEventListener("click", () => {
      const p = PROJECTS[Number(el.dataset.idx)];
      navigateWithTransition(p, p.link, p.external);
    });
  });

  const setRot = (deg) => {
    rotation = deg;
    container.style.setProperty("--orbit-rot", `${rotation}deg`);
  };

  wrap.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    wrap.classList.add("is-dragging");
    wrap.setPointerCapture(e.pointerId);
  });

  wrap.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    setRot(rotation + dx * 0.4);
  });

  wrap.addEventListener("pointerup", () => {
    dragging = false;
    wrap.classList.remove("is-dragging");
  });

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let auto = 0;
    const spin = () => {
      if (!dragging) {
        auto += 0.015;
        setRot(Math.sin(auto) * 8);
      }
      requestAnimationFrame(spin);
    };
    spin();
  }
}

function renderShowcase() {
  const track = $("#showcase-track");
  const dots = $("#showcase-dots");
  if (!track) return;

  track.innerHTML = PROJECTS.map((p) => {
    const cls = p.live ? "showcase-card" : "showcase-card soon";
    const style = p.glow ? `style="--card-glow:${p.glow}"` : "";
    if (p.live) {
      const ext = p.external ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${p.link}" class="${cls}" ${style}${ext}>
        <div class="showcase-card-inner">
          <div class="showcase-icon">${p.icon}</div>
          <h3 class="showcase-title">${p.title}</h3>
          <p class="showcase-desc">${p.desc}</p>
          <span class="showcase-cta">立即体验 →</span>
        </div>
      </a>`;
    }
    return `<div class="${cls}" ${style}>
      <div class="showcase-card-inner">
        <div class="showcase-icon">${p.icon}</div>
        <h3 class="showcase-title">${p.title}</h3>
        <p class="showcase-desc">${p.desc}</p>
        <span class="showcase-cta" style="opacity:0.5">即将上线</span>
      </div>
    </div>`;
  }).join("");

  track.querySelectorAll("a.showcase-card").forEach((el, i) => {
    el.addEventListener("click", (e) => {
      const p = PROJECTS[i];
      if (p.external) return;
      e.preventDefault();
      navigateWithTransition(p, p.link, false);
    });
  });

  if (dots) {
    const count = PROJECTS.length;
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
  let i = 0;
  const timer = setInterval(() => {
    el.textContent = TYPING_TEXT.slice(0, i);
    i++;
    if (i > TYPING_TEXT.length) clearInterval(timer);
  }, 55);
}

function fillProjectList() {
  const el = $("#project-list");
  if (!el) return;
  el.textContent = PROJECTS.map((p) =>
    p.live ? `${p.icon} ${p.title}` : `${p.icon} ${p.title} (soon)`
  ).join("  ·  ");
}

function initCanvas() {
  const canvas = $("#bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, particles;
  const isMobile = window.innerWidth < 768;
  const count = isMobile ? 24 : 50;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.2 + 0.4,
    }));
  }

  function draw() {
    ctx.fillStyle = "rgba(5, 5, 8, 0.2)";
    ctx.fillRect(0, 0, w, h);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();
  window.addEventListener("resize", () => {
    resize();
    createParticles();
  });
}

function init() {
  $("#year").textContent = new Date().getFullYear();
  $("#project-count").textContent = liveProjects().length;
  initIntro();
  renderOrbit();
  renderShowcase();
  initNav();
  typeText();
  fillProjectList();

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    initCanvas();
  }

  window.addEventListener("resize", () => {
    renderOrbit();
  });
}

init();
