window.SITE = {
  intro: {
    eyebrow: "ShuaiAn · Capricornus",
    title: ["在星途上，", "把想法推上山"],
    accentLine: 1,
    sub: "每一次迭代，都是一颗更亮的星",
    btn: "进入星轨",
    skip: "按 Enter 或点击任意处",
  },

  stage: {
    tag: "CAPRICORNUS · 摩羯星轨",
    headline: ["点击星点，", "进入每个世界"],
    desc: "这些星真实存在于摩羯座。已点亮的会回应你的触摸；还在攀登的，仍在闪烁。",
    hint: "悬停读星名 · 点击已点亮之星",
    stats: { live: "已点亮", climbing: "攀登中" },
  },

  showcase: {
    title: "01 · 造物清单",
    desc: "左右滑动浏览；每一样，都是攀山路上的一个脚印",
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

  /** Default theme: fixed Capricorn night (not system preference) */
  defaultTheme: "night",

  /** Capricornus constellation — normalized x/y in orbit box (0–1) */
  hub: {
    bayer: "δ Cap",
    name: "Deneb Algedi",
    cn: "垒壁阵四",
    mag: 2.87,
    dist: "39 光年",
    x: 0.56,
    y: 0.66,
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
      star: {
        bayer: "β Cap",
        name: "Dabih",
        cn: "牛宿二",
        mag: 3.05,
        x: 0.34,
        y: 0.22,
      },
      glow: "linear-gradient(135deg, rgba(74,222,128,0.14), transparent)",
    },
    {
      icon: "🐱",
      title: "Idle Companion",
      desc: "空闲时透明动物全屏陪伴，Cat Gatekeeper 风格 Chrome 扩展。",
      tags: ["扩展", "WebM"],
      link: "/snake-game/idle-companion/",
      live: true,
      star: {
        bayer: "α Cap",
        name: "Algedi",
        cn: "牛宿一",
        mag: 3.58,
        x: 0.2,
        y: 0.38,
        binary: true,
      },
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
      star: {
        bayer: "γ Cap",
        name: "Nashira",
        cn: "垒壁阵一",
        mag: 3.69,
        x: 0.46,
        y: 0.44,
      },
      glow: "linear-gradient(135deg, rgba(167,139,250,0.14), transparent)",
    },
    {
      icon: "🤖",
      title: "AI 实验台",
      desc: "AI 与交互结合的实验，DNA 正在重组。",
      tags: ["AI"],
      live: false,
      star: {
        bayer: "ζ Cap",
        name: "Maraca",
        cn: "垒壁阵七",
        mag: 3.74,
        x: 0.28,
        y: 0.58,
      },
      glow: "linear-gradient(135deg, rgba(0,240,255,0.08), transparent)",
    },
    {
      icon: "🛠️",
      title: "效率工具箱",
      desc: "开发效率小工具集合，仍在攀峰打磨中。",
      tags: ["工具"],
      live: false,
      star: {
        bayer: "θ Cap",
        name: "θ Capricorni",
        cn: "垒壁阵二",
        mag: 4.08,
        x: 0.16,
        y: 0.54,
      },
    },
    {
      icon: "🎨",
      title: "视觉实验室",
      desc: "Shader 与生成艺术 playground，光在酝酿。",
      tags: ["视觉"],
      live: false,
      star: {
        bayer: "ι Cap",
        name: "Armus",
        cn: "垒壁阵三",
        mag: 4.13,
        x: 0.72,
        y: 0.32,
      },
    },
  ],

  /** Decorative constellation vertices (no project) */
  decorStars: [
    { bayer: "ξ Cap", cn: "垒壁阵五", mag: 4.34, x: 0.4, y: 0.18 },
    { bayer: "ν Cap", cn: "垒壁阵六", mag: 4.77, x: 0.64, y: 0.52 },
  ],

  /** IAU standard constellation line segments (indices into allStars array built at runtime) */
  lines: [
    ["beta", "xi"],
    ["xi", "gamma"],
    ["gamma", "delta"],
    ["delta", "iota"],
    ["alpha", "zeta"],
    ["zeta", "theta"],
    ["alpha", "beta"],
    ["gamma", "alpha"],
  ],
};
