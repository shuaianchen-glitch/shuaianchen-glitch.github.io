window.Theme = (() => {
  const KEY = "sa-capricorn-theme";
  const root = document.documentElement;

  function getDefault() {
    return window.SITE?.defaultTheme || "night";
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
    root.style.colorScheme = theme === "day" ? "light" : "dark";

    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute("aria-label", theme === "day" ? "切换至星夜模式" : "切换至白昼模式");
      btn.innerHTML =
        theme === "day"
          ? `<span class="theme-icon" aria-hidden="true">🌙</span><span class="theme-label">星夜</span>`
          : `<span class="theme-icon" aria-hidden="true">☀️</span><span class="theme-label">白昼</span>`;
    }

    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }

  function init() {
    const saved = localStorage.getItem(KEY);
    apply(saved === "day" || saved === "night" ? saved : getDefault());

    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "day" ? "night" : "day";
      apply(next);
    });
  }

  function current() {
    return root.getAttribute("data-theme") || getDefault();
  }

  return { init, apply, current };
})();
