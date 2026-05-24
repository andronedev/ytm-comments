import { getClientContext, refreshClientContext } from './clientContext';

const ENDPOINT = 'https://www.youtube.com/youtubei/v1/next?prettyPrint=false';

async function postRaw(body: object, signal?: AbortSignal): Promise<any> {
  const context = await getClientContext();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-youtube-client-name': '1',
      'x-youtube-client-version': context.client.clientVersion,
    },
    body: JSON.stringify({ context, ...body }),
  });
  if (!res.ok) throw new Error(`youtube api ${res.status}`);
  return res.json();
}

export async function post(body: object, signal?: AbortSignal): Promise<any> {
  try {
    const json = await postRaw(body, signal);
    if (!isPlausibleResponse(json)) {
      await refreshClientContext();
      return postRaw(body, signal);
    }
    return json;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    await refreshClientContext();
    return postRaw(body, signal);
  }
}

function isPlausibleResponse(json: any): boolean {
  if (!json || typeof json !== 'object') return false;
  if (json.contents || json.onResponseReceivedEndpoints || json.frameworkUpdates) return true;
  return false;
}

export const fetchWatchNext = (videoId: string, signal?: AbortSignal) =>
  post({ videoId }, signal);

export const fetchContinuation = (continuation: string, signal?: AbortSignal) =>
  post({ continuation }, signal);
