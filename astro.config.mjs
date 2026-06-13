import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://xravity.netlify.app',
  integrations: [sitemap()],
  build: {
    assets: 'assets'
  }
});
