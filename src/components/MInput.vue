<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';
import type { MInputProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<MInputProps>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const generatedId = `ui-input-${useId()}`;
const inputId = computed(() => props.id || generatedId);
const hintId = computed(() => `${inputId.value}-hint`);
const errorId = computed(() => `${inputId.value}-error`);
function describedBy() {
  const ids = [attrs['aria-describedby'], props.hint && hintId.value, props.error && errorId.value]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/);
  return [...new Set(ids)].filter(Boolean).join(' ') || undefined;
}

let pendingEmission: string | undefined;
const value = computed({
  get: () => props.modelValue,
  set(next: string | number) {
    const text = String(next);
    if (text === props.modelValue || text === pendingEmission) return;
    pendingEmission = text;
    emit('update:modelValue', text);
    // IME completion can produce a synthetic input followed by a native input
    // in the same turn. Later edits remain free to retry a controlled value.
    queueMicrotask(() => {
      if (pendingEmission === text) pendingEmission = undefined;
    });
  },
});
</script>

<template>
  <div class="ui-field" :class="{ 'ui-field--disabled': disabled, 'ui-field--error': Boolean(error) }">
    <label v-if="label" class="ui-field__label" :for="inputId">{{ label }}</label>
    <div class="ui-field__control">
      <input
        v-bind="attrs"
        :id="inputId"
        class="ui-input"
        :class="{ 'ui-input--error': Boolean(error) }"
        :type="type"
        v-model="value"
        :disabled="disabled"
        :aria-invalid="error ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined"
        :aria-describedby="describedBy()"
      >
      <span class="ui-field__registration" aria-hidden="true" />
    </div>
    <p v-if="hint" :id="hintId" class="ui-field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="ui-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.ui-field {
  display: grid;
  gap: var(--ui-space-2);
  min-width: 0;
  font-family: var(--ui-font-family);
  color: var(--ui-color-text);
  font-size: var(--ui-font-size-body);
  line-height: var(--ui-line-height-body);
}

.ui-field__label {
  font-weight: var(--ui-font-weight-emphasis);
  width: fit-content;
  font-size: var(--ui-font-size-caption);
  letter-spacing: 0.04em;
}

.ui-field__control {
  position: relative;
  min-width: 0;
  --ui-field-frame: var(--ui-color-text-secondary);
}

.ui-field__registration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  color: var(--ui-field-frame);
}

.ui-field__registration::before,
.ui-field__registration::after {
  content: '';
  position: absolute;
  box-sizing: border-box;
  width: 10px;
  height: 7px;
  border-color: currentColor;
  border-style: solid;
  transition:
    width var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized),
    color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-field__registration::before {
  top: 0;
  left: 0;
  border-width: 2px 0 0 2px;
}

.ui-field__registration::after {
  right: 0;
  bottom: 0;
  border-width: 0 2px 2px 0;
}

.ui-input {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  height: var(--ui-control-height);
  min-height: var(--ui-control-height);
  padding: var(--ui-space-1) var(--ui-control-padding-inline);
  border: var(--ui-border-width) solid transparent;
  border-bottom-color: var(--ui-color-border);
  border-radius: 0;
  background: var(--ui-color-surface);
  color: var(--ui-color-text);
  font: inherit;
  transition:
    border-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    box-shadow var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    background-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-input::placeholder {
  color: var(--ui-color-text-secondary);
  opacity: 1;
}

.ui-input:hover:not(:disabled) {
  border-bottom-color: color-mix(in srgb, var(--ui-color-focus) 48%, var(--ui-color-border));
}

.ui-input:focus-visible {
  outline: none;
  background: var(--ui-color-surface-raised);
  border-bottom-color: var(--ui-color-focus);
  box-shadow: inset 0 -1px 0 var(--ui-color-focus);
}

.ui-field__control:focus-within {
  --ui-field-frame: var(--ui-color-focus);
}

.ui-field__control:focus-within .ui-field__registration::before,
.ui-field__control:focus-within .ui-field__registration::after {
  width: 22px;
}

.ui-field--error .ui-field__control {
  --ui-field-frame: var(--ui-color-danger);
}

.ui-input--error,
.ui-input--error:hover:not(:disabled) {
  border-bottom-color: var(--ui-color-danger);
}

.ui-input--error:focus-visible {
  border-bottom-color: var(--ui-color-danger);
  box-shadow: inset 0 -1px 0 var(--ui-color-danger);
}

.ui-input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.ui-field--disabled .ui-field__registration { opacity: 0.45; }

.ui-field__hint,
.ui-field__error {
  margin: 0;
  font-size: var(--ui-font-size-caption);
}

.ui-field__hint { color: var(--ui-color-text-secondary); }
.ui-field__error { color: var(--ui-color-danger); }

@media (pointer: coarse) {
  .ui-input { min-height: 44px; font-size: 16px; }
}

:global([data-ui-motion='reduced'] .ui-field__registration::before),
:global([data-ui-motion='reduced'] .ui-field__registration::after) {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .ui-input,
  .ui-field__registration::before,
  .ui-field__registration::after { transition: none; }
}

@media (forced-colors: active) {
  .ui-input:focus-visible {
    outline: var(--ui-focus-width) solid Highlight;
    outline-offset: var(--ui-focus-offset);
    box-shadow: none;
  }
}
</style>
