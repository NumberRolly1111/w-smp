// Главная: живой статус сервера в первом экране (онлайн, слоты, версия).
// Данные берутся из того же сервиса, что и на странице мониторинга. Если сервис не ответил,
// показываем честное «нет данных», а не выдуманные цифры.
(function () {
  "use strict";
  const HOST = "mc.w-smp.in";
  const API = "https://api.mcsrvstat.us/3/" + HOST;
  const EVERY = 60000;     // сервис кеширует ответ около минуты, чаще спрашивать нет смысла
  const TIMEOUT = 7000;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const pill = document.querySelector("[data-live-pill]");
  if (!pill) return;
  const q = (s) => document.querySelector(s);
  const el = {
    text: q("[data-live-text]"), online: q("[data-live-online]"), max: q("[data-live-max]"), version: q("[data-live-version]"),
  };
  const safeInt = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };
  const fmt = (n) => n.toLocaleString("ru-RU");
  const plural = (n) => (n % 10 === 1 && n % 100 !== 11) ? "игрок" : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "игрока" : "игроков";

  // Плавный подсчёт до нужного числа
  let shown = 0;
  function countTo(node, to) {
    if (!node) return;
    if (reduce || to === shown) { node.textContent = fmt(to); shown = to; return; }
    const from = shown, t0 = performance.now(), dur = 700;
    shown = to;
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - k, 3);
      node.textContent = fmt(Math.round(from + (to - from) * eased));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  function paint(state, data) {
    pill.dataset.state = state;
    if (state === "online") {
      const online = safeInt(data.players && data.players.online);
      const max = safeInt(data.players && data.players.max);
      el.text.textContent = "Сервер онлайн · " + fmt(online) + " " + plural(online);
      countTo(el.online, online);
      if (el.max) el.max.textContent = max ? "из " + fmt(max) : "";
      const v = data.version ? String(data.version).replace(/^[^\d]*/, "") || String(data.version) : "";
      if (el.version) el.version.textContent = v || "—";
    } else if (state === "offline") {
      el.text.textContent = "Сервер сейчас офлайн";
      if (el.online) el.online.textContent = "0";
      if (el.max) el.max.textContent = "";
      if (el.version) el.version.textContent = "—";
    } else {
      el.text.textContent = "Статус сервера недоступен";
      if (el.online) el.online.textContent = "—";
      if (el.max) el.max.textContent = "";
      if (el.version) el.version.textContent = "—";
    }
  }

  let busy = false;
  async function load() {
    if (busy) return;
    busy = true;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const res = await fetch(API, { signal: ctrl.signal });
      if (!res.ok) throw new Error("http " + res.status);
      const data = await res.json();
      paint(data && data.online ? "online" : "offline", data || {});
    } catch (e) {
      paint("unknown", {});
    } finally {
      clearTimeout(timer);
      busy = false;
    }
  }

  load();
  setInterval(() => { if (!document.hidden) load(); }, EVERY);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
})();
