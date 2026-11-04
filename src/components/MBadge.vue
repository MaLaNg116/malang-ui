<script setup lang="ts">
import type { MBadgeProps } from './types';

withDefaults(defineProps<MBadgeProps>(), { tone: 'neutral' });
</script>

<template>
  <span class="ui-badge" :class="`ui-badge--${tone}`"><slot /></span>
</template>

<style scoped>
.ui-badge {
  --ui-badge-tone: var(--ui-color-text-secondary);
  display: inline-flex;
  align-items: baseline;
  gap: var(--ui-space-2);
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  padding: 3px var(--ui-space-2);
  border: 1px solid color-mix(in srgb, var(--ui-badge-tone) 42%, transparent);
  border-radius: 0;
  background: color-mix(in srgb, var(--ui-badge-tone) 7%, var(--ui-color-surface));
  color: var(--ui-badge-tone);
  font: var(--ui-font-weight-emphasis) var(--ui-font-size-caption)/1.5 var(--ui-font-family);
  overflow-wrap: anywhere;
  vertical-align: middle;
}
.ui-badge::before { content: ''; flex: none; width: 4px; height: 4px; background: currentColor; align-self: center; }
.ui-badge--info { --ui-badge-tone: var(--ui-color-info); }
.ui-badge--success { --ui-badge-tone: var(--ui-color-success); }
.ui-badge--warning { --ui-badge-tone: var(--ui-color-warning, var(--ui-color-text)); }
.ui-badge--error { --ui-badge-tone: var(--ui-color-danger); }
@media (forced-colors: active) { .ui-badge { border-color: CanvasText; } .ui-badge::before { background: CanvasText; } }
</style>
