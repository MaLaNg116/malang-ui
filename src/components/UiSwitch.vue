<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';
import type { UiSwitchProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiSwitchProps>(), {
  modelValue: false,
  disabled: false,
});
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const attrs = useAttrs();
const generatedId = `ui-switch-${useId()}`;
const inputId = computed(() => props.id || generatedId);
const labelId = computed(() => `${inputId.value}-label`);
const hintId = computed(() => `${inputId.value}-hint`);
function describedBy() {
  const ids = [attrs['aria-describedby'], props.hint && hintId.value]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/);
  return [...new Set(ids)].filter(Boolean).join(' ') || undefined;
}

function labelledBy() {
  if (attrs['aria-labelledby']) return String(attrs['aria-labelledby']);
  if (attrs['aria-label']) return undefined;
  return props.label ? labelId.value : undefined;
}

function handleChange(event: Event) {
  if (!props.disabled) emit('update:modelValue', (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <label class="ui-switch" :class="{ 'ui-switch--disabled': disabled }" :for="inputId">
    <input
      v-bind="attrs"
      :id="inputId"
      class="ui-switch__input"
      type="checkbox"
      role="switch"
      :checked="modelValue"
      :disabled="disabled"
      :aria-labelledby="labelledBy()"
      :aria-describedby="describedBy()"
      @change="handleChange"
    >
    <span v-if="label || hint" class="ui-switch__copy">
      <span v-if="label" :id="labelId" class="ui-switch__label">{{ label }}</span>
      <span v-if="hint" :id="hintId" class="ui-switch__hint">{{ hint }}</span>
    </span>
  </label>
</template>

<style scoped>
.ui-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-3);
  min-width: 0;
  font-family: var(--ui-font-family);
  color: var(--ui-color-text);
  font-size: var(--ui-font-size-body);
  line-height: var(--ui-line-height-body);
  cursor: pointer;
}

.ui-switch__input {
  appearance: none;
  box-sizing: border-box;
  position: relative;
  flex: none;
  width: 38px;
  height: 22px;
  margin: 0;
  border: var(--ui-border-width) solid var(--ui-color-border);
  border-radius: var(--ui-radius-pill);
  background: var(--ui-color-border);
  cursor: inherit;
  transition:
    background-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    border-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-switch__input::after {
  content: '';
  display: block;
  position: absolute;
  top: 3px;
  left: 3px;
  height: 14px;
  width: 14px;
  border-radius: var(--ui-radius-pill);
  background: var(--ui-color-surface);
  transition:
    transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized),
    background-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-switch__input:checked {
  border-color: var(--ui-color-accent);
  background: var(--ui-color-accent);
}

.ui-switch__input:checked::after {
  transform: translateX(16px);
  background: var(--ui-color-on-accent);
}

.ui-switch__input:focus-visible {
  outline: var(--ui-focus-width) solid var(--ui-color-focus);
  outline-offset: var(--ui-focus-offset);
}

.ui-switch__copy {
  display: grid;
  gap: var(--ui-space-1);
  min-width: 0;
}

.ui-switch__label { font-weight: var(--ui-font-weight-emphasis); }

.ui-switch__hint {
  color: var(--ui-color-text-secondary);
  font-size: var(--ui-font-size-caption);
}

.ui-switch--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (pointer: coarse) {
  .ui-switch { min-height: 44px; }
}
</style>
