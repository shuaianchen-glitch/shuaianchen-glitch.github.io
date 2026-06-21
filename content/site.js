window.SITE = {
  intro: {
    eyebrow: "ShuaiAn · Capricornus",
    title: ["在星途上，", "把想法推上山"],
    accentLine: 1,
    sub: "宇宙沉默，但每一次攀登都有回响",
    btn: "进入星轨",
    skip: "按 Enter 或点击任意处",
  },

  stage: {
    tag: "CAPRICORNUS · 摩羯星轨",
    headline: ["星辰不语，", "却回答每一次攀登"],
    headlineAccent: 1,
    desc: "背景是深空银河，前景是 IAU 摩羯星图投影——项目即星，星轨即导航。悬停点亮连线，点击已亮之星。",
    quote: "推石上山不是惩罚，是把重复雕成形状。",
    hint: "悬停星名 · 点击星点进入项目",
    stats: { live: "已点亮", climbing: "攀登中" },
  },

  capricorn: {
    hint: "点击摩羯 · 它会回应你",
    moods: [
      { face: "curious", text: "嗯？又有什么想推上山顶？" },
      { face: "happy", text: "继续攀吧，星星在等你。" },
      { face: "wink", text: "；） 温柔一点，也要酷一点。" },
      { face: "think", text: "山海之间，最熟悉的路是再来一次。" },
      { face: "climb", text: "♑ 海山羊从不靠岸，只向上。" },
    ],
  },

  showcase: {
    title: "01 · 造物清单",
    desc: "左右滑动 —— 每一样，都是攀山路上的脚印",
    ctaLive: "立即体验 →",
    ctaSoon: "持续进化 🧬",
  },

  about: {
    manifesto: "重复不是惩罚，是雕刻。",
    vibe: "温柔地攀岩，酷一点地创造。",
    climbingLabel: "攀登中",
  },

  transition: {
    entering: (name) => `正在进入 ${name}…`,
    whispers: ["再推一次。", "星轨已对齐。", "温柔地，继续攀登。"],
  },

  soon: {
    title: "持续进化 🧬",
    message: "尽情期待",
  },

  defaultTheme: "night",

  chart: {
    insetTop: 0.1,
    insetRight: 0.06,
    insetBottom: 0.12,
    insetLeft: 0.06,
  },

  hub: {
    bayer: "δ Cap",
    name: "Deneb Algedi",
    cn: "垒壁阵四",
    mag: 2.87,
    dist: "39 光年",
    x: 0.58,
    y: 0.58,
    note: "摩羯座最亮星 · 海山羊之心",
  },

  projects: [
    {
      icon: "🐍",
      title: "贪吃蛇",
      desc: "经典贪吃蛇赛博重制。难度、穿墙、音效，手机电脑都能玩。",
      tags: ["游戏", "Canvas"],
      link: "/snake-game/snake/",
      live: true,
      star: { bayer: "β Cap", name: "Dabih", cn: "牛宿二", mag: 3.05, x: 0.35, y: 0.25 },
      glow: "linear-gradient(135deg, rgba(74,222,128,0.14), transparent)",
    },
    {
      icon: "🐱",
      title: "Idle Companion",
      desc: "空闲时透明动物全屏陪伴，Cat Gatekeeper 风格 Chrome 扩展。",
      tags: ["扩展", "WebM"],
      link: "/snake-game/idle-companion/",
      live: true,
      star: { bayer: "α Cap", name: "Algedi", cn: "牛宿一", mag: 3.58, x: 0.28, y: 0.38, binary: true },
      glow: "linear-gradient(135deg, rgba(255,46,166,0.14), transparent)",
    },
    {
      icon: "🗺️",
      title: "扣门地图",
      desc: "微信小程序 — 分享与发现扣门地点。",
      tags: ["小程序"],
      link: "https://github.com/shuaianchen-glitch/snake-game/tree/main/koumen-map",
      live: true,
      external: true,
      star: { bayer: "γ Cap", name: "Nashira", cn: "垒壁阵一", mag: 3.69, x: 0.58, y: 0.28 },
      glow: "linear-gradient(135deg, rgba(167,139,250,0.14), transparent)",
    },
    {
      icon: "🤖",
      title: "AI 实验台",
      desc: "AI 与交互结合的实验，DNA 正在重组。",
      tags: ["AI"],
      live: false,
      star: { bayer: "ζ Cap", name: "Maraca", cn: "垒壁阵七", mag: 3.74, x: 0.38, y: 0.48 },
      glow: "linear-gradient(135deg, rgba(0,240,255,0.08), transparent)",
    },
    {
      icon: "🛠️",
      title: "效率工具箱",
      desc: "开发效率小工具集合，仍在攀峰打磨中。",
      tags: ["工具"],
      live: false,
      star: { bayer: "θ Cap", name: "θ Capricorni", cn: "垒壁阵二", mag: 4.08, x: 0.22, y: 0.55 },
    },
    {
      icon: "🎨",
      title: "视觉实验室",
      desc: "Shader 与生成艺术 playground，光在酝酿。",
      tags: ["视觉"],
      live: false,
      star: { bayer: "ι Cap", name: "Armus", cn: "垒壁阵三", mag: 4.13, x: 0.82, y: 0.42 },
    },
  ],

  decorStars: [
    { bayer: "ξ Cap", cn: "垒壁阵五", mag: 4.34, x: 0.48, y: 0.18 },
    { bayer: "ν Cap", cn: "垒壁阵六", mag: 4.77, x: 0.65, y: 0.68 },
  ],

  lines: [
    ["beta", "xi"], ["xi", "gamma"], ["gamma", "delta"], ["delta", "iota"],
    ["alpha", "zeta"], ["zeta", "theta"], ["alpha", "beta"], ["gamma", "alpha"],
  ],
};
