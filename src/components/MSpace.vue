<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import type { MSpaceProps } from './types';

const props = withDefaults(defineProps<MSpaceProps>(), { direction: 'horizontal', size: 'md', align: 'center', wrap: true, inline: false });
const layout = computed<CSSProperties>(() => {
  const gap = typeof props.size === 'number'
    ? Number.isFinite(props.size) && props.size >= 0 ? `${props.size}px` : 'var(--ui-space-3)'
    : `var(--ui-space-${({ sm: 2, md: 3, lg: 5 } as const)[props.size]})`;
  return {
    display: props.inline ? 'inline-flex' : 'flex', gap,
    flexDirection: props.direction === 'vertical' ? 'column' : 'row',
    alignItems: ({ start: 'flex-start', center: 'center', end: 'flex-end', baseline: 'baseline', stretch: 'stretch' } as const)[props.align],
    flexWrap: props.wrap ? 'wrap' : 'nowrap',
  };
});
</script>

<template><div class="ui-space" :style="layout"><slot /></div></template>

<style scoped>
.ui-space { box-sizing: border-box; min-width: 0; max-width: 100%; }
</style>
