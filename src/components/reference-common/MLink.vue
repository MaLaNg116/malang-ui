<script setup lang="ts">
import { useAttrs } from 'vue';
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ href?: string; disabled?: boolean; underline?: boolean; type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' }>(), { underline: true, type: 'primary' });
const attrs = useAttrs();
const emit = defineEmits<{ click: [event: MouseEvent] }>();
function click(event: MouseEvent) { if (props.disabled) { event.preventDefault(); event.stopImmediatePropagation(); } else emit('click', event); }
</script>
<template><a v-bind="attrs" class="ui-link" :class="{ 'ui-link--underline': underline }" :data-type="type" :href="disabled ? undefined : href" :aria-disabled="disabled || undefined" :tabindex="disabled ? -1 : undefined" :rel="attrs.rel as string || (attrs.target === '_blank' ? 'noopener noreferrer' : undefined)" @click="click"><slot /></a></template>
<style scoped>
.ui-link { color: var(--ui-color-info); text-decoration: none; font: inherit; overflow-wrap: anywhere; }.ui-link--underline { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px; }.ui-link:hover { color: var(--ui-color-accent); }.ui-link:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: 3px; }.ui-link[data-type='default'] { color: var(--ui-color-text); }.ui-link[data-type='success'] { color: var(--ui-color-success); }.ui-link[data-type='warning'] { color: var(--ui-color-warning); }.ui-link[data-type='danger'] { color: var(--ui-color-danger); }.ui-link[aria-disabled='true'] { color: var(--ui-color-text-secondary); cursor: not-allowed; text-decoration: none; opacity: .6; }
</style>
