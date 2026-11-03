<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue';
import UiButton from './UiButton.vue';
import type { UiTooltipProps } from './types';
import { floatingPosition } from '../composables/floatingPosition';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<UiTooltipProps>(), { placement: 'top', delay: 300, disabled: false });
const attrs = useAttrs();
const trigger = ref<InstanceType<typeof UiButton>>();
const surface = ref<HTMLElement>();
const identity = `ui-tooltip-${useId()}`;
const ready = ref(false);
let mounted = false;
let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let positioning: ReturnType<typeof floatingPosition> | undefined;
let hoveringTrigger = false;
let hoveringTip = false;
let focused = false;
let suppressed = false;
let document: Document | undefined;
const triggerElement = () => trigger.value?.$el as HTMLButtonElement | undefined;
const isOpen = () => surface.value?.matches(':popover-open') ?? false;
const usable = () => !props.disabled && Boolean(props.text.trim());
function describedBy() { return [...new Set([attrs['aria-describedby'], usable() && identity].filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined; }
function clearTimers() { if (openTimer !== undefined) clearTimeout(openTimer); if (closeTimer !== undefined) clearTimeout(closeTimer); openTimer = closeTimer = undefined; }
function hide() {
  clearTimers(); positioning?.dispose(); positioning = undefined; ready.value = false;
  hoveringTip = false;
  if (isOpen()) surface.value?.hidePopover();
  document?.removeEventListener('keydown', escape, true);
}
function show() {
  if (!mounted || !usable() || suppressed || !(hoveringTrigger || hoveringTip || focused)) return;
  const button = triggerElement(), element = surface.value;
  if (!button || !element) return;
  if (!isOpen()) element.showPopover();
  if (!positioning) positioning = floatingPosition(button, element, () => props.placement, () => { ready.value = true; });
  else positioning.update();
  document?.addEventListener('keydown', escape, true);
}
function openSoon(immediate = false) {
  clearTimers();
  if (!usable() || suppressed) return;
  const delay = Number.isFinite(props.delay) ? Math.min(10_000, Math.max(0, props.delay)) : 0;
  if (immediate || delay === 0 || isOpen()) show();
  else openTimer = setTimeout(() => { openTimer = undefined; show(); }, delay);
}
function closeSoon() {
  if (hoveringTrigger || hoveringTip || focused) return;
  if (openTimer !== undefined) { clearTimeout(openTimer); openTimer = undefined; }
  if (closeTimer !== undefined) clearTimeout(closeTimer);
  closeTimer = setTimeout(() => { closeTimer = undefined; if (!hoveringTrigger && !hoveringTip && !focused) hide(); }, 120);
}
function hoverTrigger(active: boolean) { hoveringTrigger = active; if (active) { suppressed = false; openSoon(); } else closeSoon(); }
function focus(active: boolean) { focused = active; if (active) { suppressed = false; openSoon(true); } else closeSoon(); }
function hoverTip(active: boolean) { hoveringTip = active; if (active) { if (closeTimer !== undefined) clearTimeout(closeTimer); closeTimer = undefined; } else closeSoon(); }
function escape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !isOpen()) return;
  event.preventDefault(); event.stopPropagation(); suppressed = true; hide();
}
onMounted(() => { mounted = true; document = surface.value?.ownerDocument; });
watch(() => [props.disabled, props.text, props.placement, props.delay], () => {
  if (!mounted) return;
  if (!usable()) { hoveringTrigger = false; focused = false; hide(); }
  else if (isOpen()) positioning?.update();
  else {
    const button = triggerElement();
    hoveringTrigger = button?.matches(':hover') ?? false;
    focused = button === document?.activeElement;
    if (hoveringTrigger || focused) void nextTick(() => openSoon(focused));
  }
}, { flush: 'post' });
onBeforeUnmount(() => { mounted = false; hide(); });
</script>

<template>
  <div class="ui-tooltip">
    <UiButton v-bind="attrs" ref="trigger" variant="secondary" :disabled="disabled" :aria-label="label" :aria-describedby="describedBy()" @mouseenter="hoverTrigger(true)" @mouseleave="hoverTrigger(false)" @focus="focus(true)" @blur="focus(false)"><slot>{{ label }}</slot></UiButton>
    <div :id="identity" ref="surface" class="ui-tooltip__surface" popover="manual" role="tooltip" :data-ready="ready || undefined" @mouseenter="hoverTip(true)" @mouseleave="hoverTip(false)">{{ text }}</div>
  </div>
</template>

<style scoped>
.ui-tooltip { display: inline-flex; min-width: 0; max-width: 100%; }
.ui-tooltip__surface { box-sizing: border-box; position: fixed; inset: auto; left: 0; top: 0; margin: 0; width: max-content; max-width: min(280px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); padding: 9px 12px; border: 1px solid var(--ui-color-border); border-left: 2px solid var(--ui-color-secondary-accent); border-radius: 0; background: var(--ui-color-surface-raised); color: var(--ui-color-text); box-shadow: var(--ui-shadow-panel); font: var(--ui-font-weight-body) var(--ui-font-size-caption)/1.7 var(--ui-font-family); overflow: auto; overflow-wrap: anywhere; visibility: hidden; }
.ui-tooltip__surface[data-ready] { visibility: visible; animation: ui-tooltip-enter var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
@keyframes ui-tooltip-enter { from { opacity: 0; } to { opacity: 1; } }
:global([data-ui-motion='reduced'] .ui-tooltip__surface[data-ready]) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-tooltip__surface[data-ready] { animation: none; } }
</style>
