# jadhavgaurav.github.io

Source of [jadhavgaurav.github.io](https://jadhavgaurav.github.io), the portfolio of Gaurav Jadhav.

Plain HTML, CSS and ES modules. No build step and no dependencies, so GitHub Pages serves the repository root as is.

## Layout

| Path | What it holds |
| --- | --- |
| `index.html` | The page and its copy |
| `css/styles.css` | Tokens for light and dark, layout, motion |
| `js/` | Theme toggle, reveal on scroll, the cursor-reactive name (`name.js`), the pet (`pet.js`), the star-scaled bubble field and the project list |
| `assets/pet/` | Poses of Bitling, cropped from the art in [jadhavgaurav/bitling](https://github.com/jadhavgaurav/bitling) (MIT) |
| `data/oss.json` | Every open-source pull request, grouped by project. Generated, do not edit by hand |
| `scripts/fetch-oss.mjs` | Builds `data/oss.json` from GitHub's public API |
| `.github/workflows/refresh-data.yml` | Runs the script daily and commits the result when it changed |
| `fonts/` | Geist and Geist Mono, self-hosted (SIL Open Font License) |

## Run it locally

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173>. The page loads `data/oss.json` with `fetch`, so open it through a server, not as a file.

## Refresh the open-source data by hand

```bash
GITHUB_TOKEN=$(gh auth token) node scripts/fetch-oss.mjs
```

The script ignores pull requests to repositories owned by `jadhavgaurav` or the `digibranders` organisation, and one practice repository for first-time contributors.
