import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://iamgaurav.online',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // Preserve the fourteen published .html URLs through the migration.
    format: 'file',
    inlineStylesheets: 'never',
  },
});
