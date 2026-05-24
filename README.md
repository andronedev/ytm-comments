# ytm-comments

A Chrome extension that puts the YouTube comments back on YouTube Music
desktop. Mobile YT Music has had them since 2023, the web client doesn't, this
fixes it.

A speech-bubble icon shows up in the player bar between the like button and
the three-dot menu. Click it and a drawer slides up with the comments of the
track playing right now.

Read-only: you can browse, sort Top / Newest, and expand replies. You can't
post or like — that would need real auth and isn't what this is for.

## Install

Node 18+ and pnpm.

```sh
git clone https://github.com/andronedev/ytm-comments.git
cd ytm-comments
pnpm install
pnpm dev
```

`pnpm dev` opens a fresh Chrome profile with the extension and HMR. If you'd
rather load it in your own Chrome, `pnpm build` and load
`.output/chrome-mv3/` from `chrome://extensions`.

Open any track on music.youtube.com, click the new icon.

## How comments are fetched

No API key. The extension POSTs to
`https://www.youtube.com/youtubei/v1/next`, the same endpoint youtube.com
itself hits when you open a video. Two calls per track: first
`{videoId}` to get the comments continuation token, then
`{continuation: token}` for the first page. CORS works because the manifest
declares `host_permissions` for `youtube.com`, and the user's existing
YouTube cookies are sent so locale and personalised like state come through.

Track changes inside YT Music are picked up via WXT's `wxt:locationchange`
event. The videoId in `music.youtube.com/watch?v=…` is the same string as
on regular YouTube, so reading `?v=` is enough — no mapping.

## Layout

- `entrypoints/ytm.content/` — content script, Vue root
- `components/` — drawer, comment list, item, replies, sort menu
- `composables/` — `useVideoId`, `useComments`, `useReplies`, `usePlayerBarButton`
- `lib/` — `youtubeApi.ts`, `clientContext.ts`, parsers, types

The most fragile file is `lib/parseComments.ts`. YouTube reshapes the JSON
paths a few times a year, so every hop is `?.` chained.

## Things that can break

- The hard-coded `clientVersion` gets rejected. `clientContext.ts` falls back
  to scraping the live value from `https://www.youtube.com/` and caches it
  in session storage.
- Some tracks have comments off or no public YouTube counterpart — the
  drawer just says so.
- Signed out: read still works, just no personalised like state on each
  comment.

## License

MIT. See [LICENSE](LICENSE).

Not affiliated with YouTube or Google. The endpoint this calls isn't a
public API and can change without warning, at which point the parser breaks
and the drawer shows "couldn't load" until I update it.
