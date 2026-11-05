<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, shallowRef, useAttrs, useId, watch } from 'vue';
import type { MSegmentedProps } from './types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MSegmentedProps>(), { disabled: false, size: 'md', block: false, orientation: 'horizontal' });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const identity = `ui-segmented-${useId()}`;
const field = ref<HTMLFieldSetElement>(), track = ref<HTMLDivElement>();
const geometry = shallowRef<{ x: number; y: number; width: number; height: number } | null>(null);
const animated = ref(false);
let mounted = false, frame = 0, readyFrame = 0;
let resetTimer: ReturnType<typeof setTimeout> | undefined;
let resize: ResizeObserver | undefined, mutation: MutationObserver | undefined;
let documentOwner: Document | undefined, windowOwner: Window | undefined;
const required = computed(() => attrs.required === '' || Boolean(attrs.required));
const tabStop = computed(() => props.options.find(option => option.value === props.modelValue && !option.disabled) || props.options.find(option => !option.disabled));
const indicatorStyle = computed(() => geometry.value ? {
  width: `${geometry.value.width}px`, height: `${geometry.value.height}px`, transform: `translate(${geometry.value.x}px, ${geometry.value.y}px)`,
  visibility: 'visible' as const, transition: animated.value ? undefined : 'none',
} : { visibility: 'hidden' as const, transition: 'none' });
function rootAttrs() { return Object.fromEntries(Object.entries(attrs).filter(([name]) => name !== 'required' && name !== 'form')); }
function inputs() { return [...(field.value?.querySelectorAll<HTMLInputElement>('.ui-segmented__input') || [])]; }
function cancelReset() { if (resetTimer !== undefined) clearTimeout(resetTimer); resetTimer = undefined; }
function syncOwner() { for (const input of inputs()) input.checked = input.value === props.modelValue; scheduleMeasure(); }
function measure() {
  frame = 0;
  if (!mounted || !track.value) return;
  const selected = inputs().find(input => input.value === props.modelValue)?.parentElement;
  if (!selected) {
    geometry.value = null; animated.value = false;
    if (readyFrame) windowOwner!.cancelAnimationFrame(readyFrame); readyFrame = 0;
    return;
  }
  const outer = track.value.getBoundingClientRect(), item = selected.getBoundingClientRect();
  const round = (value: number) => Math.round(value * 100) / 100;
  const next = { x: round(item.left - outer.left + track.value.scrollLeft - track.value.clientLeft), y: round(item.top - outer.top + track.value.scrollTop - track.value.clientTop), width: round(item.width), height: round(item.height) };
  const previous = geometry.value;
  if (!previous || Object.keys(next).some(key => next[key as keyof typeof next] !== previous[key as keyof typeof next])) geometry.value = next;
  if (!animated.value && !readyFrame) readyFrame = windowOwner!.requestAnimationFrame(() => { readyFrame = 0; if (mounted) animated.value = true; });
}
function scheduleMeasure() { if (mounted && !frame) frame = windowOwner!.requestAnimationFrame(measure); }
function change(event: Event) {
  cancelReset();
  const input = event.target as HTMLInputElement;
  if (!input.matches(':disabled') && props.options.some(option => option.value === input.value && !option.disabled) && input.value !== props.modelValue) emit('update:modelValue', input.value);
  // Native radio activation precedes the owner's decision. Always restore its
  // checked state, including when a repeated request is declined without a render.
  void nextTick(syncOwner);
}
function navigate(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing || (event.currentTarget as HTMLInputElement).matches(':disabled')) return;
  const rtl = getComputedStyle(field.value!).direction === 'rtl';
  const direction = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : event.key === 'ArrowRight' ? rtl ? -1 : 1 : event.key === 'ArrowLeft' ? rtl ? 1 : -1 : 0;
  if (!direction) return;
  const enabled = inputs().filter(input => !input.matches(':disabled'));
  if (!enabled.length) return;
  event.preventDefault();
  const current = enabled.indexOf(event.currentTarget as HTMLInputElement);
  const target = enabled[(current + direction + enabled.length) % enabled.length]!;
  target.focus(); target.click();
}
function reset(event: Event) {
  if (!inputs().some(input => input.form === event.target)) return;
  cancelReset();
  // The browser resets checkedness after reset listeners finish. Read the current
  // owner in a later task, so a parent reset or a newer edit cannot be overwritten.
  resetTimer = setTimeout(() => { resetTimer = undefined; if (mounted && !event.defaultPrevented) syncOwner(); }, 0);
}
function observeItems() {
  resize?.disconnect();
  if (track.value) resize?.observe(track.value);
  for (const input of inputs()) if (input.parentElement) resize?.observe(input.parentElement);
}
watch(() => [props.modelValue, props.options, props.disabled, props.size, props.block, props.orientation], () => { cancelReset(); syncOwner(); observeItems(); }, { deep: true, flush: 'post' });
onMounted(() => {
  documentOwner = field.value!.ownerDocument; windowOwner = documentOwner.defaultView || undefined; mounted = Boolean(windowOwner);
  if (!mounted) return;
  if (typeof ResizeObserver !== 'undefined') resize = new ResizeObserver(scheduleMeasure);
  if (typeof MutationObserver !== 'undefined') {
    mutation = new MutationObserver(scheduleMeasure);
    // Direction can change on an ancestor without resizing any option.
    for (let ancestor: HTMLElement | null = field.value!; ancestor; ancestor = ancestor.parentElement) mutation.observe(ancestor, { attributes: true, attributeFilter: ['dir', 'class', 'style', 'data-ui-density'] });
  }
  documentOwner.addEventListener('reset', reset, true); windowOwner!.addEventListener('resize', scheduleMeasure);
  documentOwner.fonts?.addEventListener('loadingdone', scheduleMeasure);
  void documentOwner.fonts?.ready.then(() => { if (mounted) scheduleMeasure(); });
  observeItems(); syncOwner();
});
onUpdated(() => { syncOwner(); observeItems(); });
onBeforeUnmount(() => {
  mounted = false; cancelReset(); resize?.disconnect(); mutation?.disconnect();
  if (frame) windowOwner?.cancelAnimationFrame(frame); if (readyFrame) windowOwner?.cancelAnimationFrame(readyFrame);
  documentOwner?.removeEventListener('reset', reset, true); windowOwner?.removeEventListener('resize', scheduleMeasure);
  documentOwner?.fonts?.removeEventListener('loadingdone', scheduleMeasure);
});
</script>

<template>
  <fieldset v-bind="rootAttrs()" ref="field" class="ui-segmented" :class="[`ui-segmented--${size}`, { 'ui-segmented--block': block, 'ui-segmented--vertical': orientation === 'vertical' }]" :disabled="disabled" :data-measured="Boolean(geometry) || undefined">
    <legend class="ui-segmented__legend">{{ label }}</legend>
    <div ref="track" class="ui-segmented__track">
      <span class="ui-segmented__indicator" :style="indicatorStyle" aria-hidden="true"></span>
      <label v-for="(option, index) in options" :key="option.value" class="ui-segmented__option" :data-selected="option.value === modelValue || undefined" :data-disabled="disabled || option.disabled || undefined">
        <input class="ui-segmented__input" type="radio" :name="name || identity" :value="option.value" :checked="option.value === modelValue" :disabled="disabled || option.disabled" :required="required" :form="attrs.form as string | undefined" :tabindex="!disabled && option.value === tabStop?.value ? 0 : -1" :aria-labelledby="`${identity}-${index}-label`" :aria-describedby="option.description ? `${identity}-${index}-description` : undefined" @change="change" @keydown="navigate">
        <span class="ui-segmented__copy"><span :id="`${identity}-${index}-label`" class="ui-segmented__text">{{ option.label }}</span><span v-if="option.description" :id="`${identity}-${index}-description`" class="ui-segmented__description">{{ option.description }}</span></span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.ui-segmented { --ui-segment-height: var(--ui-control-height); --ui-segment-padding: 18px; box-sizing: border-box; display: inline-block; min-inline-size: 0; max-width: 100%; width: fit-content; padding: 0; margin: 0; border: 0; color: var(--ui-color-text); font: var(--ui-font-size-body)/1.6 var(--ui-font-family); vertical-align: top; }
.ui-segmented--sm { --ui-segment-height: 32px; --ui-segment-padding: 12px; font-size: var(--ui-font-size-caption); }
.ui-segmented--lg { --ui-segment-height: 48px; --ui-segment-padding: 24px; }
.ui-segmented--block { display: block; width: 100%; }
.ui-segmented__legend { max-width: 100%; padding: 0; margin-bottom: 10px; overflow-wrap: anywhere; font-size: var(--ui-font-size-caption); font-weight: var(--ui-font-weight-emphasis); letter-spacing: .04em; }
.ui-segmented__track { position: relative; isolation: isolate; display: flex; align-items: stretch; gap: 4px; max-width: 100%; min-width: 0; padding: 4px; border-block: 1px solid var(--ui-color-rule); background: var(--ui-color-surface-muted); overflow: auto; scrollbar-width: thin; scrollbar-color: var(--ui-color-metal) transparent; }
.ui-segmented--vertical .ui-segmented__track { flex-direction: column; }
.ui-segmented__indicator { position: absolute; top: 0; left: 0; z-index: 0; pointer-events: none; border: 1px solid var(--ui-color-accent); background: var(--ui-color-accent-soft); clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px)); box-shadow: inset 0 -2px var(--ui-color-accent); transition: transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized), width var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized), height var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-segmented__indicator::before { content: ''; position: absolute; top: 3px; inset-inline-end: 8px; width: 13px; height: 3px; background: repeating-linear-gradient(90deg, var(--ui-color-accent) 0 1px, transparent 1px 4px); opacity: .65; }
.ui-segmented__option { position: relative; z-index: 1; display: flex; align-items: stretch; justify-content: center; flex: 0 1 auto; min-width: calc(var(--ui-segment-padding) * 2 + 1em); min-height: var(--ui-segment-height); color: var(--ui-color-text-secondary); cursor: pointer; }
.ui-segmented--block .ui-segmented__option { flex-grow: 1; }
.ui-segmented--vertical .ui-segmented__option { flex: none; }
.ui-segmented__option[data-selected] { color: var(--ui-color-accent); }
.ui-segmented:not([data-measured]) .ui-segmented__option[data-selected] { box-shadow: inset 0 -2px var(--ui-color-accent); background: var(--ui-color-accent-soft); }
.ui-segmented__option:hover:not([data-disabled]):not([data-selected]) { color: var(--ui-color-text); background: var(--ui-color-surface); }
.ui-segmented__option[data-disabled] { opacity: .45; cursor: not-allowed; }
.ui-segmented:disabled { opacity: .6; }
.ui-segmented:disabled .ui-segmented__option[data-disabled] { opacity: 1; }
.ui-segmented__input { position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: inherit; }
.ui-segmented__copy { display: grid; gap: 2px; align-content: center; min-width: 0; padding: 8px var(--ui-segment-padding); text-align: center; pointer-events: none; }
.ui-segmented__text { font-weight: var(--ui-font-weight-emphasis); overflow-wrap: anywhere; }
.ui-segmented__description { color: var(--ui-color-text-secondary); font-size: 11px; overflow-wrap: anywhere; }
.ui-segmented__option:has(.ui-segmented__input:focus-visible) { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: -2px; }
.ui-segmented[aria-invalid='true'] .ui-segmented__track, .ui-segmented__track:has(.ui-segmented__input:user-invalid) { border-bottom-color: var(--ui-color-danger); }
.ui-segmented[aria-invalid='true'] .ui-segmented__option:has(.ui-segmented__input:focus-visible) { outline-color: var(--ui-color-danger); }
:global([data-ui-motion='reduced'] .ui-segmented__indicator) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-segmented__indicator { transition: none; } }
@media (pointer: coarse) { .ui-segmented__option { min-width: max(44px, calc(var(--ui-segment-padding) * 2 + 1em)); min-height: 44px; } }
@media (forced-colors: active) {
  .ui-segmented__track { border: 1px solid CanvasText; background: Canvas; }
  .ui-segmented__indicator { display: none; }
  .ui-segmented__option { border: 1px solid ButtonText; color: ButtonText; background: Canvas; }
  .ui-segmented__option[data-selected] { color: HighlightText; background: Highlight; }
  .ui-segmented__input { position: static; align-self: center; flex: none; width: 18px; height: 18px; opacity: 1; margin-inline-start: 8px; appearance: auto; }
  .ui-segmented__description { color: inherit; }
  .ui-segmented__option:has(.ui-segmented__input:focus-visible) { outline: 2px solid Highlight; outline-offset: 2px; }
}
</style>
