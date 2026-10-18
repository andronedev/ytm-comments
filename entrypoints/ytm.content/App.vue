<script setup lang="ts">
import { computed, inject, provide, ref, watch } from 'vue';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { storage } from '#imports';
import Drawer from '@/components/Drawer.vue';
import CommentList from '@/components/CommentList.vue';
import SortMenu from '@/components/SortMenu.vue';
import { useNowPlaying } from '@/composables/useNowPlaying';
import { useComments } from '@/composables/useComments';
import { useReplies } from '@/composables/useReplies';
import { playerBarHeight, usePlayerBarButton } from '@/composables/usePlayerBarButton';

const ctx = inject<ContentScriptContext>('ctx')!;
const { videoId } = useNowPlaying(ctx);
const hasTrack = computed(() => !!videoId.value);

const open = ref(false);
const { state, loadMore, setSort, retry } = useComments(videoId, open);
const replies = useReplies();
provide('videoId', videoId);

watch(videoId, () => replies.reset());

// Keep the drawer glued to the top of the player bar, whatever its height.
const bottom = ref(72);
function measure() {
  bottom.value = playerBarHeight();
}
watch(open, (o) => o && measure());
ctx.addEventListener(window, 'resize', measure);

// Remember the height the user dragged the drawer to.
const heightItem = storage.defineItem<number | null>('local:drawerHeight', { fallback: null });
const height = ref<number | null>(null);
void heightItem.getValue().then((v) => (height.value = v)).catch(() => {});
function onResize(h: number) {
  height.value = h;
  void heightItem.setValue(h).catch(() => {});
}

usePlayerBarButton(open, hasTrack, () => {
  open.value = !open.value;
});
</script>

<template>
  <Drawer
    :open="open"
    :visible="hasTrack"
    :bottom="bottom"
    :height="height"
    :subtitle="state.totalCount"
    @close="open = false"
    @resize="onResize"
  >
    <template #header-actions>
      <SortMenu
        :sort="state.sort"
        :disabled="state.status === 'loading' || state.status === 'disabled' || !state.newestToken"
        @change="setSort"
      />
    </template>
    <CommentList
      :items="state.items"
      :status="state.status"
      :error="state.error"
      :has-more="!!state.nextPageToken"
      :more-failed="state.moreFailed"
      @load-more="loadMore"
      @retry="retry"
    />
  </Drawer>
</template>
