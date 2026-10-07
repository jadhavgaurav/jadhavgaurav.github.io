# Astro portfolio deployment

The updated framework implementation lives in `astro/` on `main`. Vercel project `iamgaurav-portfolio` uses this repository, root directory `astro`, framework Astro, build command `npm run build`, and output directory `dist`. Production is available at https://iamgaurav-portfolio.vercel.app/.

The existing root HTML website and `contact-service/` are preserved. GitHub Pages continues serving the existing site from `main` while the Astro deployment is reviewed. The current design baseline is commit `4971351`; the Astro version restores its Bitling playground, The World preview, animated search card, and contact console, while adding project stories, a complete contribution index, and the journey.

The production domain `iamgaurav.online` is assigned to this Vercel project. Cloudflare DNS configuration is pending: Vercel requests a DNS-only CNAME named `@` pointing to `df59882552f6936b.vercel-dns-017.com`. Preserve all existing email, verification, and subdomain records. The separate 3D portfolio uses `world.iamgaurav.online`. The separate email API remains `gaurav-contact-api.vercel.app`; it already accepts the main domain in its CORS preflight. Its credentials are not part of the frontend deployment.
