<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import CommentItem from './CommentItem.vue';
import type { Comment } from '@/lib/types';
import type { CommentsStatus } from '@/composables/useComments';
import { t } from '@/lib/i18n';

const props = defineProps<{
  items: Comment[];
  status: CommentsStatus;
  error?: string | null;
  hasMore: boolean;
  moreFailed: boolean;
}>();
const emit = defineEmits<{ loadMore: []; retry: [] }>();

const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
let sentinelVisible = false;

function maybeLoadMore() {
  if (sentinelVisible && props.hasMore && props.status === 'ready' && !props.moreFailed) {
    emit('loadMore');
  }
}

// The sentinel only exists once comments are rendered, so (re)attach the
// observer whenever it appears.
watch(sentinel, (el) => {
  observer?.disconnect();
  observer = null;
  sentinelVisible = false;
  if (!el) return;
  observer = new IntersectionObserver(
    (entries) => {
      sentinelVisible = entries.some((e) => e.isIntersecting);
      maybeLoadMore();
    },
    { root: el.closest('.panel-body'), rootMargin: '400px 0px' },
  );
  observer.observe(el);
});

// A page that doesn't fill the panel leaves the sentinel visible, and the
// observer won't fire again on its own.
watch(() => props.status, (s) => s === 'ready' && maybeLoadMore());

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="comment-list" :aria-busy="status === 'loading' || status === 'loadingMore'">
    <div v-if="status === 'idle'" class="state">{{ t('stateIdle') }}</div>

    <div v-else-if="status === 'loading'" class="skeletons" aria-hidden="true">
      <div v-for="i in 5" :key="i" class="skeleton">
        <span class="sk-avatar" />
        <span class="sk-lines"><span /><span /><span /></span>
      </div>
    </div>

    <div v-else-if="status === 'disabled'" class="state">
      <p>{{ t('stateDisabled') }}</p>
    </div>

    <div v-else-if="status === 'error' && items.length === 0" class="state error">
      <p>{{ t('stateError') }}</p>
      <p v-if="error" class="detail">{{ error }}</p>
      <button type="button" class="pill" @click="emit('retry')">{{ t('retry') }}</button>
    </div>

    <template v-else>
      <CommentItem v-for="c in items" :key="c.id" :comment="c" />
      <div ref="sentinel" class="sentinel" />
      <div v-if="status === 'loadingMore'" class="state small">{{ t('loadingMore') }}</div>
      <div v-else-if="moreFailed" class="state small error">
        {{ t('loadMoreError') }}
        <button type="button" class="pill" @click="emit('loadMore')">{{ t('retry') }}</button>
      </div>
      <div v-else-if="!hasMore && items.length > 0" class="state small">{{ t('noMore') }}</div>
    </template>
  </div>
</template>

<style scoped>
.comment-list {
  display: flex;
  flex-direction: column;
  padding: 4px 16px 24px;
}
.state {
  padding: 32px 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  text-align: center;
}
.state p { margin: 0 0 8px; }
.state .detail { font-size: 12px; color: rgba(255, 255, 255, 0.4); }
.state.error { color: #ff8a8a; }
.state.small {
  padding: 14px 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}
.pill {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 16px;
  margin-left: 8px;
  border-radius: 999px;
  cursor: pointer;
}
.pill:hover { background: rgba(255, 255, 255, 0.08); }
.sentinel { height: 1px; }

.skeletons { padding: 6px 8px; }
.skeleton { display: flex; gap: 14px; padding: 14px 0; }
.sk-avatar, .sk-lines span {
  background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite linear;
}
.sk-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 2px; }
.sk-lines span { height: 10px; border-radius: 5px; }
.sk-lines span:nth-child(1) { width: 30%; }
.sk-lines span:nth-child(2) { width: 85%; }
.sk-lines span:nth-child(3) { width: 60%; }
@keyframes shimmer { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) {
  .sk-avatar, .sk-lines span { animation: none; }
}
</style>
