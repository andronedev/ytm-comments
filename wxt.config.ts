import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'YT Music Comments',
    description: 'Read YouTube comments inline on music.youtube.com',
    permissions: ['storage'],
    host_permissions: [
      'https://music.youtube.com/*',
      'https://www.youtube.com/*',
    ],
  },
});
