# Gaurav Jadhav — Astro portfolio

The Astro migration of the current [GitHub Pages portfolio](https://jadhavgaurav.github.io/), extended with project stories, an open-source contribution index, and a chronological archive. The verified homepage baseline is `jadhavgaurav/jadhavgaurav.github.io` at commit `497135116f8a84b47a2e8a2e000d822ba6515fad` (7 October 2026). See [PORTFOLIO_SOURCES.md](PORTFOLIO_SOURCES.md) before importing content from another portfolio repository.

## Development

Use Node.js 22.12 or newer:

```sh
npm ci
npm run dev
```

The development server runs at http://127.0.0.1:4191. Run `npm run check` for Astro and TypeScript diagnostics, `npm run build` to generate the site, and `npm run preview` to inspect the production build.

## Source

- `src/components/`: native Astro sections and shared components. The homepage retains the verified site's typography, neural-network visualization, original selected-project compositions, search animation, Bitling playground, The World preview, and contact console.
- `src/content.config.ts`: validated content collections. `src/data/projects.json` holds eleven project stories; repository and contribution JSON files contain the dated public snapshots. `src/data/journey.ts` contains career milestones and their evidence links.
- `src/pages/`: homepage, work archive, open-source index, journey, and generated project routes. Individual case studies and the journey require no client JavaScript.
- `src/scripts/`: progressive enhancements, loaded only on pages that use them. Original case-study buttons now link to shareable project pages.
- `public/assets/`: self-hosted fonts and licenses, original Bitling artwork, and the recorded gameplay preview.

`dist/` is generated output and is ignored. This implementation lives in `astro/` within the `jadhavgaurav.github.io` repository. Select `astro` as the Vercel root directory. The existing root HTML site and `contact-service/` are preserved during migration.

## Deployment

The intended production host is Vercel, with canonical domain **iamgaurav.online**. `vercel.json` selects Astro, builds with `npm run build`, and serves `dist`. Static output intentionally contains HTML; Astro is the framework that generates it. The `.html` routes remain supported.

After connecting the correct Vercel account, inspect existing projects before creating or linking one. Add `iamgaurav.online` and obtain its exact required DNS records from Vercel. DNS is currently authoritative at Cloudflare; preserve email and verification records. Production deployment and domain verification have not yet been completed.

The contact console uses the existing public email API at `https://gaurav-contact-api.vercel.app/api/contact`. Its separate deployment already accepts `https://iamgaurav.online` in its CORS preflight (verified 7 October 2026); the local preview origin is intentionally rejected. Frontend migration does not change that backend or its credentials. A successful frontend build does not verify email delivery; exercise the UI with a mocked transport and perform an authorized real delivery check after production configuration.

The previous Sites deployment is a separate snapshot. This migration must not be deployed there in place of the requested Vercel deployment.
