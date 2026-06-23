window.SITE = {
  field: {
    label: "Cognitive Field Interface",
    identity: {
      name: "陈帅安",
      nameEn: "ShuaiAn Chen",
      role: "Frontend · Interaction · Generative Systems",
      philosophy: "重复不是惩罚，是雕刻。",
    },
    hints: {
      scroll: "Scroll · traverse depth",
      probe: "Move · probe the field",
      focus: "Click · enter sub-field",
    },
  },

  skills: [
    { id: "ts", label: "TypeScript", cluster: "build", weight: 0.72, importance: 0.88, relevance: 0.92, orbit: 3.4, theta: 0.4, phi: 1.1 },
    { id: "react", label: "React", cluster: "build", weight: 0.68, importance: 0.82, relevance: 0.88, orbit: 3.6, theta: 0.9, phi: 0.8 },
    { id: "canvas", label: "Canvas / WebGL", cluster: "visual", weight: 0.85, importance: 0.95, relevance: 0.96, orbit: 4.2, theta: 1.6, phi: 1.3 },
    { id: "motion", label: "Motion Systems", cluster: "visual", weight: 0.78, importance: 0.9, relevance: 0.94, orbit: 4.0, theta: 2.1, phi: 0.9 },
    { id: "shader", label: "Shaders", cluster: "visual", weight: 0.62, importance: 0.74, relevance: 0.78, orbit: 4.5, theta: 2.6, phi: 1.5 },
    { id: "node", label: "Node.js", cluster: "build", weight: 0.58, importance: 0.7, relevance: 0.75, orbit: 3.8, theta: 3.2, phi: 1.0 },
    { id: "ai", label: "AI Integration", cluster: "research", weight: 0.7, importance: 0.8, relevance: 0.85, orbit: 4.8, theta: 4.0, phi: 1.2 },
    { id: "ux", label: "Interaction Design", cluster: "research", weight: 0.75, importance: 0.86, relevance: 0.9, orbit: 4.3, theta: 4.6, phi: 0.7 },
  ],

  experience: [
    { id: "exp-indie", label: "独立项目", period: "2024 —", detail: "小游戏、扩展、生成视觉与交互实验。", weight: 0.88, importance: 0.92, relevance: 0.95, depth: 0.35, theta: 5.2, phi: 1.4 },
    { id: "exp-fe", label: "前端工程", period: "持续", detail: "组件系统、性能、可访问性与动效编排。", weight: 0.82, importance: 0.88, relevance: 0.9, depth: 0.55, theta: 5.8, phi: 0.9 },
    { id: "exp-climb", label: "攀岩", period: "业余", detail: "身体与路线的重复训练 — 与代码同构的耐心。", weight: 0.55, importance: 0.65, relevance: 0.6, depth: 0.75, theta: 0.2, phi: 2.0 },
  ],

  notes: [
    { id: "n1", text: "慢即是快", weight: 0.28, importance: 0.45, relevance: 0.5, orbit: 5.5, theta: 1.2, phi: 2.2 },
    { id: "n2", text: "场先于界面", weight: 0.32, importance: 0.5, relevance: 0.55, orbit: 5.8, theta: 3.5, phi: 2.4 },
    { id: "n3", text: "光即权重", weight: 0.26, importance: 0.42, relevance: 0.48, orbit: 6.0, theta: 5.0, phi: 1.8 },
    { id: "n4", text: "距离即关系", weight: 0.3, importance: 0.48, relevance: 0.52, orbit: 5.6, theta: 6.2, phi: 2.1 },
  ],

  transition: {
    entering: (name) => `Opening ${name}…`,
    whispers: ["Continue.", "Settle.", "Return when ready."],
  },

  soon: {
    title: "In progress",
    message: "Still forming — check back soon.",
  },

  projects: [
    {
      icon: "Snake",
      title: "贪吃蛇",
      desc: "Classic snake rebuilt — difficulty tiers, wall modes, audio, mobile + desktop.",
      tags: ["Game", "Canvas"],
      link: "/snake-game/snake/",
      live: true,
      field: { orbit: 5.0, theta: 0.65, phi: 1.05, weight: 0.92, importance: 0.96, relevance: 1.0 },
    },
    {
      icon: "Companion",
      title: "Idle Companion",
      desc: "Transparent idle animals as a Chrome extension — quiet presence while you work.",
      tags: ["Extension", "WebM"],
      link: "/snake-game/idle-companion/",
      live: true,
      field: { orbit: 5.4, theta: 1.35, phi: 0.85, weight: 0.88, importance: 0.92, relevance: 0.94 },
    },
    {
      icon: "Map",
      title: "扣门地图",
      desc: "WeChat mini program for discovering and sharing climbing crags.",
      tags: ["Mini Program"],
      link: "https://github.com/shuaianchen-glitch/snake-game/tree/main/koumen-map",
      live: true,
      external: true,
      field: { orbit: 5.2, theta: 2.05, phi: 1.25, weight: 0.8, importance: 0.86, relevance: 0.88 },
    },
    {
      icon: "AI Lab",
      title: "AI 实验台",
      desc: "Experiments at the intersection of AI and interaction — still recomposing.",
      tags: ["AI"],
      live: false,
      field: { orbit: 6.2, theta: 3.1, phi: 1.15, weight: 0.65, importance: 0.72, relevance: 0.7 },
    },
    {
      icon: "Tools",
      title: "效率工具箱",
      desc: "Small dev utilities collected into one quiet toolkit.",
      tags: ["Tools"],
      live: false,
      field: { orbit: 6.4, theta: 4.2, phi: 0.95, weight: 0.58, importance: 0.68, relevance: 0.65 },
    },
    {
      icon: "Visual",
      title: "视觉实验室",
      desc: "Shader and generative art playground — light under construction.",
      tags: ["Visual"],
      live: false,
      field: { orbit: 6.6, theta: 5.4, phi: 1.35, weight: 0.62, importance: 0.75, relevance: 0.68 },
    },
  ],
};
