window.Typewriter = (() => {
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function typeInto(el, text, speed = 42) {
    if (!el) return;
    el.textContent = "";
    for (let i = 0; i < text.length; i += 1) {
      el.textContent += text[i];
      await wait(speed + Math.random() * 30);
    }
  }

  async function run(config) {
    const line1 = document.getElementById(config.line1Id || "type-line-1");
    const line2 = document.getElementById(config.line2Id || "type-line-2");
    const desc = document.getElementById(config.descId || "stage-desc");
    const cursor = document.getElementById(config.cursorId || "type-cursor");

    if (!line1 || !config.lines?.length) return;

    await wait(config.delay ?? 400);
    await typeInto(line1, config.lines[0], config.speed ?? 42);

    if (line2 && config.lines[1]) {
      await wait(180);
      await typeInto(line2, config.lines[1], config.speed ?? 42);
    }

    if (desc && config.desc) {
      await wait(320);
      await typeInto(desc, config.desc, config.descSpeed ?? 26);
      if (cursor) cursor.classList.add("on-desc");
    }

    if (cursor) cursor.classList.add("is-active");
  }

  return { run };
})();
