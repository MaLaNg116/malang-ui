<script setup lang="ts">
import { ref } from 'vue';
import type { MLayoutProps } from './types';
import { length, responsive, useViewport } from './_shared';
withDefaults(defineProps<MLayoutProps>(), { asideWidth: 240, gap: 20, label: '页面布局' });
const host = ref<HTMLElement>(), width = useViewport(host);
</script>
<template><section ref="host" class="ui-layout" :aria-label="label" :style="{ '--ui-layout-aside': length(responsive(asideWidth, width, 240)), gap: length(gap) }"><header v-if="$slots.header" class="ui-layout__header"><slot name="header" /></header><div class="ui-layout__body" :class="{ 'ui-layout__body--aside': $slots.aside }" :style="{ gap: length(gap) }"><aside v-if="$slots.aside" class="ui-layout__aside"><slot name="aside" /></aside><div class="ui-layout__main"><slot /></div></div><footer v-if="$slots.footer" class="ui-layout__footer"><slot name="footer" /></footer></section></template>
<style scoped>.ui-layout { display: grid; min-width: 0; }.ui-layout__body { display: grid; min-width: 0; }.ui-layout__body--aside { grid-template-columns: minmax(0, var(--ui-layout-aside)) minmax(0, 1fr); }.ui-layout__header, .ui-layout__footer, .ui-layout__aside, .ui-layout__main { min-width: 0; overflow-wrap: anywhere; }@media(max-width:640px){.ui-layout__body--aside { grid-template-columns: minmax(0,1fr); }}</style>
