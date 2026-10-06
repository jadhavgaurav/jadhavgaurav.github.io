# Gaurav Jadhav — portfolio

Source of [jadhavgaurav.github.io](https://jadhavgaurav.github.io/), a portfolio of AI products, professional engineering contributions, and creative developer tools.

## Run locally

```sh
python -m http.server 4173
```

Open `http://localhost:4173`. The site is plain HTML, CSS, and JavaScript modules, with no dependency installation or build step. GitHub Pages publishes the repository root from `main`; `.nojekyll` keeps it a static deployment.

## Files

- `index.html` — introduction, selected projects, professional contributions, background, open source, and contact.
- `styles.css` — typography, responsive layout, and motion.
- `app.js` — project dialogs, contact actions, local time, and canvas rendering.
- `learning-model.js` — deterministic neural-network training on a synthetic two-moons dataset.
- `bitling-preview.js` — click-to-load integration with Bitling's real public browser engine, simulated developer events, and visibility-aware pause controls.
- `assets/` — bundled fonts and original Bitling artwork, with font licenses.
- `404.html`, `robots.txt`, and `sitemap.xml` — public site navigation and indexing.

## Content and animation

Project descriptions and measurements link to public source and merged changes. Measurements remain qualified to their documented context. No private repository material is included.

The hero renders actual saved training snapshots, predictions, learned weights, and sample activations. It replays a verified small model using a nonlinear time scale; it is an educational illustration, not a generalization benchmark. Pause and replay controls are available. Reduced motion is respected, and painting pauses outside the viewport or when the document is hidden.

Bitling artwork comes from [the original project](https://github.com/jadhavgaurav/bitling/blob/main/docs/media/hero.png). Space Grotesk, DM Sans, IBM Plex Mono, and Instrument Serif are self-hosted with their SIL Open Font Licenses in `assets/fonts/`.

The Bitling playground fetches the project's public `demo.html` only after a visitor chooses Start live demo. Its original canvas drawing, physics, and event handlers run in an iframe; the portfolio supplies the surrounding controls. The adapter uses in-memory pet state, starts muted, hides the demo's duplicate controls, and pauses animation when hidden, offscreen, or manually paused. It does not connect to a visitor's Git repositories. If the upstream demo cannot load, the poster, retry action, and full-project link remain available. The engine currently downloads approximately 10 MB, which is why it is opt-in. The integration was checked against upstream commit `c77968500561a2f35ca9660d47b02a1794737f13`; the public demo remains the runtime source.

The prior portfolio remains recoverable in Git history before the replacement commit.
