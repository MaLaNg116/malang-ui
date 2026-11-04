<script setup lang="ts">
import { computed } from 'vue';
import type { MSkeletonProps } from './types';

const props = withDefaults(defineProps<MSkeletonProps>(), { lines: 3 });
const count = computed(() => Math.min(12, Math.max(1, Math.floor(Number.isFinite(props.lines) ? props.lines : 3))));
</script>

<template>
  <div class="ui-skeleton" aria-hidden="true">
    <span v-for="line in count" :key="line" class="ui-skeleton__line" />
  </div>
</template>

<style scoped>
.ui-skeleton { display: grid; gap: var(--ui-space-3); min-width: 0; width: 100%; }
.ui-skeleton__line { display: block; width: 100%; height: var(--ui-font-size-body); background: var(--ui-color-wash); opacity: .75; animation: ui-skeleton-breathe 1800ms ease-in-out infinite; }
.ui-skeleton__line:nth-child(3n + 2) { width: 86%; }
.ui-skeleton__line:last-child:not(:first-child) { width: 68%; }
@keyframes ui-skeleton-breathe { 0%, 100% { opacity: .55; } 50% { opacity: .9; } }
:global([data-ui-motion='reduced'] .ui-skeleton__line) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-skeleton__line { animation: none; } }
@media (forced-colors: active) { .ui-skeleton__line { forced-color-adjust: none; background: GrayText; opacity: .25; animation: none; } }
</style>
