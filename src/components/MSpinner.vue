<script setup lang="ts">
import type { MSpinnerProps } from './types';

withDefaults(defineProps<MSpinnerProps>(), { label: '加载中', size: 'md' });
</script>

<template>
  <span class="ui-spinner" :class="`ui-spinner--${size}`" role="status" aria-live="polite" aria-atomic="true">
    <svg class="ui-spinner__visual" viewBox="0 0 56 56" fill="none" aria-hidden="true" focusable="false">
      <g class="ui-spinner__assembly">
        <g class="ui-spinner__arm" transform="rotate(0 28 28)"><g class="ui-spinner__segment"><path d="M14 25v-8l3-3h9v3.5h-7.5l-1 1v6.5z" /></g></g>
        <g class="ui-spinner__arm" transform="rotate(90 28 28)"><g class="ui-spinner__segment ui-spinner__segment--second"><path d="M14 25v-8l3-3h9v3.5h-7.5l-1 1v6.5z" /></g></g>
        <g class="ui-spinner__arm" transform="rotate(180 28 28)"><g class="ui-spinner__segment ui-spinner__segment--third"><path d="M14 25v-8l3-3h9v3.5h-7.5l-1 1v6.5z" /></g></g>
        <g class="ui-spinner__arm" transform="rotate(270 28 28)"><g class="ui-spinner__segment ui-spinner__segment--fourth"><path d="M14 25v-8l3-3h9v3.5h-7.5l-1 1v6.5z" /></g></g>
        <g class="ui-spinner__core"><path d="M24 23l3-3h5v3h-4l-4 4zM32 33l-3 3h-5v-3h4l4-4z" /></g>
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
.ui-spinner__assembly { animation: ui-spinner-orbit 5400ms linear infinite; }
.ui-spinner__segment { animation: ui-spinner-release 5400ms cubic-bezier(.45, 0, .55, 1) infinite; }
.ui-spinner__segment--second { animation-delay: -80ms; }
.ui-spinner__segment--third { animation-delay: -160ms; }
.ui-spinner__segment--fourth { animation-delay: -240ms; }
.ui-spinner__core { color: var(--ui-spinner-secondary-color, var(--ui-color-secondary-accent)); fill: currentColor; animation: ui-spinner-counter 1800ms linear infinite; }
.ui-spinner__label { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
/* The three turns vary their pace but meet with equal, nonzero angular velocity. */
@keyframes ui-spinner-orbit {
  0% { transform: rotate(0deg); animation-timing-function: cubic-bezier(.45, .15, .55, .85); }
  33.333333% { transform: rotate(360deg); animation-timing-function: cubic-bezier(.6, .2, .4, .8); }
  66.666667% { transform: rotate(720deg); animation-timing-function: cubic-bezier(.35, .116666667, .65, .883333333); }
  100% { transform: rotate(1080deg); }
}
@keyframes ui-spinner-release {
  0%, 30%, 63%, 100% { transform: translate(0, 0) rotate(0deg); }
  12% { transform: translate(-3.2px, -3.2px) rotate(-8deg); }
  45% { transform: translate(-4.8px, -4.8px) rotate(-14deg); }
  82% { transform: translate(-3.8px, -3.8px) rotate(-10deg); }
}
/* Two identical opposing teeth make the 180deg reset visually continuous. */
@keyframes ui-spinner-counter { to { transform: rotate(-180deg); } }
:global([data-ui-motion='reduced'] .ui-spinner__assembly), :global([data-ui-motion='reduced'] .ui-spinner__segment), :global([data-ui-motion='reduced'] .ui-spinner__core) { animation: none; transform: none; }
@media (prefers-reduced-motion: reduce) { .ui-spinner__assembly, .ui-spinner__segment, .ui-spinner__core { animation: none; transform: none; } }
@media (forced-colors: active) { .ui-spinner, .ui-spinner__core { color: CanvasText; } .ui-spinner__assembly, .ui-spinner__segment, .ui-spinner__core { animation: none; transform: none; } }
</style>
