window.FanCarousel = (() => {
  let stage;
  let dots;
  let cards = [];
  let active = 0;
  let dragging = false;
  let dragX = 0;

  function projects() {
    return window.SITE.projects;
  }

  function cardHtml(p, i) {
    const copy = window.SITE.showcase;
    const starLine = `<span class="showcase-star">${(p.tags || []).join(" · ") || p.title}</span>`;
    const cta = p.live ? copy.ctaLive : copy.ctaSoon;
    const inner = `
      ${starLine}
      <div class="showcase-icon">${p.icon}</div>
      <h3 class="showcase-title">${p.title}</h3>
      <p class="showcase-desc">${p.desc}</p>
      <span class="showcase-cta">${cta}</span>`;

    if (p.live) {
      const ext = p.external ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${p.link}" class="fan-card showcase-card" data-i="${i}"${ext}>${inner}</a>`;
    }
    return `<button type="button" class="fan-card showcase-card" data-i="${i}">${inner}</button>`;
  }

  function layout() {
    const n = cards.length;
    if (!n) return;

    cards.forEach((card, i) => {
      let offset = i - active;
      if (offset > n / 2) offset -= n;
      if (offset < -n / 2) offset += n;

      const abs = Math.abs(offset);
      const x = offset * 154;
      const rot = offset * 5.5;
      const scale = Math.max(0.84, 1 - abs * 0.055);
      const lift = abs === 0 ? -20 : abs * 8;
      const opacity = Math.max(0.4, 1 - abs * 0.12);

      card.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${lift}px)) rotate(${rot}deg) scale(${scale})`;
      card.style.opacity = opacity;
      card.style.zIndex = String(100 - abs);
      card.classList.toggle("is-active", offset === 0);
      card.style.pointerEvents = abs <= 2 ? "auto" : "none";
      card.dataset.offset = String(offset);
    });

    dots?.querySelectorAll("button").forEach((d, i) => {
      d.classList.toggle("active", i === active);
    });
  }

  function go(dir) {
    active = (active + dir + cards.length) % cards.length;
    layout();
  }

  function bindCard(card) {
    const i = Number(card.dataset.i);
    card.addEventListener("click", (e) => {
      if (i !== active) {
        e.preventDefault();
        active = i;
        layout();
        return;
      }

      const p = projects()[i];
      if (card.tagName === "A" && p.external) return;
      if (card.tagName === "A") {
        e.preventDefault();
        window.Main?.navigate(p);
      } else {
        window.Painting?.openProject(i);
        document.getElementById("stage")?.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  function bindDrag() {
    if (!stage) return;
    stage.addEventListener("pointerdown", (e) => {
      dragging = true;
      dragX = e.clientX;
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragX;
      if (Math.abs(dx) > 60) {
        go(dx > 0 ? -1 : 1);
        dragX = e.clientX;
      }
    });
    stage.addEventListener("pointerup", () => {
      dragging = false;
    });
  }

  function init() {
    stage = document.getElementById("fan-stage");
    dots = document.getElementById("showcase-dots");
    if (!stage) return;

    stage.innerHTML = projects()
      .map((p, i) => cardHtml(p, i))
      .join("");

    cards = [...stage.querySelectorAll(".fan-card")];
    cards.forEach(bindCard);
    layout();
    bindDrag();

    document.getElementById("fan-prev")?.addEventListener("click", () => go(-1));
    document.getElementById("fan-next")?.addEventListener("click", () => go(1));

    if (dots) {
      dots.innerHTML = projects()
        .map((_, i) => `<button type="button" data-i="${i}" aria-label="第 ${i + 1} 项"${i === 0 ? ' class="active"' : ""}></button>`)
        .join("");
      dots.querySelectorAll("button").forEach((d) => {
        d.addEventListener("click", () => {
          active = Number(d.dataset.i);
          layout();
        });
      });
    }
  }

  return { init, go };
})();
