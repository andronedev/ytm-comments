# Privacy

This extension does not collect, store, or transmit any user data.

## What the extension does

- Runs only on `https://music.youtube.com`.
- When you open the comments drawer, the extension calls YouTube's
  `youtubei/v1/next` endpoint (on `music.youtube.com`, falling back to
  `www.youtube.com`) — the same endpoint the official YouTube web client
  calls to load comments — to fetch the public comments of the track
  currently playing.
- These requests are sent **without cookies** (`credentials: 'omit'`):
  your YouTube account is never involved, and the requests are anonymous.
- Nothing is fetched until you open the drawer.

## What is stored locally

- The height you dragged the drawer to, in `chrome.storage.local`, so it
  opens at the same size next time.
- Nothing else.

## What is sent off-device

- Only requests to `music.youtube.com` / `www.youtube.com` (the data source
  for comments). Nothing is ever sent to any other server. The extension
  has no backend, no analytics provider, no remote configuration, no
  telemetry.

## What is read but not collected

- The current video ID, taken from the page you are already on (the URL,
  or the player when you browse elsewhere while music plays), and the page
  language, so comment dates come back in your language. Both are included
  in the request to YouTube and nowhere else. The extension does not log
  or store them.

## Third parties

- None.

## Cookies

The extension does not set or read any cookies, and its requests to
YouTube explicitly omit them.

## Contact

File an issue: <https://github.com/andronedev/ytm-comments/issues>

## Changes to this policy

This document is versioned alongside the source code in the public
repository. Any change is visible in the git history of this file.
