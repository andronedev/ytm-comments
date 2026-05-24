import type { Comment, CommentsPage, RepliesPage, Reply } from './types';

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

function buildEntityMap(json: any): Map<string, any> {
  const mutations: any[] = json?.frameworkUpdates?.entityBatchUpdate?.mutations ?? [];
  const map = new Map<string, any>();
  for (const m of mutations) {
    const payload = m?.payload;
    if (!payload) continue;
    const key = m.entityKey ?? payload?.commentEntityPayload?.key;
    const entity =
      payload.commentEntityPayload ??
      payload.engagementToolbarStateEntityPayload ??
      null;
    if (entity && key) map.set(key, payload);
  }
  return map;
}

function findEntityByCommentId(map: Map<string, any>, commentId: string): any | null {
  for (const p of map.values()) {
    const ce = p?.commentEntityPayload;
    if (ce?.properties?.commentId === commentId) return ce;
  }
  return null;
}

function toCommentFromEntity(entity: any): Omit<Comment, 'replyCount' | 'replyContinuation'> | null {
  if (!entity) return null;
  const props = entity.properties ?? {};
  const author = entity.author ?? {};
  const toolbar = entity.toolbar ?? {};
  if (!props.commentId || typeof props?.content?.content !== 'string') return null;
  return {
    id: props.commentId,
    author: author.displayName ?? '',
    authorAvatar: author.avatarThumbnailUrl ?? author.channelAvatar?.[0]?.url ?? null,
    authorChannelId: author.channelId ?? null,
    body: props.content.content,
    publishedTime: props.publishedTime ?? '',
    likeCount: toolbar.likeCountNotliked ?? toolbar.likeCountLiked ?? '0',
    isHearted: Boolean(toolbar.heartActive),
    isPinned: Boolean(props.pinnedText),
  };
}

export function parseCommentsPage(json: any): CommentsPage {
  const entityMap = buildEntityMap(json);
  const actions = collectActions(json);

  const items: Comment[] = [];
  let nextPageToken: string | null = null;
  const sortTokens: { top: string | null; newest: string | null } = { top: null, newest: null };

  for (const action of actions) {
    if (action?.commentThreadRenderer) {
      const thread = action.commentThreadRenderer;
      const commentId =
        thread?.commentViewModel?.commentViewModel?.commentId ??
        thread?.commentViewModel?.commentId ??
        null;
      const entity = commentId ? findEntityByCommentId(entityMap, commentId) : null;
      const base = toCommentFromEntity(entity);
      if (!base) continue;
      const replyCount =
        Number(entity?.toolbar?.replyCount) ||
        Number(thread?.replies?.commentRepliesRenderer?.replyCount) ||
        0;
      const replyContinuation =
        thread?.replies?.commentRepliesRenderer?.contents?.find(
          (c: any) => c?.continuationItemRenderer,
        )?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token ?? null;
      items.push({ ...base, replyCount, replyContinuation });
    } else if (action?.continuationItemRenderer) {
      const token =
        action.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      if (typeof token === 'string') nextPageToken = token;
    } else if (action?.commentsHeaderRenderer) {
      const sub = action.commentsHeaderRenderer?.sortMenu?.sortFilterSubMenuRenderer?.subMenuItems;
      if (Array.isArray(sub)) {
        sortTokens.top = sub[0]?.serviceEndpoint?.continuationCommand?.token ?? null;
        sortTokens.newest = sub[1]?.serviceEndpoint?.continuationCommand?.token ?? null;
      }
    }
  }

  return { items, nextPageToken, sortTokens };
}

export function parseRepliesPage(json: any): RepliesPage {
  const entityMap = buildEntityMap(json);
  const actions = collectActions(json);

  const items: Reply[] = [];
  let nextPageToken: string | null = null;

  const fromEntity = (entity: any): Reply | null => {
    const base = toCommentFromEntity(entity);
    if (!base) return null;
    const { replyCount: _r, replyContinuation: _c, ...rest } = base as any;
    return rest as Reply;
  };

  const considerView = (commentId: string | undefined) => {
    if (!commentId) return;
    const entity = findEntityByCommentId(entityMap, commentId);
    const r = fromEntity(entity);
    if (r) items.push(r);
  };

  for (const action of actions) {
    if (action?.commentViewModel) {
      const id =
        action.commentViewModel?.commentViewModel?.commentId ??
        action.commentViewModel?.commentId;
      considerView(id);
    } else if (action?.commentThreadRenderer) {
      const id =
        action.commentThreadRenderer?.commentViewModel?.commentViewModel?.commentId;
      considerView(id);
    } else if (action?.continuationItemRenderer) {
      const token =
        action.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      if (typeof token === 'string') nextPageToken = token;
    }
  }

  if (items.length === 0) {
    for (const p of entityMap.values()) {
      const ce = p?.commentEntityPayload;
      if (!ce) continue;
      if (Number(ce?.properties?.replyLevel) >= 1) {
        const r = fromEntity(ce);
        if (r) items.push(r);
      }
    }
  }

  return { items, nextPageToken };
}
