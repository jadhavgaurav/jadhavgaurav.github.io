export {};
// Embed the project's real, publicly deployed engine, loaded only on request.
// A separate srcdoc gives this portfolio its own in-memory pet state.
const playground = document.querySelector('#bitling-playground');
const frame = document.querySelector('#bitling-frame');
const start = document.querySelector('#bitling-start');
const cover = document.querySelector('#bitling-cover');
const pause = document.querySelector('#bitling-pause');
const status = document.querySelector('#bitling-status');
const buttons = [...document.querySelectorAll('[data-bitling-event]')];
const demoURL = 'https://jadhavgaurav.github.io/bitling/demo.html?embedded=1';
let engine;
let visible = false;
let manualPause = false;

// This runs before the upstream engine. No changes to its drawing or physics.
function prepareHabitat() {
  const values = new Map();
  Object.defineProperty(window, 'localStorage', { value: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  }});
  const requestFrame = window.requestAnimationFrame.bind(window);
  let paused = false;
  let pending;
  window.requestAnimationFrame = callback => requestFrame(time => {
    if (paused) pending = callback;
    else callback(time);
  });
  window.portfolioMotion = shouldPause => {
    paused = shouldPause;
    if (!paused && pending) {
      const callback = pending;
      pending = undefined;
      window.requestAnimationFrame(callback);
    }
  };
}

function syncMotion() {
  if (!engine) return;
  const paused = manualPause || !visible || document.hidden;
  frame.contentWindow.portfolioMotion(paused);
  pause.textContent = manualPause ? 'Resume' : 'Pause';
  pause.setAttribute('aria-pressed', String(manualPause));
  buttons.forEach(button => { button.disabled = paused; });
}
new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  syncMotion();
}, { threshold: 0.1 }).observe(playground);
document.addEventListener('visibilitychange', syncMotion);
pause.addEventListener('click', () => {
  manualPause = !manualPause;
  syncMotion();
  status.textContent = manualPause ? 'Paused. Resume to keep playing.' : 'Click to pat. Drag to throw. Try a developer event below.';
});

start.addEventListener('click', async () => {
  start.disabled = true;
  start.textContent = 'Loading Bitling…';
  status.textContent = 'Loading the real project engine. This may take a moment.';
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 45000);
  try {
    const response = await fetch(demoURL, { signal: abort.signal });
    if (!response.ok) throw new Error('Demo unavailable');
    let html = await response.text();
    if (!html.includes('window.__bitling =')) throw new Error('Unsupported engine');
    // Use our bundled typography. All creature rendering stays upstream.
    html = html.replace('window.__demoControls = true;', 'window.__demoControls = false;')
      .replace(/<link[^>]*https:\/\/fonts\.googleapis\.com[^>]*>/g, '')
      .replace(/<link[^>]*https:\/\/fonts\.gstatic\.com[^>]*>/g, '');
    const presentation = `<base href="https://jadhavgaurav.github.io/bitling/">
      <style>
        @font-face{font-family:Portfolio;src:url('https://jadhavgaurav.github.io/assets/fonts/DMSans.ttf')}
        html body{background:#eef1f7!important;font-family:Portfolio,Arial,sans-serif!important}
        .hud,#dock,#petBar,#demoBar,#help,#menu{display:none!important}
        #bubble{font-family:Portfolio,Arial,sans-serif!important;font-size:14px!important}
      </style><script>(${prepareHabitat.toString()})();<\/script>`;
    html = html.replace('</head>', `${presentation}</head>`);
    const ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Engine did not initialize')), 15000);
      frame.onload = () => {
        clearTimeout(timer);
        try {
          engine = frame.contentWindow.__bitling;
          if (!engine?.selectSpecies || !engine?.event) throw new Error('Engine not ready');
          // Original robot; no sound or persistence in the portfolio.
          engine.rawState().sound = false;
          engine.selectSpecies('robot');
          engine.setName('Bitling');
          engine.place(engine.state().W / 2);
          engine.say('Ready when you are. Try a commit!', 3500);
          resolve();
        } catch (error) { reject(error); }
      };
    });
    frame.hidden = false;
    frame.srcdoc = html;
    await ready;
    cover.hidden = true;
    pause.hidden = false;
    syncMotion();
    status.textContent = 'Bitling is live. Click to pat, drag to throw, or try an event.';
    pause.focus({ preventScroll: true });
  } catch {
    engine = undefined;
    frame.onload = null;
    frame.removeAttribute('srcdoc');
    frame.hidden = true;
    cover.hidden = false;
    start.disabled = false;
    start.textContent = 'Try loading again';
    status.textContent = 'The live preview could not load. Try again or open the full project below.';
  } finally {
    clearTimeout(timeout);
  }
});

const tests = ['test_webhook_signature', 'test_retry_backoff', 'test_cache_expiry'];
buttons.forEach(button => button.addEventListener('click', () => {
  if (!engine || button.disabled) return;
  try {
    const action = button.dataset.bitlingEvent;
    if (action === 'commit') {
      engine.event({ kind: 'commit', message: 'feat: make useful things playful', hash: 'c0ffee1', insertions: 42, deletions: 8 });
      status.textContent = 'git commit → a little something to catch.';
    } else if (action === 'push') {
      engine.event({ kind: 'push', branch: 'main' });
      status.textContent = 'git push → shipped. Watch the launch.';
    } else if (action === 'fail') {
      engine.event({ kind: 'test-failed', count: tests.length, name: 'portfolio-demo', tests });
      status.textContent = 'Three tests failed. Meet the bugs. Now try Fix tests.';
    } else if (action === 'fix') {
      engine.event({ kind: 'test-passed', name: 'portfolio-demo' });
      status.textContent = 'Tests pass → Bitling clears the bugs with its real attack animation.';
    } else {
      engine.act('pat');
      status.textContent = 'A little appreciation goes a long way.';
    }
  } catch {
    status.textContent = 'This event is unavailable. You can still explore the full project below.';
  }
}));
