<script setup lang="ts">
import { nextTick, onMounted, useAttrs, useId, watch } from 'vue';
import type { MRadioGroupProps } from './types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MRadioGroupProps>(), { disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const identity = `ui-radio-${useId()}`;
const legendId = `${identity}-label`;
const hintId = `${identity}-hint`;
const errorId = `${identity}-error`;
const controls = new Map<string, HTMLInputElement>();
function describedBy() {
  return [...new Set([attrs['aria-describedby'], props.hint && hintId, props.error && errorId]
    .filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined;
}
function rootAttrs() { return Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'required')); }
function sync() { for (const [value, control] of controls) control.checked = value === props.modelValue; }
function change(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  if (!props.disabled && props.options.some(option => option.value === value && !option.disabled) && value !== props.modelValue) emit('update:modelValue', value);
  void nextTick(sync);
}
onMounted(sync);
watch(() => [props.modelValue, props.options], sync, { deep: true, flush: 'post' });
</script>

<template>
  <fieldset
    v-bind="rootAttrs()" class="ui-radio-group" :class="{ 'ui-radio-group--error': Boolean(error) }" role="radiogroup" :disabled="disabled"
    :aria-labelledby="legendId" :aria-describedby="describedBy()" :aria-invalid="error ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined"
  >
    <legend :id="legendId" class="ui-radio-group__legend">{{ label }}</legend>
    <div class="ui-radio-group__options">
      <label v-for="(option, index) in options" :key="option.value" class="ui-radio-group__option" :class="{ 'ui-radio-group__option--disabled': disabled || option.disabled }">
        <input
          :ref="element => { if (element) controls.set(option.value, element as HTMLInputElement); else controls.delete(option.value); }"
          class="ui-radio-group__input" type="radio" :name="name || identity" :value="option.value" :checked="modelValue === option.value"
          :disabled="disabled || option.disabled" :required="attrs.required === '' || Boolean(attrs.required)" :form="attrs.form as string | undefined"
          :aria-describedby="option.description ? identity + '-description-' + index : undefined" @change="change"
        >
        <span class="ui-radio-group__copy"><span class="ui-radio-group__text">{{ option.label }}</span><span v-if="option.description" :id="identity + '-description-' + index" class="ui-radio-group__description">{{ option.description }}</span></span>
      </label>
    </div>
    <p v-if="hint" :id="hintId" class="ui-radio-group__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="ui-radio-group__error" role="alert">{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.ui-radio-group { box-sizing: border-box; min-width: 0; margin: 0; padding: 0; border: 0; color: var(--ui-color-text); font: var(--ui-font-weight-body) var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-radio-group__legend { padding: 0; margin-bottom: var(--ui-space-2); font-size: var(--ui-font-size-caption); font-weight: var(--ui-font-weight-emphasis); letter-spacing: .04em; }
.ui-radio-group__options { display: grid; gap: var(--ui-space-2); }
.ui-radio-group__option { display: flex; align-items: center; gap: var(--ui-space-3); min-height: var(--ui-control-height); min-width: 0; cursor: pointer; }
.ui-radio-group__input { appearance: none; position: relative; flex: none; box-sizing: border-box; width: 20px; height: 20px; border: 1px solid var(--ui-color-border); border-radius: 50%; margin: 0; background: var(--ui-color-surface); cursor: inherit; transition: border-color var(--ui-motion-duration-transition); }
.ui-radio-group__input::after { content: ''; position: absolute; inset: 4px; border-radius: 50%; background: var(--ui-color-accent); transform: scale(0); transition: transform var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
.ui-radio-group__input:checked { border-color: var(--ui-color-accent); }
.ui-radio-group__input:checked::after { transform: scale(1); }
.ui-radio-group__input:hover:not(:disabled) { border-color: var(--ui-color-accent); }
.ui-radio-group__input:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: var(--ui-focus-offset); }
.ui-radio-group__copy { display: grid; min-width: 0; gap: 3px; }
.ui-radio-group__text, .ui-radio-group__description { overflow-wrap: anywhere; }
.ui-radio-group__description, .ui-radio-group__hint, .ui-radio-group__error { font-size: var(--ui-font-size-caption); }
.ui-radio-group__description, .ui-radio-group__hint { color: var(--ui-color-text-secondary); }
.ui-radio-group__hint, .ui-radio-group__error { margin: var(--ui-space-2) 0 0; }
.ui-radio-group__error { color: var(--ui-color-danger); }
.ui-radio-group--error .ui-radio-group__input { border-color: var(--ui-color-danger); }
.ui-radio-group__option--disabled { opacity: .55; cursor: not-allowed; }
@media (pointer: coarse) { .ui-radio-group__option { min-height: 44px; } }
:global([data-ui-motion='reduced'] .ui-radio-group__input), :global([data-ui-motion='reduced'] .ui-radio-group__input::after) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-radio-group__input, .ui-radio-group__input::after { transition: none; } }
@media (forced-colors: active) { .ui-radio-group__input { appearance: auto; background: none; } .ui-radio-group__input::after { display: none; } }
</style>
