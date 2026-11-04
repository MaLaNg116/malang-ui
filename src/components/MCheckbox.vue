<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, useId, watch } from 'vue';
import type { MCheckboxProps } from './types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MCheckboxProps>(), { indeterminate: false, disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const attrs = useAttrs();
const control = ref<HTMLInputElement>();
const identity = `ui-checkbox-${useId()}`;
const id = computed(() => props.id || identity);
const hintId = computed(() => `${id.value}-hint`);
const errorId = computed(() => `${id.value}-error`);
function describedBy() {
  return [...new Set([attrs['aria-describedby'], props.hint && hintId.value, props.error && errorId.value]
    .filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined;
}
function sync() {
  if (!control.value) return;
  control.value.checked = Boolean(props.modelValue);
  control.value.indeterminate = Boolean(props.indeterminate);
}
function change(event: Event) {
  if (!props.disabled) emit('update:modelValue', (event.target as HTMLInputElement).checked);
  void nextTick(sync);
}
onMounted(sync);
watch(() => [props.modelValue, props.indeterminate], sync, { flush: 'post' });
</script>

<template>
  <div class="ui-checkbox" :class="{ 'ui-checkbox--disabled': disabled, 'ui-checkbox--error': Boolean(error) }">
    <label class="ui-checkbox__label" :for="id">
      <span class="ui-checkbox__control">
        <input
          v-bind="attrs" :id="id" ref="control" class="ui-checkbox__input" type="checkbox" :checked="modelValue" :disabled="disabled"
          :aria-checked="indeterminate ? 'mixed' : modelValue"
          :aria-invalid="error ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined"
          :aria-describedby="describedBy()" @change="change"
        >
        <svg class="ui-checkbox__mark" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path v-if="indeterminate" d="M5 10h10" /><path v-else d="m5 10 3 3 7-7" /></svg>
      </span>
      <span v-if="label" class="ui-checkbox__text">{{ label }}</span>
    </label>
    <p v-if="hint" :id="hintId" class="ui-checkbox__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="ui-checkbox__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.ui-checkbox { min-width: 0; color: var(--ui-color-text); font: var(--ui-font-weight-body) var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-checkbox__label { display: inline-flex; align-items: center; gap: var(--ui-space-3); min-height: var(--ui-control-height); cursor: pointer; max-width: 100%; }
.ui-checkbox__control { position: relative; flex: none; width: 20px; height: 20px; }
.ui-checkbox__input { appearance: none; display: block; box-sizing: border-box; width: 20px; height: 20px; margin: 0; border: 1px solid var(--ui-color-border); border-radius: 1px; background: var(--ui-color-surface); cursor: inherit; transition: background-color var(--ui-motion-duration-transition), border-color var(--ui-motion-duration-transition); }
.ui-checkbox__input:checked, .ui-checkbox__input:indeterminate, .ui-checkbox__input[aria-checked='mixed'] { background: var(--ui-color-accent); border-color: var(--ui-color-accent); }
.ui-checkbox__input:hover:not(:disabled) { border-color: var(--ui-color-accent); }
.ui-checkbox__mark { position: absolute; inset: 0; width: 20px; height: 20px; pointer-events: none; opacity: 0; stroke: var(--ui-color-on-accent); stroke-width: 1.7; stroke-linecap: square; stroke-linejoin: miter; }
.ui-checkbox__input:checked + .ui-checkbox__mark, .ui-checkbox__input:indeterminate + .ui-checkbox__mark, .ui-checkbox__input[aria-checked='mixed'] + .ui-checkbox__mark { opacity: 1; }
.ui-checkbox__input:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: var(--ui-focus-offset); }
.ui-checkbox__text { min-width: 0; overflow-wrap: anywhere; }
.ui-checkbox__hint, .ui-checkbox__error { margin: var(--ui-space-1) 0 0 32px; font-size: var(--ui-font-size-caption); overflow-wrap: anywhere; }
.ui-checkbox__hint { color: var(--ui-color-text-secondary); }
.ui-checkbox__error { color: var(--ui-color-danger); }
.ui-checkbox--error .ui-checkbox__input { border-color: var(--ui-color-danger); }
.ui-checkbox--disabled .ui-checkbox__label { cursor: not-allowed; opacity: .55; }
@media (pointer: coarse) { .ui-checkbox__label { min-height: 44px; } }
:global([data-ui-motion='reduced'] .ui-checkbox__input) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-checkbox__input { transition: none; } }
@media (forced-colors: active) { .ui-checkbox__input { appearance: auto; background: none; } .ui-checkbox__mark { display: none; } }
</style>
