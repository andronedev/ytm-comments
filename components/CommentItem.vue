<script setup lang="ts">
import { ref } from 'vue';
import ReplyList from './ReplyList.vue';
import type { Comment } from '@/lib/types';

const props = defineProps<{ comment: Comment }>();
const expanded = ref(false);

function toggle() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <article class="comment" :class="{ pinned: comment.isPinned }">
    <img v-if="comment.authorAvatar" :src="comment.authorAvatar" :alt="comment.author" class="avatar" />
    <div v-else class="avatar avatar-placeholder" />
    <div class="body">
      <div class="head">
        <span v-if="comment.isPinned" class="pin" title="Pinned">📌</span>
        <span class="author">{{ comment.author }}</span>
        <span class="time">{{ comment.publishedTime }}</span>
      </div>
      <div class="text">{{ comment.body }}</div>
      <div class="meta">
        <span class="likes">♥ {{ comment.likeCount }}</span>
        <span v-if="comment.isHearted" class="hearted" title="Hearted by creator">💗</span>
        <button
          v-if="comment.replyCount > 0 && comment.replyContinuation"
          type="button"
          class="replies-toggle"
          @click="toggle"
        >
          {{ expanded ? 'Hide' : 'Show' }}
          {{ comment.replyCount }}
          {{ comment.replyCount === 1 ? 'reply' : 'replies' }}
        </button>
      </div>
      <ReplyList
        v-if="expanded && comment.replyContinuation"
        :comment-id="comment.id"
        :initial-token="comment.replyContinuation"
      />
    </div>
  </article>
</template>

<style scoped>
.comment {
  display: flex;
  gap: 12px;
  padding: 14px 4px;
}
.comment.pinned {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 14px 12px;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}
.avatar-placeholder { background: rgba(255, 255, 255, 0.1); }
.body { flex: 1; min-width: 0; }
.head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 13px;
}
.pin { font-size: 11px; }
.author { font-weight: 600; color: #fff; }
.time { color: rgba(255, 255, 255, 0.5); font-size: 12px; }
.text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.5;
  white-space: pre-wrap;
  margin-top: 4px;
  word-break: break-word;
}
.meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
.replies-toggle {
  appearance: none;
  background: transparent;
  border: 0;
  color: #62b5ff;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  margin-left: -8px;
  border-radius: 999px;
  cursor: pointer;
}
.replies-toggle:hover {
  background: rgba(98, 181, 255, 0.12);
}
</style>
