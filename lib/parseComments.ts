import type { Author, Comment, CommentsPage, RepliesPage, Reply, TextRun } from './types';

// YouTube reshapes these JSON paths a few times a year, so every hop is `?.`
// chained and every field has a fallback.

function collectActions(json: any): any[] {
  const endpoints: any[] = json?.onResponseReceivedEndpoints ?? [];
  const out: any[] = [];
  for (const e of endpoints) {
    const append = e?.appendContinuationItemsAction?.continuationItems;
    const reload = e?.reloadContinuationItemsCommand?.continuationItems;
    if (Array.isArray(append)) out.push(...append);
    if (Array.isArray(reload)) out.push(...reload);
  }
  return out;
}

interface Entities {
  comments: Map<string, any>; // commentId -> commentEntityPayload
  toolbarStates: Map<string, any>; // entity key -> engagementToolbarStateEntityPayload
}

function buildEntities(json: any): Entities {
  const mutations: any[] = json?.frameworkUpdates?.entityBatchUpdate?.mutations ?? [];
  const comments = new Map<string, any>();
  const toolbarStates = new Map<string, any>();
  for (const m of mutations) {
    const payload = m?.payload;
    const comment = payload?.commentEntityPayload;
    if (comment?.properties?.commentId) comments.set(comment.properties.commentId, comment);
    const toolbar = payload?.engagementToolbarStateEntityPayload;
    const key = toolbar?.key ?? m?.entityKey;
    if (toolbar && key) toolbarStates.set(key, toolbar);
  }
  return { comments, toolbarStates };
}

function viewModelOf(node: any): any {
  return node?.commentViewModel?.commentViewModel ?? node?.commentViewModel ?? null;
}

function absoluteYoutubeUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `https://www.youtube.com${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Unwraps youtube.com/redirect?q=… so links go straight to their target. */
function unwrapRedirect(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('youtube.com') && u.pathname === '/redirect') {
      return u.searchParams.get('q') ?? url;
    }
  } catch {
    // keep as-is
  }
  return url;
}

function runFromCommand(text: string, command: any): TextRun {
  const watch = command?.watchEndpoint;
  if (watch && typeof watch.startTimeSeconds === 'number') {
    return { kind: 'timestamp', text, seconds: watch.startTimeSeconds, videoId: watch.videoId ?? null };
  }
  const url =
    command?.urlEndpoint?.url ??
    command?.commandMetadata?.webCommandMetadata?.url ??
    null;
  if (typeof url === 'string' && url) {
    return { kind: 'link', text, url: unwrapRedirect(absoluteYoutubeUrl(url)) };
  }
  return { kind: 'text', text };
}

export function toRuns(content: any): TextRun[] {
  const text: string = typeof content?.content === 'string' ? content.content : '';
  const commands: any[] = Array.isArray(content?.commandRuns) ? content.commandRuns : [];
  if (commands.length === 0) return text ? [{ kind: 'text', text }] : [];

  // startIndex/length are UTF-16 offsets, which is what String#slice uses.
  const sorted = commands
    .filter((c) => Number.isFinite(c?.startIndex) && Number.isFinite(c?.length))
    .sort((a, b) => a.startIndex - b.startIndex);
  const runs: TextRun[] = [];
  let cursor = 0;
  for (const c of sorted) {
    if (c.startIndex < cursor) continue;
    if (c.startIndex > cursor) runs.push({ kind: 'text', text: text.slice(cursor, c.startIndex) });
    const slice = text.slice(c.startIndex, c.startIndex + c.length);
    runs.push(runFromCommand(slice, c?.onTap?.innertubeCommand));
    cursor = c.startIndex + c.length;
  }
  if (cursor < text.length) runs.push({ kind: 'text', text: text.slice(cursor) });
  return runs;
}

function toAuthor(entity: any): Author {
  const a = entity?.author ?? {};
  const channelPath =
    a.channelCommand?.innertubeCommand?.commandMetadata?.webCommandMetadata?.url ??
    (a.channelId ? `/channel/${a.channelId}` : null);
  return {
    name: a.displayName ?? '',
    avatar: a.avatarThumbnailUrl ?? null,
    channelUrl: channelPath ? absoluteYoutubeUrl(channelPath) : null,
    isCreator: Boolean(a.isCreator),
    isVerified: Boolean(a.isVerified),
    isArtist: Boolean(a.isArtist),
  };
}

function toReply(entity: any, viewModel: any, entities: Entities): Reply | null {
  const props = entity?.properties;
  if (!props?.commentId || typeof props?.content?.content !== 'string') return null;
  const toolbar = entity.toolbar ?? {};
  const stateKey = viewModel?.toolbarStateKey ?? props.toolbarStateKey;
  const state = stateKey ? entities.toolbarStates.get(stateKey) : null;
  return {
    id: props.commentId,
    author: toAuthor(entity),
    runs: toRuns(props.content),
    publishedTime: props.publishedTime ?? '',
    likeCount: toolbar.likeCountNotliked || toolbar.likeCountLiked || '',
    isHearted: state?.heartState === 'TOOLBAR_HEART_STATE_HEARTED',
  };
}

/** "682" -> 682, "1.2K" -> 1200, "3,4 k" -> 3400. Only used to know if there are replies. */
function parseCompactNumber(value: unknown): number {
  const s = String(value ?? '').trim();
  const m = s.match(/^([\d.,\s\u00a0]+)\s*([kKmM])?/);
  if (!m) return 0;
  const digits = m[1].replace(/[\s\u00a0]/g, '');
  const n = m[2] ? Number(digits.replace(',', '.')) : Number(digits.replace(/[.,]/g, ''));
  if (!Number.isFinite(n)) return 0;
  const mult = m[2] ? (m[2].toLowerCase() === 'k' ? 1e3 : 1e6) : 1;
  return Math.round(n * mult);
}

function textOf(node: any): string | null {
  if (!node) return null;
  if (typeof node.simpleText === 'string') return node.simpleText;
  if (Array.isArray(node.runs)) return node.runs.map((r: any) => r?.text ?? '').join('');
  return null;
}

function continuationToken(node: any): string | null {
  const t =
    node?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token ??
    node?.continuationItemRenderer?.button?.buttonRenderer?.command?.continuationCommand?.token;
  return typeof t === 'string' ? t : null;
}

export function parseCommentsPage(json: any): CommentsPage {
  const entities = buildEntities(json);
  const items: Comment[] = [];
  let nextPageToken: string | null = null;
  let totalCount: string | null = null;
  const sortTokens: { top: string | null; newest: string | null } = { top: null, newest: null };

  for (const action of collectActions(json)) {
    if (action?.commentThreadRenderer) {
      const thread = action.commentThreadRenderer;
      const vm = viewModelOf(thread);
      const entity = vm?.commentId ? entities.comments.get(vm.commentId) : null;
      const base = toReply(entity, vm, entities);
      if (!base) continue;
      const replies = thread?.replies?.commentRepliesRenderer;
      const replyContinuation =
        (replies?.contents ?? []).map(continuationToken).find(Boolean) ?? null;
      items.push({
        ...base,
        isPinned: Boolean(vm?.pinnedText),
        pinnedText: vm?.pinnedText ?? null,
        replyCount: parseCompactNumber(entity?.toolbar?.replyCount),
        replyCountText: String(entity?.toolbar?.replyCount ?? ''),
        replyContinuation,
      });
    } else if (action?.continuationItemRenderer) {
      nextPageToken = continuationToken(action) ?? nextPageToken;
    } else if (action?.commentsHeaderRenderer) {
      const header = action.commentsHeaderRenderer;
      // countText is e.g. ["2,459,980", " Comments"]; keep the number, the label is ours.
      const runs: any[] = header?.countText?.runs ?? [];
      totalCount =
        runs.map((r) => String(r?.text ?? '').trim()).find((r) => /\d/.test(r)) ??
        textOf(header?.commentsCount) ??
        textOf(header?.countText) ??
        totalCount;
      const sub = header?.sortMenu?.sortFilterSubMenuRenderer?.subMenuItems;
      if (Array.isArray(sub)) {
        sortTokens.top = sub[0]?.serviceEndpoint?.continuationCommand?.token ?? null;
        sortTokens.newest = sub[1]?.serviceEndpoint?.continuationCommand?.token ?? null;
      }
    }
  }

  return { items, nextPageToken, sortTokens, totalCount };
}

export function parseRepliesPage(json: any): RepliesPage {
  const entities = buildEntities(json);
  const items: Reply[] = [];
  const seen = new Set<string>();
  let nextPageToken: string | null = null;

  const push = (vm: any) => {
    const id = vm?.commentId;
    if (!id || seen.has(id)) return;
    const r = toReply(entities.comments.get(id), vm, entities);
    if (r) {
      seen.add(id);
      items.push(r);
    }
  };

  for (const action of collectActions(json)) {
    if (action?.commentViewModel) push(viewModelOf(action));
    else if (action?.commentThreadRenderer) push(viewModelOf(action.commentThreadRenderer));
    else if (action?.continuationItemRenderer) nextPageToken = continuationToken(action) ?? nextPageToken;
  }

  if (items.length === 0) {
    for (const entity of entities.comments.values()) {
      if (Number(entity?.properties?.replyLevel) >= 1) push({ commentId: entity.properties.commentId });
    }
  }

  return { items, nextPageToken };
}
