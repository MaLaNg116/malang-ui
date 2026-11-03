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
    <div :id="identity" ref="surface" class="ui-tooltip__surface" popover="manual" role="tooltip" :data-ready="ready || undefined" @mouseenter="hoverTip(true)" @mouseleave="hoverTip(false)">
      <div class="ui-tooltip__content">
        <span class="ui-tooltip__seal" aria-hidden="true"><svg width="14" height="20" viewBox="0 0 14 20" fill="none"><path d="M1 1h8l4 4v14H5l-4-4V1Z" stroke="currentColor" /><path d="M4 6h5M4 10h6M5 14h4M7 4v12" stroke="currentColor" stroke-width="1.2" /></svg></span>
        <span class="ui-tooltip__text">{{ text }}</span>
        <span class="ui-tooltip__gauge" aria-hidden="true"></span>
      </div>
      <span class="ui-tooltip__seam" aria-hidden="true"></span>
    </div>
  </div>
</template>

<style scoped>
.ui-tooltip { display: inline-flex; min-width: 0; max-width: 100%; }
.ui-tooltip__surface { --ui-tooltip-enter-x: 0px; --ui-tooltip-enter-y: 4px; box-sizing: border-box; position: fixed; isolation: isolate; inset: auto; left: 0; top: 0; margin: 0; width: max-content; max-width: min(300px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); padding: 0; border: 0; border-radius: 0; background: transparent; color: var(--ui-color-text); font: var(--ui-font-weight-body) var(--ui-font-size-caption)/1.8 var(--ui-font-family); overflow: visible; visibility: hidden; }
/* Cut only the two paint layers; long copy keeps its own rectangular scroll area. */
.ui-tooltip__surface::before, .ui-tooltip__surface::after { content: ''; position: absolute; pointer-events: none; z-index: -1; clip-path: polygon(0 0, calc(100% - 11px) 0, 100% 11px, 100% 100%, 11px 100%, 0 calc(100% - 11px)); }
.ui-tooltip__surface::before { inset: 0; background: var(--ui-color-metal); }
.ui-tooltip__surface::after { inset: 1px; clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px)); background: linear-gradient(115deg, color-mix(in srgb, var(--ui-color-accent) 7%, transparent), transparent 40%), var(--ui-color-surface-raised); }
.ui-tooltip__content { box-sizing: border-box; display: grid; grid-template-columns: 14px minmax(0, 1fr) 7px; align-items: start; gap: 11px; max-height: inherit; padding: 14px 16px; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--ui-color-metal) transparent; }
.ui-tooltip__text { min-width: 0; overflow-wrap: anywhere; }
.ui-tooltip__seal { display: flex; margin-top: 1px; color: var(--ui-color-accent); pointer-events: none; }
.ui-tooltip__gauge { align-self: stretch; min-height: 20px; position: relative; opacity: .65; color: var(--ui-color-secondary-accent); pointer-events: none; background: linear-gradient(currentColor, currentColor) right top / 3px 1px no-repeat, linear-gradient(currentColor, currentColor) right center / 7px 1px no-repeat, linear-gradient(currentColor, currentColor) right bottom / 3px 1px no-repeat; }
.ui-tooltip__gauge::after { content: ''; position: absolute; top: 4px; bottom: 4px; right: 0; border-right: 1px solid currentColor; opacity: .45; }
.ui-tooltip__seam { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(var(--ui-color-accent), var(--ui-color-accent)) 27px 0 / 24px 2px no-repeat, linear-gradient(var(--ui-color-secondary-accent), var(--ui-color-secondary-accent)) calc(100% - 17px) 100% / 25px 2px no-repeat; }
.ui-tooltip__seam::before, .ui-tooltip__seam::after { content: ''; position: absolute; width: 13px; height: 2px; transform: rotate(45deg); }
.ui-tooltip__seam::before { top: 5px; right: 0; background: var(--ui-color-accent); }
.ui-tooltip__seam::after { bottom: 5px; left: 0; height: 1px; background: var(--ui-color-secondary-accent); }
.ui-tooltip__surface[data-placement='bottom'] { --ui-tooltip-enter-y: -4px; }
.ui-tooltip__surface[data-placement='left'] { --ui-tooltip-enter-x: 4px; --ui-tooltip-enter-y: 0px; }
.ui-tooltip__surface[data-placement='right'] { --ui-tooltip-enter-x: -4px; --ui-tooltip-enter-y: 0px; }
.ui-tooltip__surface[data-ready] { visibility: visible; animation: ui-tooltip-enter var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-tooltip__surface[data-ready] .ui-tooltip__seam { animation: ui-tooltip-seat var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
@keyframes ui-tooltip-enter { from { opacity: 0; transform: translate(var(--ui-tooltip-enter-x), var(--ui-tooltip-enter-y)); } to { opacity: 1; transform: translate(0, 0); } }
@keyframes ui-tooltip-seat { from { opacity: 0; clip-path: inset(0 100% 0 0); } to { opacity: 1; clip-path: inset(0); } }
:global([data-ui-motion='reduced'] .ui-tooltip__surface[data-ready]) { animation: none; }
:global([data-ui-motion='reduced'] .ui-tooltip__surface[data-ready] .ui-tooltip__seam) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-tooltip__surface[data-ready], .ui-tooltip__surface[data-ready] .ui-tooltip__seam { animation: none; } }
@media (forced-colors: active) { .ui-tooltip__surface { border: 1px solid CanvasText; background: Canvas; color: CanvasText; } .ui-tooltip__surface::before, .ui-tooltip__surface::after, .ui-tooltip__seam, .ui-tooltip__gauge { display: none; } .ui-tooltip__seal { color: CanvasText; } }
</style>
