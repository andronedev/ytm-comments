import { onScopeDispose, ref } from 'vue';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';

function idFromUrl(url: string | null | undefined): string {
  if (!url) return '';
  try {
    return new URL(url, location.origin).searchParams.get('v') ?? '';
  } catch {
    return '';
  }
}

/**
 * The video ID of the track currently loaded in the player.
 *
 * On /watch the URL is the source of truth. Anywhere else (home, library,
 * search… with the mini-player running) we read it from the embedded
 * player's title link, ignoring it while an ad is playing.
 */
function readCurrentVideoId(): string {
  if (location.pathname === '/watch') {
    const fromUrl = idFromUrl(location.href);
    if (fromUrl) return fromUrl;
  }
  const player = document.querySelector('#movie_player');
  if (player?.classList.contains('ad-showing')) return '';
  const link = document.querySelector<HTMLAnchorElement>('#movie_player .ytp-title-link');
  return idFromUrl(link?.href);
}

const POLL_MS = 1000;

export function useNowPlaying(ctx: ContentScriptContext) {
  const videoId = ref(readCurrentVideoId());

  function refresh() {
    const next = readCurrentVideoId();
    // During ads we keep showing the previous track rather than flickering.
    if (next && next !== videoId.value) videoId.value = next;
  }

  ctx.addEventListener(window, 'wxt:locationchange', refresh);
  // The player swaps tracks without touching the URL when you're browsing
  // elsewhere, and there is no public event for it from an isolated world.
  // A 1s poll of two querySelector calls is negligible.
  const timer = ctx.setInterval(refresh, POLL_MS);
  onScopeDispose(() => clearInterval(timer));

  return { videoId };
}
