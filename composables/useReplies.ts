import { reactive } from 'vue';
import { fetchContinuation } from '@/lib/youtubeApi';
import { parseRepliesPage } from '@/lib/parseComments';
import type { Reply } from '@/lib/types';

type Status = 'idle' | 'loading' | 'ready' | 'loadingMore' | 'error';

interface ThreadState {
  status: Status;
  items: Reply[];
  initialToken: string | null;
  nextPageToken: string | null;
  error: string | null;
}

// Shared across all ReplyList instances so expanding/collapsing a thread
// doesn't refetch it. Cleared on track change.
const threads = reactive<Record<string, ThreadState>>({});
let generation = 0;

function ensure(commentId: string): ThreadState {
  if (!threads[commentId]) {
    threads[commentId] = {
      status: 'idle',
      items: [],
      initialToken: null,
      nextPageToken: null,
      error: null,
    };
  }
  return threads[commentId];
}

export function useReplies() {
  async function fetchInto(t: ThreadState, token: string, append: boolean) {
    const gen = generation;
    try {
      const page = parseRepliesPage(await fetchContinuation(token));
      if (gen !== generation) return;
      const known = new Set(t.items.map((r) => r.id));
      const fresh = page.items.filter((r) => !known.has(r.id));
      t.items = append ? [...t.items, ...fresh] : fresh;
      t.nextPageToken = page.nextPageToken;
      t.status = 'ready';
    } catch (err) {
      if (gen !== generation) return;
      t.status = 'error';
      t.error = (err as Error)?.message ?? String(err);
    }
  }

  async function load(commentId: string, initialToken: string) {
    const t = ensure(commentId);
    if (t.status === 'loading' || t.status === 'ready' || t.status === 'loadingMore') return;
    t.status = 'loading';
    t.error = null;
    t.initialToken = initialToken;
    await fetchInto(t, initialToken, false);
  }

  async function loadMore(commentId: string) {
    const t = ensure(commentId);
    if (t.status !== 'ready' || !t.nextPageToken) return;
    t.status = 'loadingMore';
    await fetchInto(t, t.nextPageToken, true);
  }

  function retry(commentId: string) {
    const t = ensure(commentId);
    if (t.status !== 'error') return;
    const token = t.items.length ? t.nextPageToken : t.initialToken;
    if (!token) return;
    t.status = t.items.length ? 'loadingMore' : 'loading';
    void fetchInto(t, token, t.items.length > 0);
  }

  function get(commentId: string): ThreadState {
    return ensure(commentId);
  }

  function reset() {
    generation++;
    for (const k of Object.keys(threads)) delete threads[k];
  }

  return { load, loadMore, retry, get, reset };
}
