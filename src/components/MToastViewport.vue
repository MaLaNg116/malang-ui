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
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-3);
  width: min(388px, calc(100% - 24px));
  max-width: calc(100% - max(12px, env(safe-area-inset-left)) - max(12px, env(safe-area-inset-right)));
  max-height: calc(100vh - 24px);
  max-height: calc(100dvh - max(var(--ui-toast-top-offset, 12px), env(safe-area-inset-top)) - max(12px, env(safe-area-inset-bottom)));
  padding: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
  pointer-events: none;
}
.ui-toast-viewport--bottom-start, .ui-toast-viewport--bottom-center, .ui-toast-viewport--bottom-end { bottom: max(12px, env(safe-area-inset-bottom)); }
.ui-toast-viewport--top-start, .ui-toast-viewport--top-center, .ui-toast-viewport--top-end { top: max(var(--ui-toast-top-offset, 12px), env(safe-area-inset-top)); }
.ui-toast-viewport--top-end, .ui-toast-viewport--bottom-end { inset-inline-end: max(12px, env(safe-area-inset-right)); }
.ui-toast-viewport--top-start, .ui-toast-viewport--bottom-start { inset-inline-start: max(12px, env(safe-area-inset-left)); }
.ui-toast-viewport--top-center, .ui-toast-viewport--bottom-center { left: calc((100% + max(12px, env(safe-area-inset-left)) - max(12px, env(safe-area-inset-right))) / 2); transform: translateX(-50%); }
.ui-toast-viewport--top-center, .ui-toast-viewport--bottom-center { align-items: center; }
.ui-toast-viewport--top-start, .ui-toast-viewport--bottom-start { align-items: flex-start; }
.ui-toast-viewport--top-end, .ui-toast-viewport--bottom-end { align-items: flex-end; }
.ui-toast-viewport:dir(rtl).ui-toast-viewport--top-end, .ui-toast-viewport:dir(rtl).ui-toast-viewport--bottom-end { inset-inline-end: max(12px, env(safe-area-inset-left)); }
.ui-toast-viewport:dir(rtl).ui-toast-viewport--top-start, .ui-toast-viewport:dir(rtl).ui-toast-viewport--bottom-start { inset-inline-start: max(12px, env(safe-area-inset-right)); }
.ui-toast-viewport :deep(.ui-toast) { pointer-events: auto; }
</style>
