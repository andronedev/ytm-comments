import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    // `storage` only remembers the drawer height. Comments are fetched by
    // the content script from YouTube's public endpoint, which allows
    // music.youtube.com via CORS, so no extra host permission is needed.
    permissions: ['storage'],
    homepage_url: 'https://github.com/andronedev/ytm-comments',
  },
});
