<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import CommentItem from './CommentItem.vue';
import type { Comment } from '@/lib/types';

const props = defineProps<{
  items: Comment[];
  status: 'idle' | 'loading' | 'ready' | 'loadingMore' | 'error' | 'disabled';
  error?: string | null;
  hasMore: boolean;
}>();
const emit = defineEmits<{ loadMore: [] }>();

const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (!sentinel.value) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting && props.hasMore && props.status === 'ready') {
          emit('loadMore');
        }
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(sentinel.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <div class="comment-list">
    <div v-if="status === 'idle'" class="state">Pick a track to see comments.</div>
    <div v-else-if="status === 'loading' && items.length === 0" class="state">Loading comments…</div>
    <div v-else-if="status === 'disabled'" class="state">Comments are disabled or unavailable for this track.</div>
    <div v-else-if="status === 'error' && items.length === 0" class="state error">
      Couldn't load comments{{ error ? `: ${error}` : '' }}.
    </div>
    <template v-else>
      <CommentItem v-for="c in items" :key="c.id" :comment="c" />
      <div ref="sentinel" class="sentinel" />
      <div v-if="status === 'loadingMore'" class="state small">Loading more…</div>
      <div v-else-if="!hasMore && items.length > 0" class="state small">No more comments.</div>
    </template>
  </div>
</template>

<style scoped>
.comment-list {
  display: flex;
  flex-direction: column;
  padding: 0 16px 24px;
}
.state {
  padding: 24px 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  text-align: center;
}
.state.error { color: #ff8a8a; }
.state.small {
  padding: 12px 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
.sentinel { height: 1px; }
</style>
