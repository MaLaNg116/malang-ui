<script setup lang="ts">
import type { MSpinnerProps } from './types';

withDefaults(defineProps<MSpinnerProps>(), { label: '加载中', size: 'md' });
</script>

<template>
  <span class="ui-spinner" :class="`ui-spinner--${size}`" role="status" aria-live="polite" aria-atomic="true">
    <svg class="ui-spinner__visual" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <g class="ui-spinner__assembly">
        <g class="ui-spinner__arm" transform="rotate(0 24 24)"><g class="ui-spinner__blade ui-spinner__blade--lead"><path d="M22 8h6l5 8-4 6-4-2-5-7z" /></g></g>
        <g class="ui-spinner__arm" transform="rotate(120 24 24)"><g class="ui-spinner__blade ui-spinner__blade--second"><path d="M22 8h6l5 8-4 6-4-2-5-7z" /></g></g>
        <g class="ui-spinner__arm" transform="rotate(240 24 24)"><g class="ui-spinner__blade ui-spinner__blade--third"><path d="M22 8h6l5 8-4 6-4-2-5-7z" /></g></g>
      </g>
      <circle class="ui-spinner__pin" cx="24" cy="24" r="2.2" />
    </svg>
    <span class="ui-spinner__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.ui-spinner { --ui-spinner-size: 24px; position: relative; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; flex: none; width: var(--ui-spinner-size); height: var(--ui-spinner-size); color: var(--ui-spinner-color, var(--ui-color-accent)); vertical-align: middle; }
.ui-spinner--sm { --ui-spinner-size: 16px; }
.ui-spinner--lg { --ui-spinner-size: 32px; }
.ui-spinner__visual { display: block; width: 100%; height: 100%; overflow: visible; fill: currentColor; }
.ui-spinner__assembly, .ui-spinner__blade { transform-box: view-box; transform-origin: 50% 50%; }
.ui-spinner__assembly { animation: ui-spinner-orbit 2100ms linear infinite; }
.ui-spinner__blade { animation: ui-spinner-open 2100ms var(--ui-motion-ease-standard) infinite; }
.ui-spinner__blade--second { color: var(--ui-spinner-secondary-color, currentColor); fill: currentColor; opacity: .72; animation-delay: -700ms; }
.ui-spinner__blade--third { opacity: .46; animation-delay: -1400ms; }
.ui-spinner__pin { opacity: .4; }
.ui-spinner__label { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@keyframes ui-spinner-orbit { to { transform: rotate(360deg); } }
@keyframes ui-spinner-open { 0%, 12% { transform: translateY(0) rotate(0deg); } 30% { transform: translateY(-1.8px) rotate(-6deg); } 46%, 100% { transform: translateY(0) rotate(0deg); } }
:global([data-ui-motion='reduced'] .ui-spinner__assembly), :global([data-ui-motion='reduced'] .ui-spinner__blade) { animation: none; transform: none; }
@media (prefers-reduced-motion: reduce) { .ui-spinner__assembly, .ui-spinner__blade { animation: none; transform: none; } }
@media (forced-colors: active) { .ui-spinner, .ui-spinner__blade--second { color: CanvasText; } .ui-spinner__assembly, .ui-spinner__blade { animation: none; transform: none; } .ui-spinner__blade, .ui-spinner__pin { opacity: 1; } }
</style>
