<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';
import type { UiInputProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiInputProps>(), {
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
  <div class="ui-field" :class="{ 'ui-field--disabled': disabled }">
    <label v-if="label" class="ui-field__label" :for="inputId">{{ label }}</label>
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
}

.ui-input {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  min-height: var(--ui-control-height);
  padding: var(--ui-space-2) var(--ui-control-padding-inline);
  border: var(--ui-border-width) solid var(--ui-color-border);
  border-radius: var(--ui-radius-control);
  background: var(--ui-color-surface);
  color: var(--ui-color-text);
  font: inherit;
  transition:
    border-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    box-shadow var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-input::placeholder {
  color: var(--ui-color-text-secondary);
  opacity: 1;
}

.ui-input:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--ui-color-accent) 48%, var(--ui-color-border));
}

.ui-input:focus-visible {
  outline: var(--ui-focus-width) solid var(--ui-color-focus);
  outline-offset: var(--ui-focus-offset);
  border-color: var(--ui-color-accent);
}

.ui-input--error,
.ui-input--error:hover:not(:disabled) {
  border-color: var(--ui-color-danger);
}

.ui-input--error:focus-visible {
  outline-color: var(--ui-color-danger);
}

.ui-input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

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
</style>
