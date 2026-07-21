/**
 * Proxy to api.telegram.org for hosts that cannot reach Telegram directly
 * (e.g. some Yandex Cloud networks).
 *
 * Usage from bot:
 *   TELEGRAM_API=https://azimut-medline-site.vercel.app/api/tg-proxy/bot
 *   TG_PROXY_SECRET=...
 *
 * Request: POST /api/tg-proxy/bot{TOKEN}/{method}
 * Header:  X-Azimut-Tg-Proxy: {TG_PROXY_SECRET}
 * Body:    JSON (Telegram method params) or multipart (sendPhoto)
 */

const TG_PROXY_SECRET = process.env.TG_PROXY_SECRET || "azimut-tg-proxy-2026";
const UPSTREAM = "https://api.telegram.org";

function unauthorized(res) {
  res.statusCode = 401;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: false, description: "unauthorized proxy" }));
}

function badRequest(res, msg) {
  res.statusCode = 400;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: false, description: msg }));
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const secret = req.headers["x-azimut-tg-proxy"] || "";
  if (secret !== TG_PROXY_SECRET) {
    unauthorized(res);
    return;
  }

  // /api/tg-proxy/botTOKEN/getUpdates  → rest=botTOKEN/getUpdates (via rewrite)
  const url = new URL(req.url, "http://localhost");
  let rest = url.searchParams.get("rest") || "";
  if (!rest) {
    const marker = "/api/tg-proxy/";
    if (url.pathname.startsWith(marker)) rest = url.pathname.slice(marker.length);
  }
  // drop nested query leftovers
  rest = rest.split("?")[0].replace(/^\/+/, "");

  // Expect bot{digits}:{token}/{method}
  if (!rest || !/^bot\d{6,15}:[A-Za-z0-9_-]{20,}\/[A-Za-z0-9_]+$/.test(rest)) {
    badRequest(res, "invalid telegram path");
    return;
  }

  // Preserve only Telegram-relevant query (none for POST); strip our rest=
  const target = `${UPSTREAM}/${rest}`;

  try {
    const headers = {};
    const ct = req.headers["content-type"];
    if (ct) headers["Content-Type"] = ct;

    const init = {
      method: req.method === "GET" ? "GET" : "POST",
      headers
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const body = await readRawBody(req);
      if (body.length) init.body = body;
    }

    const upstream = await fetch(target, init);
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.statusCode = upstream.status;
    const uct = upstream.headers.get("content-type");
    if (uct) res.setHeader("Content-Type", uct);
    res.end(buf);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        description: `proxy upstream failed: ${error.message || error}`
      })
    );
  }
};
