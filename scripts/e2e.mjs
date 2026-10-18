// End-to-end smoke test: loads the built extension into Chromium, opens a
// track on music.youtube.com, and exercises the button and drawer.
//
//   pnpm build && pnpm e2e                     both player bar layouts
//   LAYOUT=wiz pnpm e2e                        only the 2026 player bar
//   HEADED=1 UI_LANG=fr SHOTS=/tmp pnpm e2e    watch it, in French, with screenshots
//
// YT Music rolls its player bar redesign out per account; signed-out sessions
// still get the legacy one, so the "wiz" run forces the experiment flag.

import { chromium } from 'playwright';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const EXT = resolve(process.env.EXT ?? '.output/chrome-mv3');
const VIDEO = process.env.VIDEO ?? 'dQw4w9WgXcQ';
const UI_LANG = process.env.UI_LANG ?? 'en-US';
const SHOTS = process.env.SHOTS;
const LAYOUTS = process.env.LAYOUT ? [process.env.LAYOUT] : ['legacy', 'wiz'];
// YT Music refuses "HeadlessChrome" user agents.
const UA =
  process.env.UA ??
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';

let failed = 0;
const check = (name, ok, extra = '') => {
  console.log(`  ${ok ? '✔' : '✘'} ${name}${extra ? ` — ${extra}` : ''}`);
  if (!ok) failed++;
};
const attempt = async (name, promise, extra) => {
  try {
    const v = await promise;
    check(name, true, typeof extra === 'function' ? await extra(v) : extra);
  } catch (e) {
    check(name, false, e.message.split('\n')[0]);
  }
};

// Signed-out sessions get pre-roll ads, during which the player bar hides its
// track buttons. Skip them when possible, otherwise wait them out.
async function waitForAdsToFinish(page) {
  const start = Date.now();
  while (Date.now() - start < 150000) {
    const ad = await page.evaluate(() => {
      const skip = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button');
      if (skip && skip.offsetParent) skip.click();
      return !!document.querySelector('#movie_player.ad-showing');
    });
    if (!ad && Date.now() - start > 4000) break;
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(1000);
}

/** Polls `fn` (in Node) until it returns something truthy. */
async function until(fn, timeout = 30000) {
  const start = Date.now();
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() - start > timeout) throw new Error(`timed out after ${timeout}ms`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

async function run(layout) {
  console.log(`\n▶ layout: ${layout}`);
  const profile = mkdtempSync(join(tmpdir(), 'ytm-e2e-'));
  const ctx = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: !process.env.HEADED,
    locale: UI_LANG,
    viewport: { width: 1280, height: 800 },
    userAgent: UA,
    args: [
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
      `--lang=${UI_LANG}`,
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
  // Pre-answer the EU consent wall ("reject all").
  await ctx.addCookies([
    { name: 'SOCS', value: 'CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg', domain: '.youtube.com', path: '/', secure: true },
  ]);
  if (layout === 'wiz') {
    await ctx.route(/^https:\/\/music\.youtube\.com\//, async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const res = await route.fetch();
      const body = (await res.text()).replaceAll(
        '"EXPERIMENT_FLAGS":{',
        '"EXPERIMENT_FLAGS":{"music_web_enable_wiz_miniplayer":true,',
      );
      await route.fulfill({ response: res, body });
    });
  }

  const page = ctx.pages()[0] ?? (await ctx.newPage());
  page.on('pageerror', (e) => console.log('    [pageerror]', e.message));
  const shot = async (name) => {
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${layout}-${name}.png` }).catch(() => {});
  };

  const host = page.locator('#ytm-comments-injected-button');
  const button = host.locator('button');
  const panel = page.locator('ytm-comments-drawer .panel');
  const cards = page.locator('ytm-comments-drawer .comment-list > article.card');

  try {
    await page.goto(`https://music.youtube.com/watch?v=${VIDEO}`, { waitUntil: 'domcontentloaded' });
    await waitForAdsToFinish(page);

    await attempt('button injected in player bar', button.waitFor({ state: 'visible', timeout: 30000 }));
    const detected = await host.getAttribute('data-layout');
    check('expected layout detected', detected === layout, detected ?? 'none');
    const label = await button.getAttribute('aria-label');
    check('button label is localized', !!label && label !== 'commentsButton', label ?? '');

    await button.click();
    await attempt('drawer opens', panel.waitFor({ state: 'visible', timeout: 10000 }));
    await page.waitForTimeout(400); // slide-in transition
    const box = await panel.boundingBox();
    const barTop = await page.evaluate(() =>
      document.getElementById('ytm-comments-injected-button')
        ?.closest('ytmusic-miniplayer, ytmusic-player-bar')
        ?.getBoundingClientRect().top ?? 0,
    );
    check('drawer sits on top of the player bar', !!box && Math.abs(box.y + box.height - barTop) <= 2,
      box ? `drawer bottom ${Math.round(box.y + box.height)}, bar top ${Math.round(barTop)}` : 'no box');

    await attempt('comments load', cards.first().waitFor({ timeout: 30000 }), () => cards.count());
    const first = cards.first();
    const author = (await first.locator('.author').textContent())?.trim();
    const body = (await first.locator('.text').textContent())?.trim();
    check('comment has author + body', !!author && !!body, `${author}: ${body?.slice(0, 50)}`);
    const count = await page.locator('ytm-comments-drawer .panel-title .count').textContent({ timeout: 2000 }).catch(() => '');
    check('total comment count shown', !!count, count ?? '');
    await shot('drawer');

    const n = await cards.count();
    await page.locator('ytm-comments-drawer .panel-body').evaluate((el) => (el.scrollTop = el.scrollHeight));
    await attempt('infinite scroll loads more', until(async () => (await cards.count()) > n), () => cards.count());

    const toggle = page.locator('ytm-comments-drawer .replies-toggle').first();
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();
    await attempt('replies expand',
      page.locator('ytm-comments-drawer .reply-list article.card').first().waitFor({ timeout: 20000 }));

    // Pinned comments stay on top in both orders, so compare a few at once.
    const firstTexts = () => cards.locator('.text').evaluateAll((els) => els.slice(0, 4).map((e) => e.textContent).join('|'));
    const topTexts = await firstTexts();
    await page.locator('ytm-comments-drawer .sort-menu button').nth(1).click();
    await attempt('sort by newest', until(async () =>
      (await page.locator('ytm-comments-drawer .sort-menu button').nth(1).getAttribute('aria-checked')) === 'true' &&
      (await cards.count()) > 0 &&
      (await firstTexts()) !== topTexts));

    await page.keyboard.press('Escape');
    await attempt('Escape closes drawer', panel.waitFor({ state: 'hidden', timeout: 5000 }));
    check('Escape does not leave the player page', new URL(page.url()).pathname === '/watch', page.url());

    // Go home: music keeps playing in the player bar, the button must stay.
    await page.evaluate(() => {
      const home = document.querySelector('ytmusic-guide-entry-renderer a[href="/"], ytmusic-pivot-bar-item-renderer[tab-id="FEmusic_home"], a.ytmusic-guide-entry-renderer');
      if (home) home.click();
      else document.querySelector('ytmusic-player-page')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await page.waitForURL((u) => new URL(u).pathname !== '/watch', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    check('left the player page', new URL(page.url()).pathname !== '/watch', page.url());
    await attempt('button still visible off the player page', button.waitFor({ state: 'visible', timeout: 10000 }));
    await button.click();
    await attempt('comments load off the player page', cards.first().waitFor({ timeout: 30000 }));
    await shot('home');

    const before = await cards.first().locator('.text').textContent();
    await page.locator([
      'ytmusic-player-bar .next-button button',
      'ytmusic-miniplayer .ytmusicPlayerControlsNextButton button',
    ].join(', ')).first().click();
    await waitForAdsToFinish(page);
    await attempt('track change refreshes comments', until(async () => {
      const text = await cards.first().locator('.text').textContent({ timeout: 1000 });
      return !!text && text !== before;
    }, 60000));
    await shot('next-track');
  } catch (err) {
    check('unexpected error', false, err.message.split('\n')[0]);
    await shot('failure');
  } finally {
    await ctx.close();
    rmSync(profile, { recursive: true, force: true });
  }
}

for (const layout of LAYOUTS) await run(layout);
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
