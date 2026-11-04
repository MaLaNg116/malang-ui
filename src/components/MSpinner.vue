<script setup lang="ts">
import type { MSpinnerProps } from './types';

withDefaults(defineProps<MSpinnerProps>(), { label: '加载中', size: 'md' });
</script>

<template>
  <span class="ui-spinner" :class="`ui-spinner--${size}`" role="status" aria-live="polite" aria-atomic="true">
    <svg class="ui-spinner__visual" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <g class="ui-spinner__assembly">
        <g class="ui-spinner__arm" transform="rotate(0 24 24)"><g class="ui-spinner__segment"><path d="M9 21v-9l3-3h10v6h-7v6z" /></g></g>
        <g class="ui-spinner__arm" transform="rotate(90 24 24)"><g class="ui-spinner__segment ui-spinner__segment--second"><path d="M9 21v-9l3-3h10v6h-7v6z" /></g></g>
        <g class="ui-spinner__arm" transform="rotate(180 24 24)"><g class="ui-spinner__segment ui-spinner__segment--third"><path d="M9 21v-9l3-3h10v6h-7v6z" /></g></g>
        <g class="ui-spinner__arm" transform="rotate(270 24 24)"><g class="ui-spinner__segment ui-spinner__segment--fourth"><path d="M9 21v-9l3-3h10v6h-7v6z" /></g></g>
        <g class="ui-spinner__core"><path d="m20 19 3-3h5v5h-5l-3 3zm8 10-3 3h-5v-5h5l3-3z" /></g>
      </g>
    </svg>
    <span class="ui-spinner__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.ui-spinner { --ui-spinner-size: 24px; position: relative; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; flex: none; width: var(--ui-spinner-size); height: var(--ui-spinner-size); color: var(--ui-spinner-color, var(--ui-color-accent)); vertical-align: middle; }
.ui-spinner--sm { --ui-spinner-size: 16px; }
.ui-spinner--lg { --ui-spinner-size: 32px; }
.ui-spinner__visual { display: block; width: 100%; height: 100%; overflow: visible; fill: currentColor; }
.ui-spinner__assembly, .ui-spinner__segment, .ui-spinner__core { transform-box: view-box; transform-origin: 50% 50%; }
.ui-spinner__assembly { animation: ui-spinner-orbit 4800ms linear infinite; }
.ui-spinner__segment { animation: ui-spinner-release 2400ms var(--ui-motion-ease-emphasized) infinite; }
.ui-spinner__segment--second { animation-delay: 100ms; }
.ui-spinner__segment--third { animation-delay: 200ms; }
.ui-spinner__segment--fourth { animation-delay: 300ms; }
.ui-spinner__core { color: var(--ui-spinner-secondary-color, var(--ui-color-secondary-accent)); fill: currentColor; animation: ui-spinner-counter 2400ms var(--ui-motion-ease-emphasized) infinite; }
.ui-spinner__label { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@keyframes ui-spinner-orbit { to { transform: rotate(360deg); } }
/* The last corner returns by 1.7s, leaving a shared lock before the next release. */
@keyframes ui-spinner-release { 0%, 12%, 58%, 100% { transform: translate(0, 0) rotate(0deg); } 28%, 38% { transform: translate(-2px, -2px) rotate(-10deg); } }
/* Two identical opposing teeth make the 180deg reset visually continuous. */
@keyframes ui-spinner-counter { 0%, 14% { transform: rotate(0deg); } 45%, 100% { transform: rotate(-180deg); } }
:global([data-ui-motion='reduced'] .ui-spinner__assembly), :global([data-ui-motion='reduced'] .ui-spinner__segment), :global([data-ui-motion='reduced'] .ui-spinner__core) { animation: none; transform: none; }
@media (prefers-reduced-motion: reduce) { .ui-spinner__assembly, .ui-spinner__segment, .ui-spinner__core { animation: none; transform: none; } }
@media (forced-colors: active) { .ui-spinner, .ui-spinner__core { color: CanvasText; } .ui-spinner__assembly, .ui-spinner__segment, .ui-spinner__core { animation: none; transform: none; } }
</style>
