# Privacy

This extension does not collect, store, or transmit any user data.

## What the extension does

- Runs only on `https://music.youtube.com`.
- When you play a track, the extension calls
  `https://www.youtube.com/youtubei/v1/next` — the same endpoint the
  official YouTube web client calls to load comments — to fetch the
  comments of the currently playing video. Your existing YouTube
  session cookies are sent by your browser exactly as they would be
  when visiting youtube.com directly.

## What is stored locally

- A copy of YouTube's public client configuration object
  (`INNERTUBE_CONTEXT`: client name, version, locale, country code) is
  cached in `chrome.storage.session` for up to 6 hours. This avoids
  re-fetching the same configuration on every API call. The cache is
  cleared automatically when the browser closes.
- Nothing else.

## What is sent off-device

- Only requests to `www.youtube.com` (the data source for comments).
  Nothing is ever sent to any other server. The extension has no
  backend, no analytics provider, no remote configuration, no
  telemetry.

## What is read but not collected

- The current video ID, taken from the URL of the YouTube Music
  page you are already on. It is included in the request to
  `www.youtube.com` so the matching comments can be returned. The
  extension does not log it, does not store it, does not send it
  anywhere other than to youtube.com.

## Third parties

- None.

## Cookies

The extension does not set or read any cookies itself. Your browser
sends the cookies it already holds for the `youtube.com` domain when
the extension's content script issues a request to that domain — the
same way it would if you opened a YouTube tab manually.

## Contact

File an issue: <https://github.com/andronedev/ytm-comments/issues>

## Changes to this policy

This document is versioned alongside the source code in the public
repository. Any change is visible in the git history of this file.
