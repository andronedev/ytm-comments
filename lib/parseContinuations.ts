export function findInitialCommentsToken(watchNext: any): string | null {
  const items: any[] =
    watchNext?.contents?.twoColumnWatchNextResults?.results?.results?.contents ?? [];
  for (const c of items) {
    const section = c?.itemSectionRenderer;
    if (!section) continue;
    const id = section.sectionIdentifier ?? section.targetId;
    if (id === 'comment-item-section' || id === 'comments-section') {
      const cont = (section.contents ?? []).find((x: any) => x.continuationItemRenderer);
      const token =
        cont?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      if (typeof token === 'string') return token;
    }
  }
  for (const c of items) {
    const section = c?.itemSectionRenderer;
    const cont = (section?.contents ?? []).find((x: any) => x.continuationItemRenderer);
    const token =
      cont?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
    if (typeof token === 'string' && token.length > 50) return token;
  }
  return null;
}
