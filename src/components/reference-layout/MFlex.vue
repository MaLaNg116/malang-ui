<script setup lang="ts">
import { ref } from 'vue';
import type { MFlexProps } from './types';
import { length, responsive, useViewport } from './_shared';
withDefaults(defineProps<MFlexProps>(), { direction: 'row', gap: 12, wrap: false, inline: false });
const host = ref<HTMLElement>(), width = useViewport(host);
</script>
<template><div ref="host" class="ui-flex" :style="{ display: inline ? 'inline-flex' : 'flex', flexDirection: responsive(direction, width, 'row'), gap: length(responsive(gap, width, 12)), alignItems: align ?? 'stretch', justifyContent: justify ?? 'flex-start', flexWrap: wrap ? 'wrap' : 'nowrap' }"><slot /></div></template>
<style scoped>.ui-flex { min-width: 0; max-width: 100%; }.ui-flex > :deep(*) { min-width: 0; }</style>
