export {};
const preview = document.querySelector('#world-preview');
const video = document.querySelector('#world-video');
const previewToggle = document.querySelector('#world-preview-toggle');
const launch = document.querySelector('#world-launch');
const dialog = document.querySelector('#world-dialog');
const frame = document.querySelector('#world-game');
const status = document.querySelector('#world-game-status');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let visible = false;
let manuallyPaused = false;
let previousOverflow = '';

function syncPreview() {
  previewToggle.hidden = reduced.matches;
  previewToggle.textContent = manuallyPaused ? 'Play' : 'Pause';
  previewToggle.setAttribute('aria-label', manuallyPaused ? 'Play gameplay preview' : 'Pause gameplay preview');
  previewToggle.setAttribute('aria-pressed', String(manuallyPaused));
  if (visible && !document.hidden && !dialog.open && !reduced.matches && !manuallyPaused) {
    video.play().catch(error => {
      if (error.name === 'AbortError') return;
      // The real gameplay poster remains visible if autoplay is unavailable.
      manuallyPaused = true;
      syncPreview();
    });
  } else video.pause();
}
new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  syncPreview();
}, { threshold: 0.15 }).observe(preview);
document.addEventListener('visibilitychange', syncPreview);
reduced.addEventListener('change', syncPreview);
previewToggle.addEventListener('click', () => { manuallyPaused = !manuallyPaused; syncPreview(); });

launch.addEventListener('click', () => {
  previousOverflow = document.body.style.overflow;
  status.textContent = 'Loading the world...';
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  syncPreview();
  frame.onload = () => {
    if (dialog.open) status.textContent = 'Choose Enter the World to play. WebGL is required for the 3D game.';
  };
  frame.src = 'https://gaurav-portfolio-theta.vercel.app/';
});
document.querySelector('#world-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  frame.onload = null;
  frame.src = 'about:blank'; // Stop the 3D runtime when the game is closed.
  document.body.style.overflow = previousOverflow;
  syncPreview();
  launch.focus({ preventScroll: true });
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
syncPreview();
