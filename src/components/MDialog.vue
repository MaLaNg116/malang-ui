<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue';
import type { MDialogProps } from './types';
import { lockDialogScroll } from '../composables/dialogScrollLock';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<MDialogProps>(), {
  closeOnEscape: true,
  closeOnBackdrop: false,
  closeLabel: '关闭对话框',
});
const emit = defineEmits<{ 'update:modelValue': [open: boolean] }>();
const attrs = useAttrs();
const dialog = ref<HTMLDialogElement>();
const identity = useId();
const titleId = `ui-dialog-${identity}-title`;
const descriptionId = `ui-dialog-${identity}-description`;
let mounted = false;
let closeRequested = false;
let backdropPointer: number | undefined;
let releaseScroll: (() => void) | undefined;
let trigger: HTMLElement | undefined;

function nativeAttrs() {
  // Opening must go through showModal(), and the dialog itself is not a tab stop.
  return Object.fromEntries(Object.entries(attrs).filter(([name]) => name !== 'open' && name !== 'tabindex'));
}

function describedBy() {
  return [...new Set([props.description && descriptionId, attrs['aria-describedby']].filter(Boolean).join(' ').split(/\s+/))]
    .filter(Boolean).join(' ') || undefined;
}

function unlock() {
  releaseScroll?.();
  releaseScroll = undefined;
}

function syncOpen() {
  const element = dialog.value;
  if (!mounted || !element?.isConnected) return;
  if (props.modelValue) {
    if (element.open) return;
    const active = element.ownerDocument.activeElement;
    trigger = active && typeof (active as HTMLElement).focus === 'function' ? active as HTMLElement : undefined;
    element.showModal();
    releaseScroll = lockDialogScroll(element.ownerDocument);
    closeRequested = false;
  } else {
    closeRequested = false;
    if (element.open) element.close();
    unlock();
  }
}

function close() {
  if (!mounted || !dialog.value?.open || !props.modelValue || closeRequested) return;
  closeRequested = true;
  emit('update:modelValue', false);
  void nextTick(() => { closeRequested = false; });
}

function cancel(event: Event) {
  event.preventDefault();
  if (props.closeOnEscape) close();
}

function nativeClosed() {
  // A queued close event from an earlier opening must not close a new one.
  if (!mounted || dialog.value?.open) return;
  unlock();
  if (props.modelValue) {
    emit('update:modelValue', false);
    void nextTick(syncOpen);
  }
  closeRequested = false;
}

function outside(event: PointerEvent) {
  const element = dialog.value;
  if (!element || event.target !== element) return false;
  const box = element.getBoundingClientRect();
  return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
}

function pointerDown(event: PointerEvent) {
  backdropPointer = event.button === 0 && outside(event) ? event.pointerId : undefined;
}

function pointerUp(event: PointerEvent) {
  const dismiss = props.closeOnBackdrop && backdropPointer === event.pointerId && outside(event);
  backdropPointer = undefined;
  if (dismiss) close();
}

function focusableControls() {
  const element = dialog.value;
  if (!element) return [];
  const candidates = [...element.querySelectorAll<HTMLElement>(
    'a[href],area[href],button,input,select,textarea,iframe,object,embed,summary,details,audio[controls],video[controls],[tabindex],[contenteditable]:not([contenteditable="false"])',
  )].filter(control => naturallyTabbable(control)
    && !control.hasAttribute('data-ui-dialog-focus-guard')
    && !control.matches(':disabled,[hidden],[inert]')
    && !control.closest('[hidden],[inert]')
    && control.getClientRects().length > 0
    && getComputedStyle(control).visibility === 'visible');
  return candidates.filter(control => {
    if (!(control instanceof HTMLInputElement) || control.type !== 'radio' || !control.name) return true;
    const group = candidates.filter(candidate => candidate instanceof HTMLInputElement
      && candidate.type === 'radio' && candidate.name === control.name && candidate.form === control.form) as HTMLInputElement[];
    return control === (group.find(radio => radio.checked) || group[0]);
  }).sort((a, b) => (a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity));
}

function focusFirst() {
  focusableControls()[0]?.focus();
}

function keepFocus(event: KeyboardEvent) {
  const element = dialog.value;
  if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey || !element) return;
  // Nested dialogs own their own Tab sequence; do not trap their bubbled events.
  if ((event.target as Element | null)?.closest('dialog') !== element) return;
  const controls = focusableControls();
  const first = controls[0];
  const last = controls.at(-1);
  if (!first || !last) return;
  const active = element.ownerDocument.activeElement;
  if (event.shiftKey && (active === first || active === element)) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && active === element) {
    event.preventDefault(); first.focus();
  }
}

function naturallyTabbable(control: HTMLElement) {
  if (control.hasAttribute('tabindex')) return control.tabIndex >= 0;
  if (control.tagName === 'SUMMARY') {
    const parent = control.parentElement;
    return parent?.tagName === 'DETAILS'
      && [...parent.children].find(child => child.tagName === 'SUMMARY') === control;
  }
  if (control.tagName === 'DETAILS') return ![...control.children].some(child => child.tagName === 'SUMMARY');
  if (control.tabIndex >= 0) return true;
  if (control.isContentEditable) return !control.parentElement?.isContentEditable;
  return control.matches('audio[controls],video[controls]');
}

onMounted(() => { mounted = true; syncOpen(); });
watch(() => props.modelValue, syncOpen, { flush: 'post' });
onBeforeUnmount(() => {
  mounted = false;
  backdropPointer = undefined;
  const element = dialog.value;
  if (element?.open) element.close();
  unlock();
  // Parent beforeUnmount runs before a nested modal closes. Restore only after
  // the complete subtree is gone, when the outer trigger is no longer inert.
  const returnTarget = trigger;
  const document = element?.ownerDocument;
  void nextTick(() => {
    const active = document?.activeElement;
    if (returnTarget?.isConnected && document
      && (!active || active === document.body || active === document.documentElement || element?.contains(active))) {
      returnTarget.focus({ preventScroll: true });
    }
  });
});
</script>

<template>
  <dialog
    v-bind="nativeAttrs()"
    ref="dialog"
    class="ui-dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    :aria-describedby="describedBy()"
    @cancel="cancel"
    @close="nativeClosed"
    @pointerdown="pointerDown"
    @pointerup="pointerUp"
    @pointercancel="backdropPointer = undefined"
    @keydown="keepFocus"
  >
    <header class="ui-dialog__header">
      <div class="ui-dialog__heading">
        <h2 :id="titleId" class="ui-dialog__title">{{ title }}</h2>
        <p v-if="description" :id="descriptionId" class="ui-dialog__description">{{ description }}</p>
      </div>
      <button class="ui-dialog__close" type="button" :aria-label="closeLabel" @click="close">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.5" /></svg>
      </button>
    </header>
    <div class="ui-dialog__body"><slot /></div>
    <footer v-if="$slots.footer" class="ui-dialog__footer"><slot name="footer" :close="close" /></footer>
    <span class="ui-dialog__focus-guard" data-ui-dialog-focus-guard tabindex="0" aria-hidden="true" @focus="focusFirst" />
  </dialog>
</template>

<style scoped>
.ui-dialog {
  box-sizing: border-box;
  width: min(560px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  padding: 0;
  margin: auto;
  border: var(--ui-border-width) solid var(--ui-color-border);
  border-radius: 0;
  background: var(--ui-color-surface);
  color: var(--ui-color-text);
  box-shadow: var(--ui-shadow-panel);
  overflow: hidden;
  font: var(--ui-font-weight-body) var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family);
}
.ui-dialog[open] {
  display: flex;
  flex-direction: column;
  animation: ui-dialog-enter var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized);
}
.ui-dialog::backdrop { background: var(--ui-color-overlay, rgba(0, 0, 0, 0.56)); }
.ui-dialog__header {
  display: flex;
  align-items: flex-start;
  gap: var(--ui-space-4);
  padding: var(--ui-space-6);
  background: linear-gradient(var(--ui-color-accent), var(--ui-color-accent)) left top / 44px 3px no-repeat;
  border-bottom: 1px solid var(--ui-color-rule);
  flex: none;
}
.ui-dialog__heading { min-width: 0; flex: 1; }
.ui-dialog__title {
  margin: 0;
  font: var(--ui-font-weight-emphasis) var(--ui-font-size-title)/var(--ui-line-height-heading) var(--ui-font-family-display);
  overflow-wrap: anywhere;
}
.ui-dialog__description {
  margin: var(--ui-space-2) 0 0;
  color: var(--ui-color-text-secondary);
  font-size: var(--ui-font-size-caption);
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.ui-dialog__close {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  margin: -8px -8px 0 0;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--ui-color-text-secondary);
  cursor: pointer;
  transition:
    color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    background-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}
.ui-dialog__close:hover { color: var(--ui-color-accent); background: var(--ui-color-accent-soft); }
.ui-dialog__close:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: var(--ui-focus-offset); }
.ui-dialog__body { min-height: 0; padding: var(--ui-space-6); overflow: auto; overscroll-behavior: contain; overflow-wrap: anywhere; }
.ui-dialog__footer { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: var(--ui-space-3); padding: var(--ui-space-5) var(--ui-space-6); border-top: 1px solid var(--ui-color-rule); flex: none; }
/* This final stop catches the browser's real slot/UA-control Tab order before
   focus can leave for browser chrome. It never participates in visual layout. */
.ui-dialog__focus-guard { position: fixed; width: 1px; height: 1px; top: 0; left: 0; opacity: 0; pointer-events: none; }
@keyframes ui-dialog-enter { from { opacity: 0; transform: translateY(var(--ui-motion-distance-enter)); } to { opacity: 1; transform: translateY(0); } }
:global([data-ui-motion='reduced'] .ui-dialog[open]) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-dialog[open] { animation: none; } .ui-dialog__close { transition: none; } }
@media (pointer: coarse) { .ui-dialog__close { width: 44px; height: 44px; } }
@media (max-width: 480px) { .ui-dialog__header, .ui-dialog__body { padding: var(--ui-space-5); } .ui-dialog__footer { padding: var(--ui-space-4) var(--ui-space-5); } }
</style>
