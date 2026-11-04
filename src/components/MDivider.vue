<script setup lang="ts">
import type { MDividerProps } from './types';

defineProps<MDividerProps>();
</script>

<template>
  <div class="ui-divider" :class="{ 'ui-divider--labelled': Boolean(label) }" role="separator" aria-orientation="horizontal" :aria-label="label || undefined">
    <span v-if="label" class="ui-divider__label" aria-hidden="true">{{ label }}</span>
  </div>
</template>

<style scoped>
.ui-divider { display: flex; align-items: center; gap: var(--ui-space-3); box-sizing: border-box; width: 100%; min-width: 0; min-height: 1px; color: var(--ui-color-text-secondary); margin-block: var(--ui-space-4); }
.ui-divider::before, .ui-divider--labelled::after { content: ''; flex: 1 1 0; min-width: var(--ui-space-4); border-top: 1px solid var(--ui-color-rule); }
.ui-divider__label { flex: 0 1 auto; min-width: 0; max-width: 75%; font: var(--ui-font-weight-body) var(--ui-font-size-caption)/1.6 var(--ui-font-family); letter-spacing: .04em; overflow-wrap: anywhere; text-align: center; }
@media (forced-colors: active) { .ui-divider::before, .ui-divider--labelled::after { border-color: CanvasText; } }
</style>
