import test from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler } from './handler.js';

const now = 1800000000000;
const origin = 'https://jadhavgaurav.github.io';
const env = { CONTACT_ENABLED: 'true', BREVO_API_KEY: 'test-only-not-a-real-key', CONTACT_TO_EMAIL: 'owner@example.com', ALLOWED_ORIGINS: origin };
const data = { id: 'e7d4deed-62b6-411f-88a3-61c939ca1168', startedAt: now - 10000, website: '', name: 'Alex <script>', email: 'alex@example.com', message: 'A product idea with <b>untrusted HTML</b>.' };
function request(body = data, extra = {}) { return new Request('https://contact.example/api/contact', { method: 'POST', headers: { origin, 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) }); }
function setup(response = () => Response.json({ messageIds: ['owner-id', 'visitor-id'] }, { status: 201 }), options = {}) {
  const calls = [];
  const handler = createContactHandler({ env, now: () => now, send: async (url, init) => { calls.push({ url, ...init, payload: JSON.parse(init.body) }); return response(); }, ...options });
  return { handler, calls };
}
test('only accepts portfolio origins, valid methods, and JSON', async () => {
  const { handler, calls } = setup();
  assert.equal((await handler(request(data, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await handler(new Request('https://contact.example', { headers: { origin } }))).status, 405);
  assert.equal((await handler(request(data, { 'Content-Type': 'text/plain' }))).status, 415);
  const preflight = await handler(new Request('https://contact.example', { method: 'OPTIONS', headers: { origin } }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal(calls.length, 0);
});
test('refuses unconfigured sending rather than pretending success', async () => {
  const { handler, calls } = setup(undefined, { env: { ...env, CONTACT_ENABLED: 'false' } });
  assert.equal((await handler(request())).status, 503);
  assert.equal(calls.length, 0);
});
test('rejects invalid fields, honeypots, timing, IDs, and oversized bodies before sending', async () => {
  const { handler, calls } = setup();
  for (const change of [{ email: 'bad@example.com\nBcc:spam@example.com' }, { name: '' }, { message: 'tiny' }, { message: 'x'.repeat(5001) }, { website: 'https://bot.example' }, { startedAt: now }, { id: 'bad' }, { name: ['name'] }]) assert.equal((await handler(request({ ...data, ...change }))).status, 400);
  assert.equal((await handler(request({ ...data, message: 'x'.repeat(30000) }))).status, 413);
  assert.equal(calls.length, 0);
});
test('sends two separate versions from the specified sender and safely renders user content', async () => {
  const { handler, calls } = setup();
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  const { payload } = calls[0];
  assert.deepEqual(payload.sender, { name: 'Gaurav Jadhav', email: 'hello@iamgaurav.online' });
  assert.equal(payload.messageVersions.length, 2);
  assert.equal(payload.messageVersions[0].to[0].email, 'owner@example.com');
  assert.equal(payload.messageVersions[1].to[0].email, 'alex@example.com');
  assert.match(payload.messageVersions[0].htmlContent, /&lt;script&gt;/);
  assert.match(payload.messageVersions[0].htmlContent, /&lt;b&gt;untrusted HTML&lt;\/b&gt;/);
  assert.doesNotMatch(payload.messageVersions[1].htmlContent, /untrusted HTML|Alex/);
  assert.equal(payload.replyTo.email, 'hello@iamgaurav.online');
});
test('keeps retry key stable for the same payload and distinct for changed content', async () => {
  const { handler, calls } = setup();
  await handler(request()); await handler(request()); await handler(request({ ...data, message: 'A different product conversation.' }));
  assert.equal(calls[0].payload.headers.idempotencyKey, calls[1].payload.headers.idempotencyKey);
  assert.notEqual(calls[0].payload.headers.idempotencyKey, calls[2].payload.headers.idempotencyKey);
  assert.match(calls[0].payload.headers.idempotencyKey, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/);
});
test('recognizes Brevo suppression of an already accepted batch', async () => {
  const { handler } = setup(() => Response.json({ code: 'duplicate_parameter' }, { status: 400 }));
  assert.deepEqual(await (await handler(request())).json(), { ok: true });
});
test('does not expose provider errors, credentials, or claim success on failure', async () => {
  for (const response of [() => Response.json({ error: env.BREVO_API_KEY }, { status: 401 }), () => Response.json({ messageIds: ['only-one'] }, { status: 201 }), () => { throw new Error(env.BREVO_API_KEY); }]) {
    const { handler } = setup(response);
    const result = await handler(request());
    assert.equal(result.status, 502);
    assert.doesNotMatch(await result.text(), /test-only-not-a-real-key/);
  }
  const { handler } = setup(() => Response.json({ code: 'too_many_requests' }, { status: 429 }));
  assert.equal((await handler(request())).status, 429);
});
