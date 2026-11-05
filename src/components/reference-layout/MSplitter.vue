<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import type { MSplitterProps } from './types';
import { bounded, browserOf, keyIntent } from './_shared';
const props = withDefaults(defineProps<MSplitterProps>(), { min: 10, max: 90, orientation: 'horizontal', collapsible: false, disabled: false, label: '调整面板尺寸' });
const emit = defineEmits<{ 'update:modelValue': [value: number]; 'resize-end': [value: number] }>();
const host = ref<HTMLElement>(), separator = ref<HTMLElement>(), first = ref<HTMLElement>();
const internal = ref(50), dragging = ref(false); const identity = `ui-splitter-${useId()}`;
const minimum = computed(() => bounded(Math.min(props.min, props.max), 0, 100, 10)), maximum = computed(() => bounded(Math.max(props.min, props.max), minimum.value, 100, 90));
const value = computed(() => props.collapsible && (props.modelValue ?? internal.value) === 0 ? 0 : bounded(props.modelValue ?? internal.value, minimum.value, maximum.value, 50));
let pointer: number | undefined, remembered = 50;
function update(next: number) { if (props.disabled) return; if (props.modelValue === undefined) internal.value = next; emit('update:modelValue', next); }
function finish() { if (pointer !== undefined && separator.value?.hasPointerCapture(pointer)) separator.value.releasePointerCapture(pointer); if (dragging.value) emit('resize-end', value.value); pointer = undefined; dragging.value = false; }
function drag(event: PointerEvent) {
  if (pointer !== event.pointerId || !host.value) return;
  const box = host.value.getBoundingClientRect(), handle = separator.value!.getBoundingClientRect();
  const vertical = props.orientation === 'vertical', extent = (vertical ? box.height - handle.height : box.width - handle.width);
  if (extent <= 0) return;
  let coordinate = vertical ? event.clientY - box.top - handle.height / 2 : event.clientX - box.left - handle.width / 2;
  if (!vertical && getComputedStyle(host.value).direction === 'rtl') coordinate = extent - coordinate;
  update(bounded(coordinate / extent * 100, minimum.value, maximum.value, value.value));
}
function start(event: PointerEvent) { if (props.disabled || event.button !== 0) return; event.preventDefault(); pointer = event.pointerId; dragging.value = true; separator.value?.focus(); separator.value?.setPointerCapture(pointer); drag(event); }
function toggle() { if (props.disabled || !props.collapsible) return; if (value.value === 0) update(bounded(remembered, minimum.value, maximum.value, 50)); else { remembered = value.value; update(0); } }
function keyboard(event: KeyboardEvent) {
  if (!keyIntent(event) || props.disabled) return;
  let next: number | undefined; const step = event.shiftKey ? 10 : 2;
  const rtl = props.orientation === 'horizontal' && host.value && getComputedStyle(host.value).direction === 'rtl';
  if (event.key === 'Home') next = minimum.value; else if (event.key === 'End') next = maximum.value;
  else if (props.orientation === 'horizontal' && ['ArrowLeft', 'ArrowRight'].includes(event.key)) next = value.value + (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1) * step;
  else if (props.orientation === 'vertical' && ['ArrowUp', 'ArrowDown'].includes(event.key)) next = value.value + (event.key === 'ArrowDown' ? step : -step);
  else if (event.key === 'Enter' && props.collapsible) { event.preventDefault(); toggle(); return; }
  if (next !== undefined) { event.preventDefault(); update(bounded(next, minimum.value, maximum.value, value.value)); emit('resize-end', bounded(next, minimum.value, maximum.value, value.value)); }
}
watch(() => [props.disabled, props.orientation], finish);
watch(value, (next, before) => { const active = host.value?.ownerDocument.activeElement; if (next === 0 && before !== 0 && active && first.value?.contains(active)) void nextTick(() => { if (host.value?.ownerDocument.activeElement === host.value?.ownerDocument.body) separator.value?.focus(); }); });
onMounted(() => browserOf(host.value)?.addEventListener('blur', finish)); onBeforeUnmount(() => { finish(); browserOf(host.value)?.removeEventListener('blur', finish); });
</script>
<template><div ref="host" class="ui-splitter" :data-direction="orientation" :data-dragging="dragging || undefined" :style="orientation === 'horizontal' ? { gridTemplateColumns: `minmax(0, ${value}fr) 44px minmax(0, ${100-value}fr)` } : { gridTemplateRows: `minmax(0, ${value}fr) 44px minmax(0, ${100-value}fr)` }"><div :id="identity" ref="first" class="ui-splitter__pane" :inert="value === 0 || undefined" :style="{ visibility: value === 0 ? 'hidden' : undefined }"><slot name="first" :collapsed="value === 0" /></div><div class="ui-splitter__rail"><div ref="separator" class="ui-splitter__handle" role="separator" :tabindex="disabled ? -1 : 0" :aria-label="label" :aria-controls="identity" :aria-orientation="orientation === 'horizontal' ? 'vertical' : 'horizontal'" :aria-valuenow="Math.round(value)" :aria-valuemin="collapsible ? 0 : minimum" :aria-valuemax="maximum" :aria-disabled="disabled || undefined" @pointerdown="start" @pointermove="drag" @pointerup="finish" @pointercancel="finish" @lostpointercapture="finish" @keydown="keyboard"><span aria-hidden="true" /></div><button v-if="collapsible" class="ui-splitter__collapse" type="button" :disabled="disabled" :aria-label="value === 0 ? '展开第一个面板' : '收起第一个面板'" @click="toggle">{{ value === 0 ? '＋' : '−' }}</button></div><div class="ui-splitter__pane"><slot name="second" /></div></div></template>
<style scoped>.ui-splitter { display:grid; min-width:0; min-height:240px; border:1px solid var(--ui-color-rule); background:var(--ui-color-surface); }.ui-splitter[data-direction=vertical] { height:420px; min-height:180px; }.ui-splitter__pane { min-width:0; min-height:0; overflow:auto; padding:16px; overflow-wrap:anywhere; }.ui-splitter__rail { position:relative; min-width:0; min-height:0; background:var(--ui-color-surface-muted); }.ui-splitter__handle { position:absolute; inset:0; display:grid; place-items:center; cursor:col-resize; touch-action:none; }.ui-splitter[data-direction=vertical] .ui-splitter__handle { cursor:row-resize; }.ui-splitter__handle span { width:2px; height:40px; background:var(--ui-color-metal); border-block:8px solid var(--ui-color-accent); }.ui-splitter[data-direction=vertical] .ui-splitter__handle span { width:40px; height:2px; border-block:0; border-inline:8px solid var(--ui-color-accent); }.ui-splitter__collapse { position:absolute; bottom:4px; inset-inline:0; width:44px; height:44px; border:0; background:var(--ui-color-surface-muted); color:var(--ui-color-text); cursor:pointer; }.ui-splitter[data-direction=vertical] .ui-splitter__collapse { inset-inline:auto 0; bottom:0; }.ui-splitter__handle:focus-visible,.ui-splitter__collapse:focus-visible { outline:2px solid var(--ui-color-focus); outline-offset:-3px; }.ui-splitter__handle[aria-disabled=true] { cursor:default; }@media(forced-colors:active){.ui-splitter,.ui-splitter__rail{border:1px solid CanvasText;background:Canvas}.ui-splitter__handle span{background:CanvasText;border-color:Highlight}.ui-splitter__collapse{background:ButtonFace;color:ButtonText}}</style>
