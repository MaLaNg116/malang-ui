<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue';
import type { UiToastProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiToastProps>(), {
  variant: 'info',
  closeLabel: '关闭通知',
});
const emit = defineEmits<{ 'update:modelValue': [open: boolean] }>();
const attrs = useAttrs();
const host = ref<HTMLElement>();
const toast = ref<HTMLElement>();
const titleId = `ui-toast-${useId()}-title`;
const descriptionId = `${titleId}-description`;
const politeMessage = ref('');
const urgentMessage = ref('');
const paused = new Set<'hover' | 'focus' | 'hidden'>();
let document: Document | undefined;
let browser: Window | null | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let remaining = 0;
let startedAt = 0;
let mounted = false;
let exhausted = false;
let requesting = false;
let announcementVersion = 0;

function duration() {
  const value = props.duration ?? (props.variant === 'error' ? 0 : 5000);
  // Invalid or unbounded delays stay readable rather than overflowing to 1ms.
  return Number.isFinite(value) && value > 0
    ? Math.min(value, 2_147_483_647)
    : 0;
}

function now() { return browser?.performance.now() ?? Date.now(); }

function stop(accountElapsed = true) {
  if (timer === undefined) return;
  clearTimeout(timer);
  timer = undefined;
  if (accountElapsed) remaining = Math.max(0, remaining - (now() - startedAt));
}

function requestClose() {
  if (!mounted || !props.modelValue || requesting) return;
  stop(false);
  remaining = 0;
  exhausted = true;
  requesting = true;
  emit('update:modelValue', false);
  // A declined request can be retried by a later explicit user action.
  void nextTick(() => { requesting = false; });
}

function schedule() {
  if (!mounted || !props.modelValue || !duration() || exhausted || paused.size || timer !== undefined) return;
  if (remaining <= 0) { requestClose(); return; }
  startedAt = now();
  timer = setTimeout(() => {
    timer = undefined;
    remaining = 0;
    requestClose();
  }, remaining);
}

function pause(reason: 'hover' | 'focus' | 'hidden', active: boolean) {
  if (active) {
    paused.add(reason);
    stop();
  } else {
    paused.delete(reason);
    schedule();
  }
}

function visibilityChanged() { pause('hidden', document?.hidden ?? false); }

function focusOut(event: FocusEvent) {
  const target = event.relatedTarget;
  if (!(target instanceof Node) || !toast.value?.contains(target)) pause('focus', false);
}

function resetTimer() {
  stop(false);
  remaining = duration();
  exhausted = false;
  requesting = false;
  paused.clear();
  if (document?.hidden) paused.add('hidden');
  if (props.modelValue && toast.value?.matches(':hover')) paused.add('hover');
  if (props.modelValue && document?.activeElement && toast.value?.contains(document.activeElement)) paused.add('focus');
  schedule();
}

async function announce() {
  const version = ++announcementVersion;
  politeMessage.value = '';
  urgentMessage.value = '';
  if (!props.modelValue) return;
  // The empty live regions must already be mounted before their text changes.
  await nextTick();
  if (!mounted || version !== announcementVersion || !props.modelValue) return;
  const message = [props.title, props.description].filter(Boolean).join(' ');
  if (props.variant === 'error') urgentMessage.value = message;
  else politeMessage.value = message;
}

function describedBy() {
  return [...new Set([props.description && descriptionId, attrs['aria-describedby']].filter(Boolean).join(' ').split(/\s+/))]
    .filter(Boolean).join(' ') || undefined;
}

watch(() => [props.modelValue, props.title, props.description, props.variant, props.duration] as const, (value, previous) => {
  if (!mounted) return;
  resetTimer();
  if (value.slice(0, 4).some((item, index) => item !== previous[index])) void announce();
}, { flush: 'post' });

onMounted(() => {
  mounted = true;
  document = host.value?.ownerDocument;
  browser = document?.defaultView;
  document?.addEventListener('visibilitychange', visibilityChanged);
  resetTimer();
  void announce();
});

onBeforeUnmount(() => {
  mounted = false;
  announcementVersion++;
  stop(false);
  document?.removeEventListener('visibilitychange', visibilityChanged);
  paused.clear();
});
</script>

<template>
  <div ref="host" class="ui-toast-host">
    <span class="ui-toast__live" role="status" aria-live="polite" aria-atomic="true">{{ politeMessage }}</span>
    <span class="ui-toast__live" role="alert" aria-live="assertive" aria-atomic="true">{{ urgentMessage }}</span>
    <div
      v-if="modelValue"
      v-bind="attrs"
      ref="toast"
      class="ui-toast"
      :class="`ui-toast--${variant}`"
      role="group"
      :aria-labelledby="titleId"
      :aria-describedby="describedBy()"
      @mouseenter="pause('hover', true)"
      @mouseleave="pause('hover', false)"
      @focusin="pause('focus', true)"
      @focusout="focusOut"
    >
      <span class="ui-toast__seal" aria-hidden="true">
        <svg v-if="variant === 'success'" viewBox="0 0 20 20" fill="none"><path d="m5.5 10 3 3 6-6" /></svg>
        <svg v-else-if="variant === 'error'" viewBox="0 0 20 20" fill="none"><path d="m6 6 8 8m0-8-8 8" /></svg>
        <svg v-else viewBox="0 0 20 20" fill="none"><path d="M10 8v6m0-9v.5" /></svg>
      </span>
      <div class="ui-toast__content">
        <p :id="titleId" class="ui-toast__title">{{ title }}</p>
        <p v-if="description" :id="descriptionId" class="ui-toast__description">{{ description }}</p>
      </div>
      <button class="ui-toast__close" type="button" :aria-label="closeLabel" @click="requestClose">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ui-toast-host { display: contents; }
.ui-toast__live {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  pointer-events: none;
}
.ui-toast {
  --ui-toast-tone: var(--ui-color-secondary-accent);
  box-sizing: border-box;
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--ui-space-3);
  width: 100%;
  min-width: 0;
  padding: var(--ui-space-4);
  border: var(--ui-border-width) solid var(--ui-color-border);
  border-left: 2px solid var(--ui-toast-tone);
  border-radius: 0;
  background: var(--ui-color-surface-raised);
  color: var(--ui-color-text);
  box-shadow: var(--ui-shadow-panel);
  font: var(--ui-font-weight-body) var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family);
  pointer-events: auto;
  animation: ui-toast-enter var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized);
}
.ui-toast--success { --ui-toast-tone: var(--ui-color-success); }
.ui-toast--error { --ui-toast-tone: var(--ui-color-danger); }
.ui-toast::after { content: ''; position: absolute; right: 5px; bottom: 5px; width: 6px; height: 6px; border-right: 1px solid var(--ui-toast-tone); border-bottom: 1px solid var(--ui-toast-tone); opacity: .65; pointer-events: none; }
.ui-toast__seal { display: grid; place-items: center; width: 22px; height: 24px; margin-top: 1px; color: var(--ui-toast-tone); border: 1px solid currentColor; }
.ui-toast__seal svg { width: 19px; height: 19px; stroke: currentColor; stroke-width: 1.6; stroke-linecap: square; stroke-linejoin: miter; }
.ui-toast__content { min-width: 0; max-height: min(260px, calc(100dvh - 96px)); padding-block: 2px; overflow: auto; overflow-wrap: anywhere; }
.ui-toast__title { margin: 0; font-weight: var(--ui-font-weight-emphasis); line-height: 1.5; }
.ui-toast__description { margin: var(--ui-space-2) 0 0; color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); line-height: 1.7; }
.ui-toast__close { display: grid; place-items: center; flex: none; width: 32px; height: 32px; margin: -5px -5px 0 0; padding: 0; border: 1px solid transparent; border-radius: 0; background: transparent; color: var(--ui-color-text-secondary); cursor: pointer; transition: color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard), background-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard); }
.ui-toast__close svg { stroke: currentColor; stroke-width: 1.5; }
.ui-toast__close:hover { background: var(--ui-color-accent-soft); color: var(--ui-color-accent); }
.ui-toast__close:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: var(--ui-focus-offset); }
@keyframes ui-toast-enter { from { opacity: 0; transform: translateY(var(--ui-motion-distance-enter)); } to { opacity: 1; transform: translateY(0); } }
:global([data-ui-motion='reduced'] .ui-toast) { animation: none; }
:global([data-ui-motion='reduced'] .ui-toast__close) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-toast { animation: none; } .ui-toast__close { transition: none; } }
@media (pointer: coarse) { .ui-toast__close { width: 44px; height: 44px; } }
</style>
