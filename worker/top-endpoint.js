// Патч для воркера wsmp-passport (src/index.js): метод GET /api/top
// Параметры: by=playtime|balance (по умолчанию playtime), limit=1..50 (по умолчанию 10)
// Ответ: { by, players: [{ uuid, name, playtimeSeconds, playtimeHours, balance, online }] }

// 1) Добавьте функцию рядом с getPassport:
async function getTop(request, env, url, now) {
  await limit(env.DB, "top:" + clientIp(request), RATE.passport, now);
  const by = url.searchParams.get("by") === "balance" ? "balance" : "playtime";
  const n = Math.min(Math.max(parseInt(url.searchParams.get("limit"), 10) || 10, 1), 50);
  const order = by === "balance" ? "balance DESC, playtime_seconds DESC" : "playtime_seconds DESC, balance DESC"; // фиксированный белый список, не ввод пользователя
  const { results } = await env.DB.prepare(
    "SELECT * FROM players WHERE name IS NOT NULL ORDER BY " + order + " LIMIT ?1"
  ).bind(n).all();
  return jsonResponse(
    { by, players: results.map((r) => publicPassport(r, now)) },
    200,
    { "Cache-Control": "public, max-age=60" }
  );
}

// 2) Добавьте маршрут в роутер, рядом с /api/passport:
//   if (m === "GET" && p === "/api/top") return getTop(request, env, url, now);
