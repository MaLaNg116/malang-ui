<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import type { MGridProps } from './types';
import { bounded, gridContext, length, responsive, useViewport } from './_shared';
const props = withDefaults(defineProps<MGridProps>(), { columns: 12, gap: 16 });
const host = ref<HTMLElement>(); const width = useViewport(host);
const columns = computed(() => Math.floor(bounded(responsive(props.columns, width.value, 12), 1, 48, 12)));
provide(gridContext, { width, columns });
</script>
<template><div ref="host" class="ui-grid" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: length(responsive(gap, width, 16)), rowGap: rowGap === undefined ? undefined : length(responsive(rowGap, width, 16)), alignItems: align ?? 'stretch' }"><slot /></div></template>
<style scoped>.ui-grid { display: grid; min-width: 0; width: 100%; }.ui-grid > :deep(*) { min-width: 0; }</style>
