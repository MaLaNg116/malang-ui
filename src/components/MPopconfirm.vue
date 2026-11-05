<script lang="ts">
// Each instance removes only its own entry; Escape belongs to the last open confirmation.
const confirmationLayers = new WeakMap<Document, Set<HTMLElement>>();
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue';
import MButton from './MButton.vue';
import type { MPopconfirmProps } from './types';
import { floatingPosition } from '../composables/floatingPosition';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MPopconfirmProps>(), { confirmText: '确认', cancelText: '取消', placement: 'top', disabled: false, danger: false });
const emit = defineEmits<{
  'update:modelValue': [open: boolean]; confirm: [event: MouseEvent];
  cancel: [event?: MouseEvent | KeyboardEvent]; 'confirm-error': [error: unknown];
}>();
const attrs = useAttrs();
const root = ref<HTMLElement>(), panel = ref<HTMLElement>();
const trigger = ref<InstanceType<typeof MButton>>(), confirmButton = ref<InstanceType<typeof MButton>>(), cancelButton = ref<InstanceType<typeof MButton>>();
const identity = `ui-popconfirm-${useId()}`, titleId = `${identity}-title`, descriptionId = `${identity}-description`, errorId = `${identity}-error`;
const visible = ref(false), ready = ref(false), pending = ref(false), errorMessage = ref('');
let mounted = false, generation = 0, requesting = false, focusOnOpen = false;
let closeIntent: 'restore' | 'outside' | undefined;
let ownerDocument: Document | undefined;
let positioning: ReturnType<typeof floatingPosition> | undefined;
let confirmation: AbortController | undefined;
const triggerElement = () => trigger.value?.$el as HTMLButtonElement | undefined;
const isOpen = () => panel.value?.matches(':popover-open') ?? false;
function invalidate() { generation++; pending.value = false; const active = confirmation; confirmation = undefined; active?.abort(); }
function releaseLayer() {
  if (!ownerDocument || !panel.value) return;
  const layers = confirmationLayers.get(ownerDocument); layers?.delete(panel.value);
  if (!layers?.size) confirmationLayers.delete(ownerDocument);
}
function cleanup() {
  positioning?.dispose(); positioning = undefined; ready.value = false;
  ownerDocument?.removeEventListener('pointerdown', outside, true);
  ownerDocument?.removeEventListener('keydown', keydown, true);
  releaseLayer();
}
function focusIsOwned(active: Element | null) { return Boolean(active && (active === triggerElement() || panel.value?.contains(active))); }
function request(open: boolean, intent?: 'restore' | 'outside') {
  if (!mounted || requesting || (open && props.disabled) || open === props.modelValue) return;
  requesting = true; closeIntent = open ? undefined : intent;
  emit('update:modelValue', open);
  void nextTick(() => {
    requesting = false;
    if (!mounted) return;
    if (props.modelValue !== open) { focusOnOpen = false; closeIntent = undefined; }
    syncOpen();
  });
}
function cancel(event?: MouseEvent | KeyboardEvent, intent: 'restore' | 'outside' = 'restore') {
  if (!mounted || !props.modelValue || requesting) return;
  invalidate(); errorMessage.value = ''; emit('cancel', event); request(false, intent);
}
function toggle(event: MouseEvent) {
  if (props.disabled || requesting) return;
  if (props.modelValue) { cancel(event); return; }
  errorMessage.value = '';
  focusOnOpen = event.detail === 0 && ownerDocument?.activeElement === triggerElement();
  request(true);
}
function outside(event: PointerEvent) {
  if (!visible.value || event.composedPath().includes(root.value!)) return;
  cancel(event, 'outside');
}
function keydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented || !visible.value || !ownerDocument) return;
  const layers = confirmationLayers.get(ownerDocument);
  if (!layers || [...layers].at(-1) !== panel.value) return;
  event.preventDefault(); event.stopPropagation(); cancel(event);
}
function syncOpen() {
  const element = panel.value, button = triggerElement();
  if (!mounted || !ownerDocument || !element?.isConnected || !button) return;
  if (props.modelValue && !props.disabled) {
    if (!isOpen()) element.showPopover();
    visible.value = true;
    const layers = confirmationLayers.get(ownerDocument) ?? new Set<HTMLElement>();
    layers.add(element); confirmationLayers.set(ownerDocument, layers);
    if (!positioning) {
      ownerDocument.addEventListener('pointerdown', outside, true);
      ownerDocument.addEventListener('keydown', keydown, true);
      positioning = floatingPosition(button, element, () => props.placement, () => {
        ready.value = true;
        if (!focusOnOpen) return;
        focusOnOpen = false;
        void nextTick(() => {
          if (!mounted || !isOpen() || !props.modelValue || props.disabled || !ownerDocument) return;
          const active = ownerDocument.activeElement;
          if (active === button || active === ownerDocument.body || active === element) (cancelButton.value?.$el as HTMLButtonElement | undefined)?.focus({ preventScroll: true });
        });
      });
    } else positioning.update();
  } else {
    const wasOpen = visible.value || isOpen();
    focusOnOpen = false; invalidate(); errorMessage.value = '';
    const shouldRestore = wasOpen && closeIntent !== 'outside' && focusIsOwned(ownerDocument.activeElement);
    closeIntent = undefined;
    if (isOpen()) element.hidePopover();
    visible.value = false; cleanup();
    if (shouldRestore && !props.disabled) void nextTick(() => {
      if (!mounted || isOpen() || !button.isConnected || button.disabled || !ownerDocument) return;
      const active = ownerDocument.activeElement;
      if (active === ownerDocument.body || active === ownerDocument.documentElement || focusIsOwned(active)) button.focus({ preventScroll: true });
    });
  }
}
function nativeToggle() {
  if (!mounted || isOpen()) return;
  const wasVisible = visible.value; visible.value = false; cleanup();
  if (props.modelValue && wasVisible) { invalidate(); cancel(undefined, 'outside'); }
}
function readableError(error: unknown) {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.trim()) return error.message;
  return '确认未完成，请稍后重试。';
}
async function confirm(event: MouseEvent) {
  if (!mounted || !props.modelValue || props.disabled || pending.value || requesting || !isOpen()) return;
  const token = ++generation, button = confirmButton.value?.$el as HTMLButtonElement | undefined;
  const controller = new AbortController(); confirmation = controller;
  const ownedFocus = ownerDocument?.activeElement === button;
  // Move an owned focus before disabling the confirming button, including fast promises.
  if (ownedFocus) (cancelButton.value?.$el as HTMLButtonElement | undefined)?.focus({ preventScroll: true });
  pending.value = true; errorMessage.value = '';
  let accepted: void | boolean;
  try {
    accepted = await props.beforeConfirm?.(controller.signal);
  } catch (error) {
    if (!mounted || token !== generation || controller.signal.aborted || !props.modelValue || props.disabled || !isOpen()) return;
    pending.value = false; errorMessage.value = readableError(error); emit('confirm-error', error);
    return;
  } finally {
    if (confirmation === controller) confirmation = undefined;
  }
  if (!mounted || token !== generation || controller.signal.aborted || !props.modelValue || props.disabled || !isOpen()) return;
  pending.value = false;
  if (accepted === false) return;
  emit('confirm', event); request(false, 'restore');
}
onMounted(() => { mounted = true; ownerDocument = root.value?.ownerDocument; syncOpen(); });
watch(() => [props.modelValue, props.disabled, props.placement], syncOpen, { flush: 'post' });
onBeforeUnmount(() => { mounted = false; invalidate(); cleanup(); if (isOpen()) panel.value?.hidePopover(); ownerDocument = undefined; });
</script>

<template>
  <div ref="root" class="ui-popconfirm">
    <MButton v-bind="attrs" ref="trigger" type="button" variant="secondary" :disabled="disabled" :aria-label="triggerLabel || title" aria-haspopup="dialog" :aria-expanded="visible" :aria-controls="identity" @click="toggle"><slot name="trigger">{{ triggerLabel || title }}</slot></MButton>
    <div :id="identity" ref="panel" class="ui-popconfirm__panel" popover="manual" role="dialog" :aria-labelledby="titleId" :aria-describedby="[description && descriptionId, errorMessage && errorId].filter(Boolean).join(' ') || undefined" :data-ready="ready || undefined" tabindex="-1" @toggle="nativeToggle">
      <div class="ui-popconfirm__copy"><span class="ui-popconfirm__mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" focusable="false"><path d="M7 3h10l4 4v10l-4 4H7l-4-4V7l4-4ZM12 7v6m0 3v1"/></svg></span><div class="ui-popconfirm__message"><p :id="titleId" class="ui-popconfirm__title">{{ title }}</p><p v-if="description" :id="descriptionId" class="ui-popconfirm__description">{{ description }}</p></div></div>
      <p v-if="pending" class="ui-popconfirm__feedback" role="status">正在确认，请稍候。</p>
      <p v-if="errorMessage" :id="errorId" class="ui-popconfirm__error" role="alert">{{ errorMessage }}</p>
      <div class="ui-popconfirm__actions"><MButton ref="cancelButton" variant="secondary" @click="cancel($event)">{{ cancelText }}</MButton><MButton ref="confirmButton" class="ui-popconfirm__confirm" :class="{ 'ui-popconfirm__confirm--danger': danger }" :loading="pending" @click="confirm">{{ confirmText }}</MButton></div>
    </div>
  </div>
</template>

<style scoped>
.ui-popconfirm { display: inline-flex; min-width: 0; max-width: 100%; }
.ui-popconfirm__panel { box-sizing: border-box; position: fixed; inset: auto; left: 0; top: 0; margin: 0; width: min(340px, calc(100% - 24px)); max-width: calc(100% - 24px); max-height: calc(100dvh - 24px); padding: 0; border: 1px solid var(--ui-color-border); border-radius: 0; background: var(--ui-color-surface-raised); color: var(--ui-color-text); box-shadow: var(--ui-shadow-panel); visibility: hidden; overflow: hidden; font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-popconfirm__panel:popover-open { display: flex; flex-direction: column; }
.ui-popconfirm__panel[data-ready] { visibility: visible; animation: ui-popconfirm-enter var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-popconfirm__panel::before { content: ''; position: absolute; top: -1px; left: 16px; width: 28px; height: 2px; background: var(--ui-color-accent); pointer-events: none; }
.ui-popconfirm__copy { display: grid; grid-template-columns: 24px minmax(0, 1fr); align-items: start; gap: 12px; padding: 20px 18px 14px; min-width: 0; min-height: 0; flex: 1 1 auto; overflow: auto; overscroll-behavior: contain; }
.ui-popconfirm__mark { color: var(--ui-color-accent); }
.ui-popconfirm__mark svg { display: block; stroke: currentColor; stroke-width: 1.25; stroke-linecap: square; stroke-linejoin: miter; }
.ui-popconfirm__message { min-width: 0; }
.ui-popconfirm__title { margin: 0; font-weight: var(--ui-font-weight-emphasis); overflow-wrap: anywhere; }
.ui-popconfirm__description { margin: 8px 0 0; color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); line-height: 1.8; overflow-wrap: anywhere; }
.ui-popconfirm__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; padding: 12px 18px 16px; border-top: 1px solid var(--ui-color-rule); flex: none; }
.ui-popconfirm__actions .ui-popconfirm__confirm--danger { --ui-button-fill: var(--ui-color-danger); --ui-button-frame: var(--ui-color-danger); color: var(--ui-color-on-accent); }
.ui-popconfirm__feedback, .ui-popconfirm__error { min-width: 0; min-height: 0; max-height: min(120px, 30dvh); margin: 0; padding: 0 18px 14px; font-size: var(--ui-font-size-caption); line-height: 1.8; overflow-wrap: anywhere; overflow: auto; flex: 0 1 auto; }
.ui-popconfirm__feedback { color: var(--ui-color-info); }
.ui-popconfirm__error { color: var(--ui-color-danger); }
@keyframes ui-popconfirm-enter { from { opacity: 0; transform: translateY(calc(var(--ui-motion-distance-enter) * .5)); } to { opacity: 1; transform: translateY(0); } }
:global([data-ui-motion='reduced'] .ui-popconfirm__panel[data-ready]) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-popconfirm__panel[data-ready] { animation: none; } }
@media (pointer: coarse) { .ui-popconfirm__actions :deep(.ui-button), .ui-popconfirm > :deep(.ui-button) { min-height: 44px; } }
@media (forced-colors: active) { .ui-popconfirm__panel { border-color: CanvasText; background: Canvas; box-shadow: none; } .ui-popconfirm__panel::before { background: CanvasText; } .ui-popconfirm__mark { color: CanvasText; } .ui-popconfirm__actions { border-color: CanvasText; } }
</style>
