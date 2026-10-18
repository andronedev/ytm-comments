<script setup lang="ts">
import type { SortKey } from '@/lib/types';
import { t } from '@/lib/i18n';

defineProps<{ sort: SortKey; disabled?: boolean }>();
const emit = defineEmits<{ change: [SortKey] }>();

const options: { key: SortKey; label: () => string }[] = [
  { key: 'top', label: () => t('sortTop') },
  { key: 'newest', label: () => t('sortNewest') },
];
</script>

<template>
  <div class="sort-menu" role="radiogroup" :aria-label="t('sortLabel')">
    <button
      v-for="o in options"
      :key="o.key"
      type="button"
      role="radio"
      :aria-checked="sort === o.key"
      :class="{ active: sort === o.key }"
      :disabled="disabled"
      @click="emit('change', o.key)"
    >{{ o.label() }}</button>
  </div>
</template>

<style scoped>
.sort-menu {
  display: inline-flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  padding: 3px;
}
.sort-menu button {
  appearance: none;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font: inherit;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 120ms, color 120ms;
}
.sort-menu button:hover:not(:disabled):not(.active) {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}
.sort-menu button.active {
  background: #fff;
  color: #0f0f0f;
}
.sort-menu button:focus-visible { outline: 2px solid #62b5ff; outline-offset: 1px; }
.sort-menu button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
