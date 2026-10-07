# Astro portfolio deployment

The updated framework implementation lives in `astro/` on `main`. Vercel project `iamgaurav-portfolio` uses this repository, root directory `astro`, framework Astro, build command `npm run build`, and output directory `dist`. Production is available at https://iamgaurav.online/ and https://iamgaurav-portfolio.vercel.app/.

The existing root HTML website and `contact-service/` are preserved. GitHub Pages continues serving the existing site from `main`. The current design baseline is commit `4971351`; the Astro version restores its Bitling playground, The World preview, animated search card, and contact console, while adding project stories, a complete contribution index, and the journey.

The production domain `iamgaurav.online` is connected and verified as of 7 October 2026. Cloudflare has a DNS-only CNAME named `@` pointing to `df59882552f6936b.vercel-dns-017.com`, with automatic TTL. Vercel reports Valid Configuration; all 15 sitemap pages return HTTPS 200 with canonical URLs on this domain. Existing email, verification, and subdomain records are preserved. The separate 3D portfolio uses `world.iamgaurav.online`. The separate email API remains `gaurav-contact-api.vercel.app`; its CORS preflight accepts the main domain. Its credentials are not part of the frontend deployment.
