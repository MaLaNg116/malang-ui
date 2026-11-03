<script setup lang="ts">
import type { UiSpinnerProps } from './types';

withDefaults(defineProps<UiSpinnerProps>(), { label: '加载中', size: 'md' });
</script>

<template>
  <span class="ui-spinner" :class="`ui-spinner--${size}`" role="status" aria-live="polite" aria-atomic="true">
    <svg class="ui-spinner__visual" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M6 15V6h15m5 11v9H11M9 26l-3-3M23 6l3 3" />
      <path class="ui-spinner__core" d="M13 13h6v6h-6z" />
    </svg>
    <span class="ui-spinner__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.ui-spinner { --ui-spinner-size: 24px; display: inline-flex; align-items: center; justify-content: center; flex: none; width: var(--ui-spinner-size); height: var(--ui-spinner-size); color: var(--ui-color-accent); vertical-align: middle; }
.ui-spinner--sm { --ui-spinner-size: 16px; }
.ui-spinner--lg { --ui-spinner-size: 32px; }
.ui-spinner__visual { display: block; width: 100%; height: 100%; stroke: currentColor; stroke-width: 2; stroke-linecap: square; transform-origin: center; animation: ui-spinner-turn 1200ms linear infinite; }
.ui-spinner__core { fill: currentColor; stroke: none; opacity: .25; }
.ui-spinner__label { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@keyframes ui-spinner-turn { to { transform: rotate(360deg); } }
:global([data-ui-motion='reduced'] .ui-spinner__visual) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-spinner__visual { animation: none; } }
@media (forced-colors: active) { .ui-spinner { color: CanvasText; } }
</style>
