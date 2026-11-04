<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, useId, watch } from 'vue';
import type { MSelectProps } from './types';
import './nativeField.css';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MSelectProps>(), { disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const control = ref<HTMLSelectElement>();
const identity = `ui-select-${useId()}`;
const id = computed(() => props.id || identity);
const hintId = computed(() => `${id.value}-hint`);
const errorId = computed(() => `${id.value}-error`);
function describedBy() {
  return [...new Set([attrs['aria-describedby'], props.hint && hintId.value, props.error && errorId.value]
    .filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined;
}
function sync() { if (control.value) control.value.value = props.modelValue ?? ''; }
function change(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (!props.disabled && value !== props.modelValue) emit('update:modelValue', value);
  // Native controls change before the owner confirms a controlled value.
  void nextTick(sync);
}
onMounted(sync);
watch(() => [props.modelValue, props.options], sync, { deep: true, flush: 'post' });
</script>

<template>
  <div class="ui-native-field" :class="{ 'ui-native-field--disabled': disabled, 'ui-native-field--error': Boolean(error) }">
    <label v-if="label" class="ui-native-field__label" :for="id">{{ label }}</label>
    <div class="ui-native-field__control">
      <select
        v-bind="attrs" :id="id" ref="control" class="ui-native-control ui-select" :value="modelValue" :multiple="false" :disabled="disabled"
        :aria-invalid="error ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined"
        :aria-describedby="describedBy()" @change="change"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">{{ option.label }}</option>
      </select>
      <svg class="ui-select__chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" /></svg>
      <span class="ui-native-field__registration" aria-hidden="true" />
    </div>
    <p v-if="hint" :id="hintId" class="ui-native-field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="ui-native-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.ui-select { height: var(--ui-control-height); appearance: none; padding-inline-end: calc(var(--ui-control-padding-inline) + 24px); cursor: pointer; }
.ui-select option { color: var(--ui-color-text); background: var(--ui-color-surface); }
.ui-select__chevron { position: absolute; inset-inline-end: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--ui-color-text-secondary); }
.ui-native-field--disabled .ui-select__chevron { opacity: .45; }
@media (forced-colors: active) { .ui-select { appearance: auto; } .ui-select__chevron { display: none; } }
</style>
