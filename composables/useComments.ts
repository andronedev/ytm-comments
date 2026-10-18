import { reactive, watch, type Ref } from 'vue';
import { fetchContinuation, fetchWatchNext } from '@/lib/youtubeApi';
import { parseCommentsPage } from '@/lib/parseComments';
import { findInitialCommentsToken } from '@/lib/parseContinuations';
import type { Comment, SortKey } from '@/lib/types';

export type CommentsStatus = 'idle' | 'loading' | 'ready' | 'loadingMore' | 'error' | 'disabled';

interface State {
  status: CommentsStatus;
  items: Comment[];
  sort: SortKey;
  totalCount: string | null;
  topToken: string | null;
  newestToken: string | null;
  nextPageToken: string | null;
  error: string | null;
  /** True when "load more" failed but the already-loaded items are still shown. */
  moreFailed: boolean;
}

const SWITCH_DEBOUNCE_MS = 250;

/**
 * Loads comments for `videoId`, lazily: nothing is fetched until `active`
 * turns true (drawer opened). Track changes while the drawer is closed only
 * mark the data stale.
 */
export function useComments(videoId: Ref<string>, active: Ref<boolean>) {
  const state = reactive<State>({
    status: 'idle',
    items: [],
    sort: 'top',
    totalCount: null,
    topToken: null,
    newestToken: null,
    nextPageToken: null,
    error: null,
    moreFailed: false,
  });

  let loadedFor = '';
  let aborter: AbortController | null = null;
  let switchTimer: number | null = null;

  function reset() {
    state.items = [];
    state.totalCount = null;
    state.topToken = null;
    state.newestToken = null;
    state.nextPageToken = null;
    state.error = null;
    state.moreFailed = false;
    state.sort = 'top';
  }

  function begin(): AbortController {
    aborter?.abort();
    const ctrl = new AbortController();
    aborter = ctrl;
    return ctrl;
  }

  function fail(err: unknown) {
    if ((err as Error)?.name === 'AbortError') return;
    state.status = 'error';
    state.error = (err as Error)?.message ?? String(err);
  }

  async function load(id: string) {
    const ctrl = begin();
    reset();
    loadedFor = id;
    state.status = 'loading';
    try {
      const watchNext = await fetchWatchNext(id, ctrl.signal);
      const token = findInitialCommentsToken(watchNext);
      if (ctrl.signal.aborted) return;
      if (!token) {
        state.status = 'disabled';
        return;
      }
      const page = parseCommentsPage(await fetchContinuation(token, ctrl.signal));
      if (ctrl.signal.aborted) return;
      state.items = page.items;
      state.totalCount = page.totalCount;
      state.nextPageToken = page.nextPageToken;
      state.topToken = page.sortTokens.top;
      state.newestToken = page.sortTokens.newest;
      state.status = page.items.length || page.nextPageToken ? 'ready' : 'disabled';
    } catch (err) {
      if (ctrl.signal.aborted) return;
      loadedFor = '';
      fail(err);
    }
  }

  async function loadMore() {
    if (state.status !== 'ready' || !state.nextPageToken) return;
    const ctrl = begin();
    state.status = 'loadingMore';
    state.moreFailed = false;
    try {
      const page = parseCommentsPage(await fetchContinuation(state.nextPageToken, ctrl.signal));
      if (ctrl.signal.aborted) return;
      const known = new Set(state.items.map((c) => c.id));
      state.items.push(...page.items.filter((c) => !known.has(c.id)));
      state.nextPageToken = page.nextPageToken;
      state.status = 'ready';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      state.status = 'ready';
      state.moreFailed = true;
    }
  }

  async function setSort(sort: SortKey) {
    if (state.sort === sort) return;
    const token = sort === 'top' ? state.topToken : state.newestToken;
    if (!token) return;
    const ctrl = begin();
    state.sort = sort;
    state.items = [];
    state.nextPageToken = null;
    state.moreFailed = false;
    state.status = 'loading';
    try {
      const page = parseCommentsPage(await fetchContinuation(token, ctrl.signal));
      if (ctrl.signal.aborted) return;
      state.items = page.items;
      state.nextPageToken = page.nextPageToken;
      if (page.sortTokens.top) state.topToken = page.sortTokens.top;
      if (page.sortTokens.newest) state.newestToken = page.sortTokens.newest;
      state.totalCount = page.totalCount ?? state.totalCount;
      state.status = 'ready';
    } catch (err) {
      fail(err);
    }
  }

  function retry() {
    if (videoId.value) void load(videoId.value);
  }

  watch(
    [videoId, active],
    ([id, on]) => {
      if (switchTimer) {
        clearTimeout(switchTimer);
        switchTimer = null;
      }
      if (!id) {
        aborter?.abort();
        reset();
        loadedFor = '';
        state.status = 'idle';
        return;
      }
      if (!on || id === loadedFor) return;
      // Don't flash the previous track's comments during the debounce.
      reset();
      state.status = 'loading';
      switchTimer = window.setTimeout(() => void load(id), SWITCH_DEBOUNCE_MS);
    },
    { immediate: true },
  );

  return { state, loadMore, setSort, retry };
}
