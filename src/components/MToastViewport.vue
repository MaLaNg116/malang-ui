<script setup lang="ts">
import type { MToastViewportProps } from './types';

withDefaults(defineProps<MToastViewportProps>(), {
  placement: 'bottom-end',
  label: '消息通知',
});
</script>

<template>
  <div class="ui-toast-viewport" :class="`ui-toast-viewport--${placement}`" role="region" :aria-label="label"><slot /></div>
</template>

<style scoped>
.ui-toast-viewport {
  box-sizing: border-box;
  position: fixed;
  z-index: var(--ui-z-index-toast, 1000);
  inset-inline-end: max(12px, env(safe-area-inset-right));
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-3);
  width: min(388px, calc(100vw - 24px));
  max-width: calc(100vw - max(12px, env(safe-area-inset-left)) - max(12px, env(safe-area-inset-right)));
  max-height: calc(100vh - 24px);
  max-height: calc(100dvh - max(12px, env(safe-area-inset-top)) - max(12px, env(safe-area-inset-bottom)));
  padding: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
  pointer-events: none;
}
.ui-toast-viewport--bottom-end { bottom: max(12px, env(safe-area-inset-bottom)); }
.ui-toast-viewport--top-end { top: max(12px, env(safe-area-inset-top)); }
.ui-toast-viewport :deep(.ui-toast) { pointer-events: auto; }
</style>
