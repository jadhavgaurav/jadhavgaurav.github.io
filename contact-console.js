import { CONTACT_ENDPOINT } from './contact-config.js';

const form = document.querySelector('#contact-form');
const fields = ['name', 'email', 'message'];
const inputs = Object.fromEntries(fields.map(name => [name, form.elements[name]]));
const status = document.querySelector('#contact-status');
const button = document.querySelector('#contact-send');
const label = document.querySelector('#contact-send-label');
const receipt = document.querySelector('#contact-receipt');
const readiness = document.querySelector('#contact-readiness');
let startedAt = Date.now();
let submission = null;
let sending = false;

function errorFor(name) {
  const value = inputs[name].value.trim();
  if (!value) return { name: 'A name to start with, please.', email: 'Where can I reply?', message: 'Tell me a little about what you have in mind.' }[name];
  if (name === 'name' && /[\r\n\x00-\x1f]/.test(value)) return 'Please enter your name on one line.';
  if (name === 'email' && (inputs.email.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) return 'That email looks a little incomplete.';
  if (name === 'message' && value.length < 10) return 'A little more detail, please. At least 10 characters.';
  return '';
}
function validate(name) {
  const error = errorFor(name);
  document.querySelector(`#contact-${name}-error`).textContent = error;
  inputs[name].setAttribute('aria-invalid', String(Boolean(error)));
  return !error;
}
function updateProgress() {
  const count = fields.filter(name => !errorFor(name)).length;
  readiness.textContent = `${count} of 3 fields ready`;
  readiness.classList.toggle('is-ready', count === 3);
  document.querySelector('#contact-count').textContent = `${inputs.message.value.length} / 5000`;
}
fields.forEach(name => {
  inputs[name].addEventListener('blur', () => { if (inputs[name].value || inputs[name].hasAttribute('aria-invalid')) validate(name); });
  inputs[name].addEventListener('input', () => {
    if (inputs[name].getAttribute('aria-invalid') === 'true') validate(name);
    submission = null;
    updateProgress();
  });
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending) return;
  status.textContent = '';
  const valid = fields.map(validate);
  if (valid.includes(false)) { inputs[fields[valid.indexOf(false)]].focus(); return; }
  if (!CONTACT_ENDPOINT) {
    status.textContent = 'The form is being connected. Please email hello@iamgaurav.online for now. Your message has not been sent.';
    return;
  }
  submission ??= { id: crypto.randomUUID(), startedAt, website: form.elements.website.value, ...Object.fromEntries(fields.map(name => [name, inputs[name].value.trim()])) };
  sending = true;
  button.disabled = true;
  fields.forEach(name => { inputs[name].readOnly = true; });
  label.textContent = 'Sending...';
  form.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch(CONTACT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submission), signal: AbortSignal.timeout(20000), credentials: 'omit' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) {
      if (response.status === 429) throw new Error('A few messages arrived at once. Please wait a few minutes, then try again.');
      throw new Error(result.error || 'The message could not be sent. Please try again or email me directly.');
    }
    document.querySelector('#receipt-name').textContent = submission.name;
    document.querySelector('#receipt-email').textContent = submission.email;
    form.hidden = true;
    receipt.hidden = false;
    receipt.focus({ preventScroll: true });
  } catch (error) {
    status.textContent = error.name === 'TimeoutError' || error.name === 'AbortError' ? 'Confirmation took too long. You can retry with the same message, or email me directly.' : error.message === 'Failed to fetch' ? 'The connection did not go through. Your message is still here. Try again or email me directly.' : error.message;
  } finally {
    sending = false;
    button.disabled = false;
    fields.forEach(name => { inputs[name].readOnly = false; });
    label.textContent = 'Send message';
    form.removeAttribute('aria-busy');
  }
});
document.querySelector('#contact-another').addEventListener('click', () => {
  form.reset(); submission = null; startedAt = Date.now();
  fields.forEach(name => { inputs[name].removeAttribute('aria-invalid'); document.querySelector(`#contact-${name}-error`).textContent = ''; });
  status.textContent = ''; receipt.hidden = true; form.hidden = false; updateProgress(); inputs.name.focus();
});
updateProgress();
