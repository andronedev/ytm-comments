# ytm-comments

A Chrome extension that puts the YouTube comments back on YouTube Music
desktop. Mobile YT Music has had them since 2023, the web client doesn't, this
fixes it.

A speech-bubble icon shows up in the player bar between the like button and
the three-dot menu. Click it and a drawer slides up with the comments of the
track playing right now.

Read-only: you can browse, sort Top / Newest, and expand replies. You can't
post or like — that would need real auth and isn't what this is for.

**Heads up — current limitation:** the button only shows comments when the
track has a real YouTube video counterpart (i.e. music videos). For
album-style audio uploads (the "Song" entries, with no public YouTube video),
the drawer is empty for now. Comments do exist on those server-side — they
just sit on a different endpoint. Support is coming.

## Install

Not on any web store yet. Grab a prebuilt zip from
[Releases](https://github.com/andronedev/ytm-comments/releases) (stable) or
from the latest [CI run](https://github.com/andronedev/ytm-comments/actions)
(bleeding edge, can break), or build it yourself.

**Chrome / Edge** — unzip, open `chrome://extensions` (or `edge://extensions`),
enable developer mode, click *Load unpacked*, point at the unzipped folder.

**Firefox** — open `about:debugging#/runtime/this-firefox`, click *Load
Temporary Add-on*, pick the `.zip` directly. Note: removed when Firefox
restarts. A permanent install requires a Mozilla-signed build, which this
project doesn't have.

CI artifacts come wrapped in an extra GitHub zip, so you have to extract once
to get the real `ytm-comments-<version>-<browser>.zip`, then extract that.

Then open any track on music.youtube.com and click the new icon.

### Build it yourself

Node 18+ and pnpm.

```sh
git clone https://github.com/andronedev/ytm-comments.git
cd ytm-comments
pnpm install
pnpm dev                   # fresh Chrome profile + HMR
pnpm build                 # .output/chrome-mv3/, load unpacked
pnpm build:firefox         # .output/firefox-mv2/
```

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
- Some tracks have comments off or are pure-audio uploads with no public
  YouTube video — the drawer is empty in that case. See the heads-up at the
  top.
- Signed out: read still works, just no personalised like state on each
  comment.

## License

MIT. See [LICENSE](LICENSE).

Not affiliated with YouTube or Google. The endpoint this calls isn't a
public API and can change without warning, at which point the parser breaks
and the drawer shows "couldn't load" until I update it.
