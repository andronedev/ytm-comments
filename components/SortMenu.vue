<script setup lang="ts">
import type { SortKey } from '@/lib/types';

defineProps<{ sort: SortKey; disabled?: boolean }>();
const emit = defineEmits<{ change: [SortKey] }>();
</script>

<template>
  <div class="sort-menu" role="tablist">
    <button
      type="button"
      role="tab"
      :aria-selected="sort === 'top'"
      :class="{ active: sort === 'top' }"
      :disabled="disabled"
      @click="emit('change', 'top')"
    >Top</button>
    <button
      type="button"
      role="tab"
      :aria-selected="sort === 'newest'"
      :class="{ active: sort === 'newest' }"
      :disabled="disabled"
      @click="emit('change', 'newest')"
    >Newest</button>
  </div>
</template>

<style scoped>
.sort-menu {
  display: inline-flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 999px;
  padding: 4px;
}
.sort-menu button {
  appearance: none;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font: inherit;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 120ms, color 120ms;
}
.sort-menu button:hover:not(:disabled) {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}
.sort-menu button.active {
  background: #fff;
  color: #000;
}
.sort-menu button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
