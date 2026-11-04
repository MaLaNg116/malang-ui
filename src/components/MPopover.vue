<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue';
import MButton from './MButton.vue';
import type { MPopoverProps } from './types';
import { floatingPosition } from '../composables/floatingPosition';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MPopoverProps>(), { placement: 'bottom', disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const attrs = useAttrs();
const trigger = ref<InstanceType<typeof MButton>>();
const panel = ref<HTMLElement>();
const panelId = `ui-popover-${useId()}`;
const visible = ref(false);
const ready = ref(false);
let mounted = false;
let positioning: ReturnType<typeof floatingPosition> | undefined;
let focusOnOpen = false;
let restoreOnClose = false;
let requesting = false;

const triggerElement = () => trigger.value?.$el as HTMLButtonElement | undefined;
const isOpen = () => panel.value?.matches(':popover-open') ?? false;
function cleanup() { positioning?.dispose(); positioning = undefined; ready.value = false; }
function firstControl() {
  const element = panel.value;
  if (!element) return;
  const candidates = [...element.querySelectorAll<HTMLElement>('[autofocus],.ui-popover__body input,.ui-popover__body button,.ui-popover__body a[href],.ui-popover__body select,.ui-popover__body textarea')];
  return candidates.find(control => !control.matches(':disabled,[hidden],[inert]') && control.getClientRects().length > 0)
    ?? element.querySelector<HTMLButtonElement>('.ui-popover__close') ?? element;
}
function request(value: boolean, restore = false) {
  if (!mounted || requesting || (value && props.disabled) || value === props.modelValue) return;
  requesting = true;
  restoreOnClose = !value && restore;
  emit('update:modelValue', value);
  void nextTick(() => {
    requesting = false;
    // Focus belongs to this accepted interaction, not a later owner update.
    if (props.modelValue !== value) {
      focusOnOpen = false;
      restoreOnClose = false;
    }
  });
}
function close() { request(false, true); }
function toggle(event: MouseEvent) { focusOnOpen = event.detail === 0; request(!props.modelValue, true); }
function syncOpen() {
  const element = panel.value;
  const button = triggerElement();
  if (!mounted || !element?.isConnected || !button) return;
  if (props.modelValue && !props.disabled) {
    if (!isOpen()) element.showPopover();
    visible.value = true;
    if (!positioning) positioning = floatingPosition(button, element, () => props.placement, () => {
      ready.value = true;
      if (focusOnOpen) {
        focusOnOpen = false;
        void nextTick(() => { if (mounted && isOpen()) firstControl()?.focus({ preventScroll: true }); });
      }
    });
    else positioning.update();
  } else {
    focusOnOpen = false;
    const active = element.ownerDocument.activeElement;
    const shouldRestore = restoreOnClose || Boolean(active && element.contains(active));
    if (isOpen()) element.hidePopover();
    visible.value = false;
    cleanup();
    restoreOnClose = false;
    if (shouldRestore && !props.disabled) void nextTick(() => {
      if (mounted && !isOpen() && button.isConnected && !button.disabled) button.focus({ preventScroll: true });
    });
  }
}
function nativeToggle() {
  if (!mounted) return;
  if (isOpen()) { syncOpen(); return; }
  visible.value = false;
  cleanup();
  if (props.modelValue) {
    emit('update:modelValue', false);
    // A controlled owner may decline native light-dismiss just like a close request.
    void nextTick(syncOpen);
  }
}
onMounted(() => { mounted = true; syncOpen(); });
watch(() => [props.modelValue, props.disabled, props.placement], syncOpen, { flush: 'post' });
onBeforeUnmount(() => { mounted = false; cleanup(); if (isOpen()) panel.value?.hidePopover(); });
</script>

<template>
  <div class="ui-popover">
    <MButton v-bind="attrs" ref="trigger" variant="secondary" :disabled="disabled" :aria-label="triggerLabel || label" aria-haspopup="dialog" :aria-expanded="visible" :aria-controls="panelId" :popovertarget="panelId" @click.prevent="toggle"><slot name="trigger">{{ triggerLabel || label }}</slot></MButton>
    <div :id="panelId" ref="panel" class="ui-popover__panel" popover="auto" role="dialog" :aria-label="label" :data-ready="ready || undefined" tabindex="-1" @toggle="nativeToggle">
      <header class="ui-popover__header"><p>{{ label }}</p><button class="ui-popover__close" type="button" aria-label="关闭气泡" @click="close"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.5" /></svg></button></header>
      <div class="ui-popover__body"><slot :close="close" /></div>
    </div>
  </div>
</template>

<style scoped>
.ui-popover { display: inline-flex; min-width: 0; max-width: 100%; }
.ui-popover__panel { box-sizing: border-box; position: fixed; inset: auto; left: 0; top: 0; margin: 0; width: min(340px, calc(100vw - 32px)); max-width: calc(100vw - 24px); max-height: calc(100dvh - 32px); padding: 0; border: 1px solid var(--ui-color-border); border-radius: 0; background: var(--ui-color-surface-raised); color: var(--ui-color-text); box-shadow: var(--ui-shadow-panel); overflow: hidden; visibility: hidden; font: var(--ui-font-weight-body) var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-popover__panel:popover-open { display: flex; flex-direction: column; }
.ui-popover__panel[data-ready] { visibility: visible; animation: ui-popover-enter var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-popover__header { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; border-bottom: 1px solid var(--ui-color-rule); border-top: 2px solid var(--ui-color-accent); }
.ui-popover__header p { margin: 0; min-width: 0; overflow-wrap: anywhere; font-weight: var(--ui-font-weight-emphasis); }
.ui-popover__close { display: grid; place-items: center; flex: none; width: 32px; height: 32px; margin: -5px -5px -5px 0; padding: 0; border: 1px solid transparent; background: transparent; color: var(--ui-color-text-secondary); cursor: pointer; }
.ui-popover__close:hover { background: var(--ui-color-accent-soft); color: var(--ui-color-accent); }
.ui-popover__close:focus-visible, .ui-popover__panel:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -3px; }
.ui-popover__body { min-height: 0; padding: var(--ui-space-4); overflow: auto; overflow-wrap: anywhere; overscroll-behavior: contain; }
@keyframes ui-popover-enter { from { opacity: 0; transform: translateY(calc(var(--ui-motion-distance-enter) * .5)); } to { opacity: 1; transform: translateY(0); } }
:global([data-ui-motion='reduced'] .ui-popover__panel[data-ready]) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-popover__panel[data-ready] { animation: none; } }
@media (pointer: coarse) { .ui-popover__close { width: 44px; height: 44px; } }
</style>
