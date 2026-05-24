<script setup lang="ts">
defineProps<{
  open: boolean;
  visible: boolean;
  title?: string;
}>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <transition name="drawer">
    <div v-if="visible && open" class="drawer-host">
      <div class="panel">
        <header class="panel-head">
          <div class="panel-title">{{ title || 'Comments' }}</div>
          <div class="panel-actions">
            <slot name="header-actions" />
            <button
              type="button"
              class="close-btn"
              aria-label="Close comments"
              title="Close"
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
      </div>
    </div>
  </transition>
</template>

<style scoped>
.drawer-host {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 72px;
  z-index: 1500;
  pointer-events: none;
  font-family: 'YouTube Sans', 'Roboto', system-ui, sans-serif;
  color: #fff;
}
.panel {
  pointer-events: auto;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: min(60vh, 720px);
  background: rgba(15, 15, 15, 0.97);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  gap: 12px;
}
.panel-title {
  font-size: 16px;
  font-weight: 600;
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
.panel-body {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
.panel-body::-webkit-scrollbar { width: 8px; }
.panel-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
}

.drawer-enter-active, .drawer-leave-active {
  transition: opacity 180ms ease-out;
}
.drawer-enter-active .panel,
.drawer-leave-active .panel {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.drawer-enter-from { opacity: 0; }
.drawer-enter-from .panel { transform: translateY(100%); }
.drawer-leave-to { opacity: 0; }
.drawer-leave-to .panel { transform: translateY(100%); }
</style>
