// Talks to YouTube's InnerTube `next` endpoint, the one the regular YouTube
// web client calls when you open a video. No API key, no cookies: comments
// are public, so requests are sent anonymously.
//
// We use the plain WEB client (not YT Music's WEB_REMIX), because only WEB
// returns the comments section. music.youtube.com is tried first since it is
// same-origin for the content script; www.youtube.com is the fallback.

const ENDPOINTS = [
  'https://music.youtube.com/youtubei/v1/next?prettyPrint=false',
  'https://www.youtube.com/youtubei/v1/next?prettyPrint=false',
];

// Any recent-ish version is accepted. Bump occasionally.
const CLIENT_VERSION = '2.20261016.01.00';

/** UI language of YT Music (e.g. "fr-FR"), so relative dates come back localized. */
function pageLocale(): { hl: string; gl: string } {
  const lang = document.documentElement.lang || navigator.language || 'en-US';
  const [language, region] = lang.split(/[-_]/);
  return { hl: language || 'en', gl: (region || 'US').toUpperCase() };
}

function context() {
  return {
    client: {
      clientName: 'WEB',
      clientVersion: CLIENT_VERSION,
      ...pageLocale(),
    },
  };
}

function isPlausible(json: any): boolean {
  return !!json && typeof json === 'object' &&
    !!(json.contents || json.onResponseReceivedEndpoints || json.frameworkUpdates);
}

let preferred = 0;

async function post(body: object, signal?: AbortSignal): Promise<any> {
  let lastError: unknown = null;
  for (let i = 0; i < ENDPOINTS.length; i++) {
    const index = (preferred + i) % ENDPOINTS.length;
    try {
      const res = await fetch(ENDPOINTS[index], {
        method: 'POST',
        credentials: 'omit',
        signal,
        headers: {
          'content-type': 'application/json',
          'x-youtube-client-name': '1',
          'x-youtube-client-version': CLIENT_VERSION,
        },
        body: JSON.stringify({ context: context(), ...body }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!isPlausible(json)) throw new Error('unexpected response');
      preferred = index;
      return json;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err;
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export const fetchWatchNext = (videoId: string, signal?: AbortSignal) =>
  post({ videoId }, signal);

export const fetchContinuation = (continuation: string, signal?: AbortSignal) =>
  post({ continuation }, signal);
