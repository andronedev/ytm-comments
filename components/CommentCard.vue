<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import RichText from './RichText.vue';
import type { Comment, Reply } from '@/lib/types';
import { t } from '@/lib/i18n';

const props = defineProps<{ item: Reply | Comment; compact?: boolean }>();

const pinnedText = 'pinnedText' in props.item ? props.item.pinnedText : null;
const avatarFailed = ref(false);

// Long comments are clamped to a few lines with a "Read more" toggle.
const textEl = ref<HTMLElement | null>(null);
const clamped = ref(true);
const overflowing = ref(false);

onMounted(async () => {
  await nextTick();
  const el = textEl.value;
  if (el) overflowing.value = el.scrollHeight > el.clientHeight + 2;
});

const initial = (props.item.author.name.replace(/^@/, '')[0] ?? '?').toUpperCase();
</script>

<template>
  <article class="card" :class="{ compact, pinned: !!pinnedText }">
    <a
      class="avatar-link"
      :href="item.author.channelUrl ?? undefined"
      target="_blank"
      rel="noopener noreferrer"
      tabindex="-1"
      aria-hidden="true"
    >
      <img
        v-if="item.author.avatar && !avatarFailed"
        :src="item.author.avatar"
        alt=""
        class="avatar"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="avatarFailed = true"
      />
      <span v-else class="avatar avatar-placeholder">{{ initial }}</span>
    </a>
    <div class="body">
      <div v-if="pinnedText" class="pinned-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16 3v2h-1v6l2 3v2h-4.5v5L12 22l-.5-1v-5H7v-2l2-3V5H8V3h8z"/>
        </svg>
        {{ pinnedText }}
      </div>
      <div class="head">
        <a
          class="author"
          :class="{ creator: item.author.isCreator }"
          :href="item.author.channelUrl ?? undefined"
          target="_blank"
          rel="noopener noreferrer"
        >{{ item.author.name }}</a>
        <svg
          v-if="item.author.isVerified || item.author.isArtist"
          class="badge"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          :aria-label="item.author.isArtist ? t('officialArtist') : t('verified')"
          role="img"
        >
          <title>{{ item.author.isArtist ? t('officialArtist') : t('verified') }}</title>
          <path v-if="item.author.isArtist" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          <path v-else d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM9.8 17.3l-4.2-4.1L7 11.8l2.8 2.7L17 7.4l1.4 1.4-8.6 8.5z"/>
        </svg>
        <span class="time">{{ item.publishedTime }}</span>
      </div>
      <div ref="textEl" class="text" :class="{ clamped: clamped }"><RichText :runs="item.runs" /></div>
      <button
        v-if="overflowing"
        type="button"
        class="read-more"
        @click="clamped = !clamped"
      >{{ clamped ? t('readMore') : t('showLess') }}</button>
      <div class="meta">
        <span class="likes" :title="t('likes')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.77 11h-4.23l1.52-4.94C16.38 5.03 15.54 4 14.38 4c-.58 0-1.14.24-1.52.65L7 11H3v10h4h1h9.43c1.06 0 1.98-.67 2.19-1.61l1.34-6C21.23 12.15 20.18 11 18.77 11zM7 20H4v-8h3V20zM19.98 13.17l-1.34 6C18.54 19.65 18.03 20 17.43 20H8v-8.61l5.6-6.06C13.79 5.12 14.08 5 14.38 5c.26 0 .5.11.63.3.07.1.15.26.09.47l-1.52 4.94L13.18 12h1.35h4.23c.41 0 .8.17 1.03.46.13.15.26.4.19.71z"/>
          </svg>
          <span v-if="item.likeCount">{{ item.likeCount }}</span>
        </span>
        <span v-if="item.isHearted" class="hearted" :title="t('heartedByCreator')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4e45" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </span>
        <slot name="actions" />
      </div>
      <slot />
    </div>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  gap: 14px;
  padding: 14px 8px;
}
.card.compact { gap: 10px; padding: 8px 0; }
.card.pinned {
  background: rgba(255, 255, 255, 0.035);
  border-radius: 12px;
  padding: 14px 12px;
}
.avatar-link { flex-shrink: 0; }
.avatar {
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.08);
}
.compact .avatar { width: 28px; height: 28px; }
.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}
.compact .avatar-placeholder { font-size: 12px; }
.body { flex: 1; min-width: 0; }
.pinned-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}
.head {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  flex-wrap: wrap;
}
.compact .head { font-size: 12px; }
.author {
  font-weight: 600;
  color: #fff;
  text-decoration: none;
}
.author:hover { text-decoration: underline; }
.author.creator {
  background: rgba(255, 255, 255, 0.14);
  padding: 1px 8px;
  border-radius: 999px;
}
.badge { color: rgba(255, 255, 255, 0.6); flex-shrink: 0; }
.time { color: rgba(255, 255, 255, 0.5); font-size: 12px; }
.text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.5;
  white-space: pre-wrap;
  margin-top: 4px;
  overflow-wrap: anywhere;
}
.compact .text { font-size: 13px; line-height: 1.45; margin-top: 2px; }
.text.clamped {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.read-more {
  appearance: none;
  background: none;
  border: 0;
  padding: 2px 0 0;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}
.read-more:hover { color: #fff; }
.meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
.compact .meta { margin-top: 4px; font-size: 11px; }
.likes, .hearted {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
