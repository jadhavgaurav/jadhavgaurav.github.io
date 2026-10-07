import { createHmac } from 'node:crypto';
import { SENDER, thankYouEmail, notificationEmail } from './email.js';

const emailPattern = /^[^\s@<>"\x00-\x1f]+@[^\s@<>"\x00-\x1f]+\.[^\s@<>"\x00-\x1f]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BYTES = 24000;
async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error('size'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createContactHandler({ env = process.env, send = fetch, now = Date.now } = {}) {
  return async request => {
    const origin = request.headers.get('origin');
    const allowed = (env.ALLOWED_ORIGINS || 'https://jadhavgaurav.github.io').split(',').map(value => value.trim());
    const headers = { 'Cache-Control': 'no-store', Vary: 'Origin' };
    const reply = (status, body, extra = {}) => Response.json(body, { status, headers: { ...headers, ...extra } });
    if (!origin || !allowed.includes(origin)) return reply(403, { error: 'This form is only available from the portfolio.' });
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, { error: 'Use the contact form to send a message.' }, { Allow: 'POST, OPTIONS' });
    if (env.CONTACT_ENABLED !== 'true' || !env.BREVO_API_KEY || !emailPattern.test(env.CONTACT_TO_EMAIL || '')) return reply(503, { error: 'The form is being connected. Please email hello@iamgaurav.online for now.' });
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply(415, { error: 'Please send the form as JSON.' });
    if (Number(request.headers.get('content-length')) > MAX_BYTES) return reply(413, { error: 'The message is too long.' });
    let data;
    try { data = await readBody(request); } catch (error) { return reply(error.message === 'size' ? 413 : 400, { error: 'Please check the form and try again.' }); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400, { error: 'Please check the form and try again.' });
    const { id, startedAt, website = '' } = data;
    if (typeof website !== 'string' || website || !uuidPattern.test(id || '') || !Number.isFinite(startedAt) || now() - startedAt < 2000 || now() - startedAt > 86400000) return reply(400, { error: 'Please wait a moment and try again. Reload the page if the issue continues.' });
    if (['name', 'email', 'message'].some(key => typeof data[key] !== 'string')) return reply(400, { error: 'Please complete all three fields.' });
    const name = data.name.trim(), email = data.email.trim(), message = data.message.trim();
    if (!name || name.length > 80 || /[\x00-\x1f]/.test(name) || email.length > 254 || !emailPattern.test(email) || message.length < 10 || message.length > 5000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(message)) return reply(400, { error: 'Please check your name, email, and message.' });
    // Bind retries to their content, so changing a message creates a different batch.
    const hash = createHmac('sha256', env.BREVO_API_KEY).update(JSON.stringify([id, name, email, message])).digest('hex').slice(0, 32).split('');
    hash[12] = '4'; hash[16] = '8';
    const key = hash.join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
    const payload = {
      sender: SENDER,
      replyTo: SENDER,
      subject: 'A conversation with Gaurav Jadhav',
      htmlContent: thankYouEmail(),
      headers: { idempotencyKey: key },
      tags: ['portfolio-contact'],
      messageVersions: [
        { to: [{ email: env.CONTACT_TO_EMAIL, name: 'Gaurav Jadhav' }], subject: 'New message from your portfolio', htmlContent: notificationEmail({ name, email, message }) },
        { to: [{ email, name }], subject: 'Thanks for the hello | Gaurav Jadhav', htmlContent: thankYouEmail() }
      ]
    };
    try {
      const response = await send('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(12000) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        // Brevo suppresses the same accepted batch for 30 minutes.
        if (response.status === 400 && result.code === 'duplicate_parameter') return reply(200, { ok: true });
        return reply(response.status === 429 ? 429 : 502, { error: 'Email could not be confirmed. Please try again or email hello@iamgaurav.online.' });
      }
      if (!Array.isArray(result.messageIds) || result.messageIds.length !== 2) return reply(502, { error: 'Email could not be confirmed. Please try again or email me directly.' });
      return reply(200, { ok: true });
    } catch { return reply(502, { error: 'The email connection did not respond. Please retry or email hello@iamgaurav.online.' }); }
  };
}
