"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/amo-lead");

function responseMock() {
  return {
    headers: {},
    statusCode: 0,
    body: "",
    setHeader(key, value) { this.headers[key] = value; },
    end(value = "") { this.body = value; }
  };
}

function requestMock(body) {
  return { method: "POST", headers: { origin: "https://azimutclinic.ru" }, body };
}

test("creates an amoCRM lead and mirrors it to the registry", async () => {
  process.env.AMOCRM_ACCESS_TOKEN = "test-token";
  process.env.LEADS_WEBHOOK_URL = "https://registry.example/exec";
  process.env.LEADS_WEBHOOK_SECRET = "registry-secret";
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.includes("/contacts?")) return new Response(JSON.stringify({ _embedded: { contacts: [] } }), { status: 200 });
    if (url.endsWith("/contacts")) return new Response(JSON.stringify({ _embedded: { contacts: [{ id: 11 }] } }), { status: 200 });
    if (url.endsWith("/leads")) return new Response(JSON.stringify({ _embedded: { leads: [{ id: 22 }] } }), { status: 200 });
    if (url.includes("/notes")) return new Response(JSON.stringify({}), { status: 200 });
    if (url === process.env.LEADS_WEBHOOK_URL) return new Response(JSON.stringify({ ok: true, row: 2 }), { status: 200 });
    throw new Error(`Unexpected URL ${url}`);
  };

  const response = responseMock();
  await handler(requestMock({ NAME: "Тест", PHONE: "+79990000000", EMAIL: "test@example.com", SOURCE_ID: "site", requestId: "req-1" }), response);
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 201);
  assert.equal(body.ok, true);
  assert.equal(body.captured, true);
  assert.equal(body.leadId, 22);
  assert.ok(calls.some((call) => call.url === process.env.LEADS_WEBHOOK_URL));
});

test("keeps the application when amoCRM is temporarily unavailable", async () => {
  process.env.AMOCRM_ACCESS_TOKEN = "test-token";
  process.env.LEADS_WEBHOOK_URL = "https://registry.example/exec";
  process.env.LEADS_WEBHOOK_SECRET = "registry-secret";
  global.fetch = async (url) => {
    if (url === process.env.LEADS_WEBHOOK_URL) return new Response(JSON.stringify({ ok: true, row: 3 }), { status: 200 });
    return new Response(JSON.stringify({ detail: "maintenance" }), { status: 503 });
  };

  const response = responseMock();
  await handler(requestMock({ NAME: "Тест", PHONE: "+79990000001", SOURCE_ID: "Telegram bot", requestId: "req-2" }), response);
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 202);
  assert.equal(body.ok, true);
  assert.equal(body.captured, true);
  assert.deepEqual(body.warnings, ["AMOCRM_ERROR"]);
});
