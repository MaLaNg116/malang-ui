<script setup lang="ts">
import { computed } from 'vue';
import type { UiButtonProps } from './types';

const props = withDefaults(defineProps<UiButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();
const unavailable = computed(() => props.disabled || props.loading);

function handleClick(event: MouseEvent) {
  if (unavailable.value) {
    event.preventDefault();
    return;
  }
  emit('click', event);
}
</script>

<template>
  <button
    class="ui-button"
    :class="[`ui-button--${variant}`, `ui-button--${size}`]"
    :type="type"
    :disabled="unavailable"
    :aria-busy="loading || undefined"
    @click="handleClick"
  >
    <span class="ui-button__surface" aria-hidden="true" />
    <span v-if="loading" class="ui-button__spinner" aria-hidden="true" />
    <span class="ui-button__content"><slot /></span>
  </button>
</template>

<style scoped>
.ui-button {
  --ui-button-cut: 6px;
  --ui-button-height: var(--ui-control-height);
  --ui-button-frame: var(--ui-color-accent);
  --ui-button-fill: var(--ui-color-accent);
  box-sizing: border-box;
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-2);
  min-height: var(--ui-button-height);
  max-width: 100%;
  padding: var(--ui-space-1) var(--ui-control-padding-inline);
  border: var(--ui-border-width) solid transparent;
  border-radius: 0;
  background: transparent;
  font-family: var(--ui-font-family);
  font-size: var(--ui-font-size-body);
  font-weight: var(--ui-font-weight-emphasis);
  line-height: var(--ui-line-height-body);
  letter-spacing: 0.025em;
  text-align: center;
  overflow-wrap: anywhere;
  cursor: pointer;
  transition:
    transform var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard),
    color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-button::before,
.ui-button::after,
.ui-button__surface {
  position: absolute;
  pointer-events: none;
}

.ui-button::before,
.ui-button__surface {
  clip-path: polygon(0 0, calc(100% - var(--ui-button-cut)) 0, 100% var(--ui-button-cut), 100% 100%, var(--ui-button-cut) 100%, 0 calc(100% - var(--ui-button-cut)));
}

.ui-button::before {
  content: '';
  inset: -1px;
  z-index: -2;
  background: var(--ui-button-frame);
}

.ui-button__surface {
  inset: 0;
  z-index: -1;
  background: var(--ui-button-fill);
  transition: background-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

/* Opposing registration corners recall a printed seal without occupying the label. */
.ui-button::after {
  content: '';
  inset: 6px;
  opacity: 0.4;
  background:
    linear-gradient(currentColor, currentColor) left top / 6px 1px no-repeat,
    linear-gradient(currentColor, currentColor) left top / 1px 6px no-repeat,
    linear-gradient(currentColor, currentColor) right bottom / 6px 1px no-repeat,
    linear-gradient(currentColor, currentColor) right bottom / 1px 6px no-repeat;
  transition:
    opacity var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    transform var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-button--primary {
  color: var(--ui-color-on-accent);
  --ui-button-frame: color-mix(in srgb, var(--ui-color-accent) 84%, var(--ui-color-ink));
}

.ui-button--secondary {
  --ui-button-frame: var(--ui-color-border);
  --ui-button-fill: var(--ui-color-surface);
  color: var(--ui-color-text);
}

.ui-button--secondary::after {
  color: var(--ui-color-secondary-accent);
  opacity: 0.7;
}

.ui-button--ghost {
  --ui-button-frame: transparent;
  --ui-button-fill: transparent;
  color: var(--ui-color-accent);
}

.ui-button--ghost::after {
  inset: auto var(--ui-control-padding-inline) 5px;
  height: 1px;
  background: currentColor;
  opacity: 0.6;
  transform: scaleX(0.22);
  transform-origin: left;
}

.ui-button:hover:not(:disabled)::after,
.ui-button:focus-visible::after {
  opacity: 0.9;
  transform: translateX(calc(var(--ui-motion-distance-enter) * 0.125));
}

.ui-button--secondary:hover:not(:disabled) {
  --ui-button-frame: var(--ui-color-secondary-accent);
  --ui-button-fill: var(--ui-color-accent-soft);
}

.ui-button--ghost:hover:not(:disabled) {
  --ui-button-fill: var(--ui-color-accent-soft);
}

.ui-button--ghost:hover:not(:disabled)::after,
.ui-button--ghost:focus-visible::after {
  transform: scaleX(1);
}

.ui-button--sm {
  --ui-button-cut: 5px;
  --ui-button-height: 32px;
  padding: var(--ui-space-1) var(--ui-space-3);
  font-size: var(--ui-font-size-caption);
}

.ui-button--lg {
  --ui-button-cut: 7px;
  --ui-button-height: 48px;
  padding: var(--ui-space-2) var(--ui-space-6);
  font-size: var(--ui-font-size-body-large);
}

.ui-button:focus-visible {
  outline: var(--ui-focus-width) solid var(--ui-color-focus);
  outline-offset: var(--ui-focus-offset);
}

.ui-button:active:not(:disabled) {
  transform: scale(var(--ui-motion-scale-press));
}

.ui-button:active:not(:disabled)::after {
  opacity: 1;
}

.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.ui-button[aria-busy='true'] {
  cursor: progress;
  opacity: 0.8;
}

.ui-button__content {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-2);
}

.ui-button__spinner {
  width: 1em;
  height: 1em;
  flex: none;
  box-sizing: border-box;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-radius: 1px;
  transform: rotate(45deg);
  animation: ui-button-spin 1100ms var(--ui-motion-ease-standard) infinite;
}

@keyframes ui-button-spin {
  from { transform: rotate(45deg); }
  to { transform: rotate(405deg); }
}

:global([data-ui-motion='reduced'] .ui-button__spinner) {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .ui-button__spinner { animation: none; }
  .ui-button::after { transition: none; }
}

@media (pointer: coarse) {
  .ui-button { min-height: max(44px, var(--ui-button-height)); }
}
</style>
