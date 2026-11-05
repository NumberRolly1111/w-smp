// Топ игроков по времени в игре и балансу. Данные берутся из API паспорта (GET /api/top).
// Если метод ещё не опубликован на сервере (404), блок остаётся скрытым.
(function () {
  "use strict";
  const sec = document.getElementById("pp-top");
  if (!sec) return;
  const API = String(window.WSMP_PASSPORT_API || "").replace(/\/+$/, "");
  if (!API) return;

  const list = document.getElementById("pp-top-list");
  const msg = document.getElementById("pp-top-msg");
  const tabs = Array.from(sec.querySelectorAll("[data-by]"));
  const CURRENCY = "Монет";
  const fmt = (n, d) => Number(n).toLocaleString("ru-RU", { maximumFractionDigits: d });
  const cache = {};
  let run = 0;

  function row(p, i, by) {
    const a = document.createElement("a");
    a.className = "top-row" + (i < 3 ? " top-" + (i + 1) : "");
    a.href = "?nick=" + encodeURIComponent(p.name);
    const rank = document.createElement("span"); rank.className = "top-rank"; rank.textContent = i + 1;
    const img = document.createElement("img");
    img.className = "top-head"; img.width = 32; img.height = 32; img.loading = "lazy"; img.alt = "";
    const heads = [
      "https://mc-heads.net/avatar/" + encodeURIComponent(p.name) + "/64",
      "https://minotar.net/helm/" + encodeURIComponent(p.name) + "/64.png",
    ];
    let h = 0;
    img.onerror = () => { h += 1; if (h < heads.length) img.src = heads[h]; else { img.onerror = null; img.style.visibility = "hidden"; } };
    img.src = heads[0];
    const name = document.createElement("span"); name.className = "top-name"; name.textContent = p.name;
    if (p.online) { const dot = document.createElement("i"); dot.className = "top-on"; dot.title = "Сейчас в игре"; name.appendChild(dot); }
    const main = document.createElement("b"); main.className = "top-val";
    const sub = document.createElement("small"); sub.className = "top-sub";
    if (by === "balance") { main.textContent = fmt(p.balance, 2) + " " + CURRENCY; sub.textContent = fmt(p.playtimeHours, 1) + " ч"; }
    else { main.textContent = fmt(p.playtimeHours, 1) + " ч"; sub.textContent = fmt(p.balance, 2) + " " + CURRENCY; }
    const nums = document.createElement("span"); nums.className = "top-nums"; nums.append(main, sub);
    a.append(rank, img, name, nums);
    return a;
  }

  function render(players, by) {
    list.replaceChildren(...players.map((p, i) => row(p, i, by)));
    msg.hidden = players.length > 0;
    if (!players.length) msg.textContent = "Пока нет данных.";
  }

  async function load(by) {
    const my = ++run;
    tabs.forEach((t) => { const on = t.dataset.by === by; t.setAttribute("aria-selected", on); t.classList.toggle("on", on); });
    if (cache[by]) { render(cache[by], by); return; }
    list.setAttribute("aria-busy", "true");
    try {
      const res = await fetch(API + "/api/top?by=" + by + "&limit=10");
      if (my !== run) return;
      if (res.status === 404) { sec.hidden = true; return; }   // метод ещё не опубликован
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      cache[by] = Array.isArray(data.players) ? data.players : [];
      sec.hidden = false;
      render(cache[by], by);
    } catch {
      if (my !== run) return;
      sec.hidden = false; list.replaceChildren();
      msg.hidden = false; msg.textContent = "Не удалось загрузить топ. Попробуйте позже.";
    } finally { list.removeAttribute("aria-busy"); }
  }

  tabs.forEach((t) => t.addEventListener("click", () => load(t.dataset.by)));
  load("playtime");
})();
