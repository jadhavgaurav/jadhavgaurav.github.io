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
- `assets/` — bundled fonts and original Bitling artwork, with font licenses.
- `404.html`, `robots.txt`, and `sitemap.xml` — public site navigation and indexing.

## Content and animation

Project descriptions and measurements link to public source and merged changes. Measurements remain qualified to their documented context. No private repository material is included.

The hero renders actual saved training snapshots, predictions, learned weights, and sample activations. It replays a verified small model using a nonlinear time scale; it is an educational illustration, not a generalization benchmark. Pause and replay controls are available. Reduced motion is respected, and painting pauses outside the viewport or when the document is hidden.

Bitling artwork comes from [the original project](https://github.com/jadhavgaurav/bitling/blob/main/docs/media/hero.png). Space Grotesk, DM Sans, IBM Plex Mono, and Instrument Serif are self-hosted with their SIL Open Font Licenses in `assets/fonts/`.

The prior portfolio remains recoverable in Git history before the replacement commit.
