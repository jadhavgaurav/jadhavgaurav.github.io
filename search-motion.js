// This is a conceptual explanation of joint embeddings, not model inference.
const visual = document.querySelector('.search-visual');
const diagram = document.querySelector('.search-diagram');
const control = document.querySelector('#search-motion-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let visible = false;
let paused = false;

function syncMotion() {
  diagram.dataset.playing = String(visible && !paused && !document.hidden && !reduced.matches);
  control.hidden = reduced.matches;
  control.textContent = paused ? 'Play' : 'Pause';
  control.setAttribute('aria-pressed', String(paused));
  control.setAttribute('aria-label', paused ? 'Play search animation' : 'Pause search animation');
}
control.addEventListener('click', () => { paused = !paused; syncMotion(); });
new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  syncMotion();
}, { threshold: 0.15 }).observe(visual);
document.addEventListener('visibilitychange', syncMotion);
reduced.addEventListener('change', syncMotion);
syncMotion();
