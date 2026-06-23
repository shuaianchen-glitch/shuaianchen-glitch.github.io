window.CascadeNav = (() => {
  function wrapChars(el) {
    if (el.dataset.cascadeReady) return;
    const text = el.textContent.trim();
    el.innerHTML = [...text]
      .map((ch, i) => {
        const c = ch === " " ? "\u00a0" : ch;
        return `<span class="cascade-char" style="--ci:${i}">${c}</span>`;
      })
      .join("");
    el.dataset.cascadeReady = "1";
  }

  function replay(el) {
    el.classList.remove("is-cascading");
    void el.offsetWidth;
    el.classList.add("is-cascading");
  }

  function init() {
    const pills = document.querySelectorAll(".pill[data-scroll]");
    pills.forEach((pill) => {
      wrapChars(pill);
      pill.addEventListener("mouseenter", () => replay(pill));
      if (pill.classList.contains("active")) replay(pill);
    });

    document.querySelectorAll(".pill[data-scroll]").forEach((p) => {
      if (p.classList.contains("active")) replay(p);
    });
  }

  return { init, replay };
})();
