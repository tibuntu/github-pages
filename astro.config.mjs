import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://tibuntu.dev',
  output: 'static',
  integrations: [tailwind(), mdx()],
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
