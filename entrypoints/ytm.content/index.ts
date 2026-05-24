import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

export default defineContentScript({
  matches: ['*://music.youtube.com/*'],
  cssInjectionMode: 'ui',
  runAt: 'document_idle',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'ytm-comments-drawer',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount(container) {
        const app = createApp(App);
        app.provide('ctx', ctx);
        app.mount(container);
        return app;
      },
      onRemove(app) {
        app?.unmount();
      },
    });

    ui.mount();
  },
});
