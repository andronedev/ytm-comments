<script setup lang="ts">
import { ref } from 'vue';
import CommentCard from './CommentCard.vue';
import ReplyList from './ReplyList.vue';
import type { Comment } from '@/lib/types';
import { tCount, t } from '@/lib/i18n';

defineProps<{ comment: Comment }>();
const expanded = ref(false);
</script>

<template>
  <CommentCard :item="comment">
    <template #actions>
      <button
        v-if="comment.replyCount > 0 && comment.replyContinuation"
        type="button"
        class="replies-toggle"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" :class="{ open: expanded }">
          <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
        {{ expanded ? t('hideReplies') : tCount('replies', comment.replyCount, comment.replyCountText) }}
      </button>
    </template>
    <ReplyList
      v-if="expanded && comment.replyContinuation"
      :comment-id="comment.id"
      :initial-token="comment.replyContinuation"
    />
  </CommentCard>
</template>

<style scoped>
.replies-toggle {
  appearance: none;
  background: transparent;
  border: 0;
  color: #62b5ff;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px 6px 8px;
  margin-left: -8px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.replies-toggle:hover { background: rgba(98, 181, 255, 0.12); }
.replies-toggle:focus-visible { outline: 2px solid #62b5ff; }
.replies-toggle svg { transition: transform 150ms; }
.replies-toggle svg.open { transform: rotate(180deg); }
</style>
