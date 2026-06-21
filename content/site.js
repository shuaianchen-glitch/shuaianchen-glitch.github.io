window.SITE = {
  intro: {
    eyebrow: "ShuaiAn · Capricornus",
    title: ["在星途上，", "把想法推上山"],
    accentLine: 1,
    sub: "一幅星图，六次触碰，无限可能",
    btn: "展开星图",
    skip: "按 Enter 或点击任意处",
  },

  stage: {
    tag: "CAPRICORNUS · 摩羯星图",
    headline: ["点一颗星，", "读一段旅程"],
    desc: "项目钉在 IAU 摩羯连线上——背景是深空，星轨是导航。悬停读星历，点击展开造物细节。",
    quote: "推石上山不是惩罚，是把重复雕成形状。",
    hint: "悬停读星历 · 点击展开细节",
    stats: { live: "已点亮", climbing: "攀登中" },
  },

  showcase: {
    title: "01 · 造物清单",
    desc: "每一样，都是攀山路上的一个脚印",
    ctaLive: "进入星轨 →",
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
    message: "尽情期待 · DNA 正在重组",
  },

  defaultTheme: "night",

  hub: {
    bayer: "δ Cap",
    name: "Deneb Algedi",
    cn: "垒壁阵四",
    mag: 2.87,
    dist: "39 光年",
    x: 0.58,
    y: 0.56,
    note: "海山羊之心 · 摩羯座最亮星",
  },

  projects: [
    {
      icon: "🐍",
      title: "贪吃蛇",
      desc: "经典贪吃蛇赛博重制。难度、穿墙、音效，手机电脑都能玩。",
      tags: ["游戏", "Canvas"],
      link: "/snake-game/snake/",
      live: true,
      star: { bayer: "β Cap", name: "Dabih", cn: "牛宿二", mag: 3.05, x: 0.35, y: 0.24 },
      hue: 145,
    },
    {
      icon: "🐱",
      title: "Idle Companion",
      desc: "空闲时透明动物全屏陪伴，Cat Gatekeeper 风格 Chrome 扩展。",
      tags: ["扩展", "WebM"],
      link: "/snake-game/idle-companion/",
      live: true,
      star: { bayer: "α Cap", name: "Algedi", cn: "牛宿一", mag: 3.58, x: 0.28, y: 0.38 },
      hue: 310,
    },
    {
      icon: "🗺️",
      title: "扣门地图",
      desc: "微信小程序 — 分享与发现扣门地点。",
      tags: ["小程序"],
      link: "https://github.com/shuaianchen-glitch/snake-game/tree/main/koumen-map",
      live: true,
      external: true,
      star: { bayer: "γ Cap", name: "Nashira", cn: "垒壁阵一", mag: 3.69, x: 0.58, y: 0.27 },
      hue: 265,
    },
    {
      icon: "🤖",
      title: "AI 实验台",
      desc: "AI 与交互结合的实验，DNA 正在重组。",
      tags: ["AI"],
      live: false,
      star: { bayer: "ζ Cap", name: "Maraca", cn: "垒壁阵七", mag: 3.74, x: 0.38, y: 0.47 },
      hue: 190,
    },
    {
      icon: "🛠️",
      title: "效率工具箱",
      desc: "开发效率小工具集合，仍在攀峰打磨中。",
      tags: ["工具"],
      live: false,
      star: { bayer: "θ Cap", name: "θ Capricorni", cn: "垒壁阵二", mag: 4.08, x: 0.22, y: 0.54 },
      hue: 210,
    },
    {
      icon: "🎨",
      title: "视觉实验室",
      desc: "Shader 与生成艺术 playground，光在酝酿。",
      tags: ["视觉"],
      live: false,
      star: { bayer: "ι Cap", name: "Armus", cn: "垒壁阵三", mag: 4.13, x: 0.82, y: 0.41 },
      hue: 280,
    },
  ],

  decorStars: [
    { bayer: "ξ Cap", cn: "垒壁阵五", mag: 4.34, x: 0.48, y: 0.17 },
    { bayer: "ν Cap", cn: "垒壁阵六", mag: 4.77, x: 0.65, y: 0.66 },
  ],

  lines: [
    ["beta", "xi"], ["xi", "gamma"], ["gamma", "delta"], ["delta", "iota"],
    ["alpha", "zeta"], ["zeta", "theta"], ["alpha", "beta"], ["gamma", "alpha"],
  ],
};
