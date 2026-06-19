import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://xravity.xyz',
  integrations: [sitemap()],
  build: {
    assets: 'assets'
  }
});
