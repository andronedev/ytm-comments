import { reactive, watch, type Ref } from 'vue';
import { fetchContinuation, fetchWatchNext } from '@/lib/youtubeApi';
import { parseCommentsPage } from '@/lib/parseComments';
import { findInitialCommentsToken } from '@/lib/parseContinuations';
import type { Comment, SortKey } from '@/lib/types';

type Status = 'idle' | 'loading' | 'ready' | 'loadingMore' | 'error' | 'disabled';

interface State {
  status: Status;
  items: Comment[];
  sort: SortKey;
  topToken: string | null;
  newestToken: string | null;
  nextPageToken: string | null;
  error: string | null;
}

const SWITCH_DEBOUNCE_MS = 250;

export function useComments(videoId: Ref<string>, enabled: Ref<boolean>) {
  const state = reactive<State>({
    status: 'idle',
    items: [],
    sort: 'top',
    topToken: null,
    newestToken: null,
    nextPageToken: null,
    error: null,
  });

  let aborter: AbortController | null = null;
  let switchTimer: number | null = null;

  function reset() {
    state.items = [];
    state.topToken = null;
    state.newestToken = null;
    state.nextPageToken = null;
    state.error = null;
  }

  function cancelInFlight() {
    if (aborter) aborter.abort();
    aborter = null;
  }

  async function load(currentVideoId: string) {
    cancelInFlight();
    reset();
    state.status = 'loading';
    const ctrl = new AbortController();
    aborter = ctrl;
    try {
      const watchNext = await fetchWatchNext(currentVideoId, ctrl.signal);
      const initialToken = findInitialCommentsToken(watchNext);
      if (!initialToken) {
        state.status = 'disabled';
        return;
      }
      const first = await fetchContinuation(initialToken, ctrl.signal);
      if (ctrl.signal.aborted) return;
      const page = parseCommentsPage(first);
      state.items = page.items;
      state.nextPageToken = page.nextPageToken;
      state.topToken = page.sortTokens.top;
      state.newestToken = page.sortTokens.newest;
      state.status = 'ready';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      state.status = 'error';
      state.error = (err as Error).message;
    }
  }

  async function loadMore() {
    if (state.status !== 'ready' || !state.nextPageToken) return;
    const token = state.nextPageToken;
    const ctrl = new AbortController();
    state.status = 'loadingMore';
    try {
      const json = await fetchContinuation(token, ctrl.signal);
      const page = parseCommentsPage(json);
      state.items.push(...page.items);
      state.nextPageToken = page.nextPageToken;
      state.status = 'ready';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      state.status = 'error';
      state.error = (err as Error).message;
    }
  }

  async function setSort(sort: SortKey) {
    if (state.sort === sort) return;
    const token = sort === 'top' ? state.topToken : state.newestToken;
    if (!token) return;
    cancelInFlight();
    state.sort = sort;
    state.items = [];
    state.nextPageToken = null;
    state.status = 'loading';
    const ctrl = new AbortController();
    aborter = ctrl;
    try {
      const json = await fetchContinuation(token, ctrl.signal);
      const page = parseCommentsPage(json);
      state.items = page.items;
      state.nextPageToken = page.nextPageToken;
      if (page.sortTokens.top) state.topToken = page.sortTokens.top;
      if (page.sortTokens.newest) state.newestToken = page.sortTokens.newest;
      state.status = 'ready';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      state.status = 'error';
      state.error = (err as Error).message;
    }
  }

  watch(
    [videoId, enabled],
    ([id, on]) => {
      if (switchTimer) {
        clearTimeout(switchTimer);
        switchTimer = null;
      }
      if (!on || !id) {
        cancelInFlight();
        state.status = 'idle';
        reset();
        return;
      }
      switchTimer = window.setTimeout(() => {
        void load(id);
      }, SWITCH_DEBOUNCE_MS);
    },
    { immediate: true },
  );

  return { state, loadMore, setSort };
}
