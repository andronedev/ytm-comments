<script setup lang="ts">
import { onMounted } from 'vue';
import { useReplies } from '@/composables/useReplies';

const props = defineProps<{ commentId: string; initialToken: string }>();
const replies = useReplies();

onMounted(() => {
  void replies.load(props.commentId, props.initialToken);
});

function thread() {
  return replies.get(props.commentId);
}
</script>

<template>
  <div class="reply-list">
    <div v-if="thread().status === 'loading'" class="state">Loading replies…</div>
    <div v-else-if="thread().status === 'error'" class="state error">
      Couldn't load replies: {{ thread().error }}
    </div>
    <template v-else>
      <div v-for="r in thread().items" :key="r.id" class="reply">
        <img v-if="r.authorAvatar" :src="r.authorAvatar" :alt="r.author" class="avatar" />
        <div class="body">
          <div class="head">
            <span class="author">{{ r.author }}</span>
            <span class="time">{{ r.publishedTime }}</span>
          </div>
          <div class="text">{{ r.body }}</div>
          <div class="meta">
            <span class="likes">♥ {{ r.likeCount }}</span>
          </div>
        </div>
      </div>
      <button
        v-if="thread().nextPageToken"
        type="button"
        class="more"
        :disabled="thread().status === 'loadingMore'"
        @click="replies.loadMore(commentId)"
      >
        {{ thread().status === 'loadingMore' ? 'Loading…' : 'Show more replies' }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.reply-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0 0 48px;
  border-left: 2px solid rgba(255, 255, 255, 0.05);
  margin-left: 18px;
}
.state {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  padding: 4px 0;
}
.state.error { color: #ff8a8a; }
.reply {
  display: flex;
  gap: 10px;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}
.body { flex: 1; min-width: 0; }
.head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 12px;
}
.author { font-weight: 600; color: #fff; }
.time { color: rgba(255, 255, 255, 0.5); }
.text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.45;
  white-space: pre-wrap;
  margin-top: 2px;
  word-break: break-word;
}
.meta {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}
.more {
  align-self: flex-start;
  background: transparent;
  border: 0;
  color: #62b5ff;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 0;
  cursor: pointer;
}
.more:hover:not(:disabled) { text-decoration: underline; }
</style>
