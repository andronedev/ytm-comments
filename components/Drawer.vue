<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { t } from '@/lib/i18n';

const props = defineProps<{
  open: boolean;
  visible: boolean;
  /** Distance from the bottom of the viewport (player bar height). */
  bottom: number;
  /** Panel height in px, null = default. */
  height: number | null;
  subtitle?: string | null;
}>();
const emit = defineEmits<{ close: []; resize: [number] }>();

const MIN_HEIGHT = 240;
const dir = t('@@bidi_dir') === 'rtl' ? 'rtl' : 'ltr';
const panel = ref<HTMLElement | null>(null);
const dragging = ref(false);

const maxHeight = () => Math.max(MIN_HEIGHT, window.innerHeight - props.bottom - 64);
const panelStyle = computed(() =>
  props.height ? { height: `${Math.min(Math.max(props.height, MIN_HEIGHT), maxHeight())}px` } : {},
);

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !props.open || !props.visible) return;
  // YT Music binds Escape to "close player page"; keep it for us.
  event.stopPropagation();
  event.preventDefault();
  emit('close');
}

function startResize(event: PointerEvent) {
  if (!panel.value) return;
  event.preventDefault();
  const startY = event.clientY;
  const startHeight = panel.value.getBoundingClientRect().height;
  dragging.value = true;
  const move = (e: PointerEvent) => {
    const next = Math.min(Math.max(startHeight + (startY - e.clientY), MIN_HEIGHT), maxHeight());
    panel.value!.style.height = `${next}px`;
  };
  const up = () => {
    dragging.value = false;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    if (panel.value) emit('resize', Math.round(panel.value.getBoundingClientRect().height));
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

watch(
  () => props.open && props.visible,
  async (shown) => {
    if (shown) {
      window.addEventListener('keydown', onKeydown, true);
      await nextTick();
      panel.value?.focus({ preventScroll: true });
    } else {
      window.removeEventListener('keydown', onKeydown, true);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true));
</script>

<template>
  <transition name="drawer">
    <div v-if="visible && open" class="drawer-host" :dir="dir" :style="{ bottom: `${bottom}px` }">
      <section
        ref="panel"
        class="panel"
        :class="{ dragging }"
        :style="panelStyle"
        role="dialog"
        :aria-label="t('drawerTitle')"
        tabindex="-1"
      >
        <div
          class="resize-handle"
          role="separator"
          aria-orientation="horizontal"
          :title="t('resizeHint')"
          @pointerdown="startResize"
        >
          <span />
        </div>
        <header class="panel-head">
          <div class="panel-title">
            <h2>{{ t('drawerTitle') }}</h2>
            <span v-if="subtitle" class="count">{{ subtitle }}</span>
          </div>
          <div class="panel-actions">
            <slot name="header-actions" />
            <button
              type="button"
              class="close-btn"
              :aria-label="t('close')"
              :title="`${t('close')} (Esc)`"
              @click="emit('close')"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.4 6.3 6.3-6.3 6.3 1.4 1.4 6.3-6.3 6.3 6.3 1.4-1.4-6.3-6.3 6.3-6.3z"/>
              </svg>
            </button>
          </div>
        </header>
        <div class="panel-body">
          <slot />
        </div>
      </section>
    </div>
  </transition>
</template>

<style scoped>
.drawer-host {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 1500;
  pointer-events: none;
  font-family: 'YouTube Sans', 'Roboto', system-ui, sans-serif;
  color: #fff;
}
.panel {
  pointer-events: auto;
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(100%, 960px);
  height: min(60vh, 720px);
  background: rgba(18, 18, 18, 0.97);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 0;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  outline: none;
}
.panel.dragging { user-select: none; }
.resize-handle {
  flex: 0 0 auto;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ns-resize;
  touch-action: none;
}
.resize-handle span {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  transition: background 120ms;
}
.resize-handle:hover span,
.panel.dragging .resize-handle span { background: rgba(255, 255, 255, 0.45); }
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 16px 12px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  gap: 12px;
}
.panel-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.panel-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
}
.panel-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.close-btn {
  appearance: none;
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.75);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 120ms, color 120ms;
}
.close-btn:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
.close-btn:focus-visible { outline: 2px solid #62b5ff; outline-offset: 2px; }
.panel-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.drawer-enter-active, .drawer-leave-active {
  transition: opacity 180ms ease-out;
}
.drawer-enter-active .panel,
.drawer-leave-active .panel {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .panel, .drawer-leave-to .panel { transform: translate(-50%, 100%); }

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active, .drawer-leave-active,
  .drawer-enter-active .panel, .drawer-leave-active .panel { transition: none; }
}
</style>
