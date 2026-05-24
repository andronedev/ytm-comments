import { reactive } from 'vue';
import { fetchContinuation } from '@/lib/youtubeApi';
import { parseRepliesPage } from '@/lib/parseComments';
import type { Reply } from '@/lib/types';

type Status = 'idle' | 'loading' | 'ready' | 'loadingMore' | 'error';

interface ThreadState {
  status: Status;
  items: Reply[];
  nextPageToken: string | null;
  error: string | null;
}

const threads = reactive<Record<string, ThreadState>>({});

function ensure(commentId: string): ThreadState {
  if (!threads[commentId]) {
    threads[commentId] = { status: 'idle', items: [], nextPageToken: null, error: null };
  }
  return threads[commentId];
}

export function useReplies() {
  async function load(commentId: string, initialToken: string) {
    const t = ensure(commentId);
    if (t.status === 'loading' || t.items.length > 0) return;
    t.status = 'loading';
    try {
      const json = await fetchContinuation(initialToken);
      const page = parseRepliesPage(json);
      t.items = page.items;
      t.nextPageToken = page.nextPageToken;
      t.status = 'ready';
    } catch (err) {
      t.status = 'error';
      t.error = (err as Error).message;
    }
  }

  async function loadMore(commentId: string) {
    const t = ensure(commentId);
    if (t.status !== 'ready' || !t.nextPageToken) return;
    const token = t.nextPageToken;
    t.status = 'loadingMore';
    try {
      const json = await fetchContinuation(token);
      const page = parseRepliesPage(json);
      t.items.push(...page.items);
      t.nextPageToken = page.nextPageToken;
      t.status = 'ready';
    } catch (err) {
      t.status = 'error';
      t.error = (err as Error).message;
    }
  }

  function get(commentId: string): ThreadState {
    return ensure(commentId);
  }

  function reset() {
    for (const k of Object.keys(threads)) delete threads[k];
  }

  return { load, loadMore, get, reset };
}
