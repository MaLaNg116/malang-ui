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
    <span v-if="loading" class="ui-button__spinner" aria-hidden="true" />
    <span class="ui-button__content"><slot /></span>
  </button>
</template>

<style scoped>
.ui-button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-2);
  min-height: var(--ui-control-height);
  padding: var(--ui-space-2) var(--ui-control-padding-inline);
  border: var(--ui-border-width) solid transparent;
  border-radius: var(--ui-radius-control);
  font-family: var(--ui-font-family);
  font-size: var(--ui-font-size-body);
  font-weight: var(--ui-font-weight-emphasis);
  line-height: var(--ui-line-height-body);
  text-align: center;
  cursor: pointer;
  transition:
    transform var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard),
    background-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    border-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    box-shadow var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-button--primary {
  color: var(--ui-color-on-accent);
  background: var(--ui-color-accent);
}

.ui-button--primary:hover:not(:disabled) {
  box-shadow: 0 4px 18px color-mix(in srgb, var(--ui-color-accent) 24%, transparent);
  transform: translateY(calc(var(--ui-motion-distance-enter) * -0.125));
}

.ui-button--secondary {
  color: var(--ui-color-text);
  background: var(--ui-color-surface);
  border-color: var(--ui-color-border);
}

.ui-button--secondary:hover:not(:disabled),
.ui-button--ghost:hover:not(:disabled) {
  background: var(--ui-color-accent-soft);
  border-color: color-mix(in srgb, var(--ui-color-accent) 45%, var(--ui-color-border));
}

.ui-button--ghost {
  color: var(--ui-color-accent);
  background: transparent;
}

.ui-button--sm {
  min-height: 32px;
  padding: var(--ui-space-1) var(--ui-space-3);
  font-size: var(--ui-font-size-caption);
}

.ui-button--lg {
  min-height: 48px;
  padding: var(--ui-space-3) var(--ui-space-6);
  font-size: var(--ui-font-size-body-large);
}

.ui-button:focus-visible {
  outline: var(--ui-focus-width) solid var(--ui-color-focus);
  outline-offset: var(--ui-focus-offset);
}

.ui-button:active:not(:disabled) {
  transform: scale(var(--ui-motion-scale-press));
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
  border-radius: var(--ui-radius-pill);
  animation: ui-button-spin 800ms linear infinite;
}

@keyframes ui-button-spin {
  to { transform: rotate(360deg); }
}

:global([data-ui-motion='reduced']) .ui-button__spinner {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .ui-button__spinner { animation: none; }
  .ui-button--primary:hover:not(:disabled) { transform: none; }
}

@media (pointer: coarse) {
  .ui-button { min-height: 44px; }
}
</style>
