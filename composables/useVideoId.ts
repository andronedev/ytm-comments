import { ref } from 'vue';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';

function readVideoId(url: string): string {
  try {
    return new URL(url).searchParams.get('v') ?? '';
  } catch {
    return '';
  }
}

function readPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

export function useVideoId(ctx: ContentScriptContext) {
  const videoId = ref(readVideoId(location.href));
  const pathname = ref(readPath(location.href));

  ctx.addEventListener(window, 'wxt:locationchange', (event) => {
    const newUrl = event.newUrl?.href ?? location.href;
    const nextId = readVideoId(newUrl);
    const nextPath = readPath(newUrl);
    if (nextId !== videoId.value) videoId.value = nextId;
    if (nextPath !== pathname.value) pathname.value = nextPath;
  });

  return { videoId, pathname };
}
