<script setup lang="ts">
import { computed, onMounted } from 'vue';
import CommentCard from './CommentCard.vue';
import { useReplies } from '@/composables/useReplies';
import { t } from '@/lib/i18n';

const props = defineProps<{ commentId: string; initialToken: string }>();
const replies = useReplies();
const thread = computed(() => replies.get(props.commentId));

onMounted(() => {
  void replies.load(props.commentId, props.initialToken);
});
</script>

<template>
  <div class="reply-list">
    <CommentCard v-for="r in thread.items" :key="r.id" :item="r" compact />
    <div v-if="thread.status === 'loading'" class="state">{{ t('loadingReplies') }}</div>
    <div v-else-if="thread.status === 'error'" class="state error">
      {{ t('repliesError') }}
      <button type="button" class="more" @click="replies.retry(commentId)">{{ t('retry') }}</button>
    </div>
    <button
      v-else-if="thread.nextPageToken"
      type="button"
      class="more"
      :disabled="thread.status === 'loadingMore'"
      @click="replies.loadMore(commentId)"
    >
      {{ thread.status === 'loadingMore' ? t('loading') : t('moreReplies') }}
    </button>
  </div>
</template>

<style scoped>
.reply-list {
  display: flex;
  flex-direction: column;
  padding: 4px 0 0;
}
.state {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  padding: 6px 0;
}
.state.error { color: #ff8a8a; }
.more {
  align-self: flex-start;
  background: transparent;
  border: 0;
  color: #62b5ff;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 0;
  cursor: pointer;
}
.more:hover:not(:disabled) { text-decoration: underline; }
.more:disabled { opacity: 0.6; cursor: default; }
</style>
