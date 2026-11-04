<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';
import type { MSwitchProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<MSwitchProps>(), {
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
  min-height: var(--ui-control-height);
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
  width: 44px;
  height: 24px;
  margin: 0;
  border: var(--ui-border-width) solid var(--ui-color-border);
  border-radius: 1px;
  background: var(--ui-color-surface);
  cursor: inherit;
  transition:
    background-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard),
    border-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-switch__input::before {
  content: '';
  position: absolute;
  top: 8px;
  right: 6px;
  width: 6px;
  height: 6px;
  border: 1px solid var(--ui-color-text-secondary);
  border-radius: 50%;
}

.ui-switch__input::after {
  content: '';
  display: block;
  position: absolute;
  top: 3px;
  left: 3px;
  height: 16px;
  width: 14px;
  clip-path: polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 0 100%);
  background-color: var(--ui-color-text-secondary);
  background-image: linear-gradient(90deg, var(--ui-color-surface) 1px, transparent 1px, transparent 3px, var(--ui-color-surface) 3px, var(--ui-color-surface) 4px, transparent 4px);
  background-size: 4px 6px;
  background-position: center;
  background-repeat: no-repeat;
  transition:
    transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized),
    background-color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}

.ui-switch__input:checked {
  border-color: var(--ui-color-accent);
  background: var(--ui-color-accent-soft);
}

.ui-switch__input:hover:not(:disabled) {
  border-color: var(--ui-color-accent);
}

.ui-switch__input:checked::before {
  top: 7px;
  right: auto;
  left: 7px;
  width: 2px;
  height: 8px;
  border: 0;
  border-radius: 0;
  background: var(--ui-color-accent);
}

.ui-switch__input:checked::after {
  transform: translateX(22px);
  background-color: var(--ui-color-accent);
  background-image: linear-gradient(90deg, var(--ui-color-on-accent) 1px, transparent 1px, transparent 3px, var(--ui-color-on-accent) 3px, var(--ui-color-on-accent) 4px, transparent 4px);
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

:global([data-ui-motion='reduced'] .ui-switch__input),
:global([data-ui-motion='reduced'] .ui-switch__input::after) {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .ui-switch__input,
  .ui-switch__input::after { transition: none; }
}

@media (pointer: coarse) {
  .ui-switch { min-height: 44px; }
}
</style>
