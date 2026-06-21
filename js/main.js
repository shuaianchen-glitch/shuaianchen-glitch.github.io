const PROJECTS = [
  {
    icon: "🐍",
    title: "贪吃蛇",
    desc: "经典贪吃蛇的赛博重制版。支持难度选择、穿墙模式、音效，手机和电脑都能玩。",
    tags: ["游戏", "JavaScript", "Canvas"],
    link: "/snake-game/snake/",
    live: true,
  },
  {
    icon: "🐱",
    title: "Idle Companion",
    desc: "浏览器空闲时，透明抠图动物全屏挡在页面上陪你。Cat Gatekeeper 风格，支持猫咪 / 蓝鲸 / 狐狸。",
    tags: ["Chrome 扩展", "WebM Alpha", "MV3"],
    link: "/snake-game/idle-companion/",
    live: true,
  },
  {
    icon: "🗺️",
    title: "扣门地图",
    desc: "微信小程序 — 分享与发现「扣门」地点。",
    tags: ["微信小程序"],
    link: "https://github.com/shuaianchen-glitch/snake-game/tree/main/koumen-map",
    live: true,
    external: true,
  },
  {
    icon: "🤖",
    title: "AI 实验台",
    desc: "探索 AI 与交互结合的实验项目，即将上线。",
    tags: ["AI", "实验"],
    live: false,
  },
  {
    icon: "🛠️",
    title: "效率工具箱",
    desc: "提升日常开发效率的小工具集合，正在构建中。",
    tags: ["工具", "Web"],
    live: false,
  },
  {
    icon: "🎨",
    title: "视觉实验室",
    desc: "Shader、动画与生成艺术的 playground，敬请期待。",
    tags: ["视觉", "Creative Coding"],
    live: false,
  },
];

const TYPING_TEXT = "把想法变成可触摸的数字体验。";

function renderProjects() {
  const grid = document.getElementById("projects-grid");
  const liveCount = PROJECTS.filter((p) => p.live).length;
  document.getElementById("project-count").textContent = liveCount;

  grid.innerHTML = PROJECTS.map((p) => {
    const cls = p.live ? "project-card" : "project-card coming-soon";
    const tagHtml = p.tags
      .map((t) => `<span class="tag${p.live ? " live" : ""}">${t}</span>`)
      .join("");

    if (p.live) {
      const ext = p.external ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${p.link}" class="${cls}"${ext}>
        <div class="project-icon">${p.icon}</div>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.desc}</p>
        <div class="project-tags">${tagHtml}<span class="tag live">LIVE</span></div>
      </a>`;
    }

    return `<div class="${cls}">
      <div class="project-icon">${p.icon}</div>
      <h3 class="project-title">${p.title}</h3>
      <p class="project-desc">${p.desc}</p>
      <div class="project-tags">${tagHtml}<span class="tag">SOON</span></div>
    </div>`;
  }).join("");
}

function typeText() {
  const el = document.getElementById("typing-text");
  let i = 0;
  const timer = setInterval(() => {
    el.textContent = TYPING_TEXT.slice(0, i);
    i++;
    if (i > TYPING_TEXT.length) clearInterval(timer);
  }, 60);
}

function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  let w, h, particles;
  const isMobile = window.innerWidth < 768;
  const count = isMobile ? 30 : 60;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));
  }

  function draw() {
    ctx.fillStyle = "rgba(5, 5, 8, 0.25)";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
    ctx.lineWidth = 1;
    const step = isMobile ? 60 : 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 240, 255, 0.35)";
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

document.getElementById("year").textContent = new Date().getFullYear();
renderProjects();
typeText();

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  initCanvas();
}
