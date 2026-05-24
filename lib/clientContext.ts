import { storage } from '#imports';
import type { ClientContext } from './types';

export const FALLBACK_CLIENT_CONTEXT: ClientContext = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240101.00.00',
    hl: 'en',
    gl: 'US',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  },
};

const STORAGE_KEY = 'session:ytm-comments-client-context' as const;
const STORAGE_TTL_MS = 6 * 60 * 60 * 1000;

type CacheEntry = { value: ClientContext; fetchedAt: number };

let memoryCache: CacheEntry | null = null;

async function readSessionCache(): Promise<ClientContext | null> {
  try {
    const entry = await storage.getItem<CacheEntry>(STORAGE_KEY);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > STORAGE_TTL_MS) return null;
    memoryCache = entry;
    return entry.value;
  } catch {
    return null;
  }
}

async function writeSessionCache(value: ClientContext): Promise<void> {
  const entry: CacheEntry = { value, fetchedAt: Date.now() };
  memoryCache = entry;
  try {
    await storage.setItem<CacheEntry>(STORAGE_KEY, entry);
  } catch {
    // session storage may be unavailable; memory cache still works
  }
}

async function harvestLiveContext(): Promise<ClientContext | null> {
  try {
    const res = await fetch('https://www.youtube.com/', {
      credentials: 'omit',
      headers: { 'accept-language': 'en-US,en;q=0.9' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/"INNERTUBE_CONTEXT":(\{.+?\}),"INNERTUBE_CONTEXT_CLIENT_NAME"/);
    if (!match) return null;
    const parsed = JSON.parse(match[1]);
    if (!parsed?.client?.clientName) return null;
    return parsed as ClientContext;
  } catch {
    return null;
  }
}

export async function getClientContext(): Promise<ClientContext> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < STORAGE_TTL_MS) {
    return memoryCache.value;
  }
  const cached = await readSessionCache();
  if (cached) return cached;
  return FALLBACK_CLIENT_CONTEXT;
}

export async function refreshClientContext(): Promise<ClientContext> {
  const live = await harvestLiveContext();
  if (live) {
    await writeSessionCache(live);
    return live;
  }
  return FALLBACK_CLIENT_CONTEXT;
}
