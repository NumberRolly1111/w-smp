// Общее поведение интерфейса для всех страниц: появление блоков при прокрутке,
// состояние шапки, закрытие мобильного меню, подсветка раздела в правилах.
// Подключается после layout.js и main.js.
(function () {
  "use strict";
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Цель для ссылки «Перейти к содержимому»
  const main = document.querySelector("main");
  if (main && !main.id) main.id = "main";

  // ---- Появление блоков: [data-reveal] получает .is-in, когда попадает в экран ----
  const items = [...document.querySelectorAll("[data-reveal]")];
  if (items.length && "IntersectionObserver" in window && !reduce) {
    document.documentElement.classList.add("reveal-on");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  // ---- Шапка: подсветка границы, когда страница прокручена ----
  const wrap = document.querySelector(".island-wrap");
  if (wrap) {
    let ticking = false;
    const paint = () => { wrap.classList.toggle("is-scrolled", window.scrollY > 8); ticking = false; };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }

  // ---- Мобильное меню: закрываем по Escape, клику вне меню, выбору пункта и при расширении окна ----
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    const close = (focusToggle) => {
      if (!nav.classList.contains("open")) return;
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      if (focusToggle) toggle.focus();
    };
    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("open")) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      close(false);
    });
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) close(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(true); });
    window.addEventListener("resize", () => { if (window.innerWidth > 900) close(false); });
  }

  // ---- Правила: подсвечиваем в верхнем меню раздел, который сейчас на экране ----
  const links = [...document.querySelectorAll(".rules-nav a[href^='#']")];
  if (links.length && "IntersectionObserver" in window) {
    const byId = new Map();
    links.forEach((a) => {
      const sec = document.getElementById(a.getAttribute("href").slice(1));
      if (sec) byId.set(sec, a);
    });
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
        const a = byId.get(e.target);
        if (a) { a.classList.add("is-active"); a.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-20% 0px -65% 0px" });
    byId.forEach((_, sec) => spy.observe(sec));
  }
})();
