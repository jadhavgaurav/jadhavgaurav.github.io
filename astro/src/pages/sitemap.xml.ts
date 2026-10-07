import type { APIRoute } from 'astro';
import { getProjects } from '../lib/portfolio';

export const GET: APIRoute = async ({ site }) => {
  const routes = ['/', '/work.html', '/open-source.html', '/journey.html',
    ...(await getProjects()).map(project => `/projects/${project.id}.html`)];
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    + routes.map(route => `<url><loc>${new URL(route, site)}</loc></url>`).join('') + '</urlset>',
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
