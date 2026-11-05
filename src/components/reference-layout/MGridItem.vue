<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import type { MGridItemProps } from './types';
import { bounded, gridContext, responsive } from './_shared';
const props = withDefaults(defineProps<MGridItemProps>(), { span: 1, offset: 0 });
const grid = inject(gridContext, { width: ref(0), columns: ref(12) });
const column = computed(() => { const span = Math.floor(bounded(responsive(props.span, grid.width.value, 1), 1, grid.columns.value, 1)); const offset = Math.floor(bounded(responsive(props.offset, grid.width.value, 0), 0, grid.columns.value - span, 0)); return offset ? `${offset + 1} / span ${span}` : `span ${span}`; });
</script>
<template><div class="ui-grid-item" :style="{ gridColumn: column }"><slot /></div></template>
<style scoped>.ui-grid-item { min-width: 0; overflow-wrap: anywhere; }</style>
