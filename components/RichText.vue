<script setup lang="ts">
import { inject, type Ref } from 'vue';
import type { TextRun } from '@/lib/types';
import { t } from '@/lib/i18n';

defineProps<{ runs: TextRun[] }>();
const currentVideoId = inject<Ref<string>>('videoId');

function seekable(run: Extract<TextRun, { kind: 'timestamp' }>): boolean {
  return !run.videoId || run.videoId === currentVideoId?.value;
}

function seek(seconds: number) {
  const video = document.querySelector<HTMLVideoElement>('#movie_player video, video.html5-main-video');
  if (!video) return;
  video.currentTime = seconds;
  if (video.paused) void video.play().catch(() => {});
}
</script>

<template>
  <template v-for="(run, i) in runs" :key="i">
    <button
      v-if="run.kind === 'timestamp' && seekable(run)"
      type="button"
      class="ts"
      :title="t('seekTo', run.text)"
      @click="seek(run.seconds)"
    >{{ run.text }}</button>
    <a
      v-else-if="run.kind === 'link' || run.kind === 'timestamp'"
      class="link"
      :href="run.kind === 'link' ? run.url : `https://www.youtube.com/watch?v=${run.videoId}&t=${run.seconds}s`"
      target="_blank"
      rel="noopener noreferrer"
    >{{ run.text }}</a>
    <template v-else>{{ run.text }}</template>
  </template>
</template>

<style scoped>
.ts, .link {
  color: #62b5ff;
  text-decoration: none;
}
.ts {
  appearance: none;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
}
.ts:hover, .link:hover { text-decoration: underline; }
</style>
