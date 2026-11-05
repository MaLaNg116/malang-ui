<script setup lang="ts">
import { mIconPaths, type MIconName } from './icons';
defineProps<{ name?: MIconName; size?: string | number; color?: string; label?: string; spin?: boolean }>();
</script>
<template><svg class="ui-icon" :class="{ 'ui-icon--spin': spin }" :width="size ?? '1em'" :height="size ?? '1em'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" :style="{ color }" :role="label ? 'img' : undefined" :aria-label="label" :aria-hidden="label ? undefined : true" focusable="false"><slot><path v-if="name" :d="mIconPaths[name]" /></slot></svg></template>
<style scoped>
.ui-icon { display: inline-block; flex: none; vertical-align: -.125em; stroke-linecap: square; stroke-linejoin: miter; }.ui-icon--spin { animation: ui-icon-turn 1s linear infinite; }@keyframes ui-icon-turn { to { transform: rotate(360deg); } }:global([data-ui-motion='reduced'] .ui-icon--spin) { animation: none; }@media (prefers-reduced-motion: reduce) { .ui-icon--spin { animation: none; } }
</style>
