<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, useId, watch } from 'vue';
import type { MFormItemProps } from './types';
import { formContextKey } from './formContext';

const props = withDefaults(defineProps<MFormItemProps>(), { disabled: false });
const context = inject(formContextKey, undefined);
const element = ref<HTMLElement>();
const id = `ui-form-field-${useId()}`;
const error = computed(() => context && Object.hasOwn(context.errors.value, props.name) ? context.errors.value[props.name] : '');
const disabled = computed(() => props.disabled || context?.disabled.value || false);
let unregister: (() => void) | undefined;
watch(() => props.name, name => {
  unregister?.();
  unregister = context?.register(name, { id, label: () => props.label, disabled: () => disabled.value, element: () => element.value });
}, { immediate: true });
onBeforeUnmount(() => unregister?.());
// Explicit bindings keep the input's own label, error and native form contract.
const field = computed(() => ({ id, name: props.name, label: props.label, hint: props.hint, error: error.value || undefined,
  required: props.required || context?.required(props.name) || undefined, disabled: disabled.value,
  onBlur: () => context?.blur(props.name) }));
</script>

<template>
  <div ref="element" class="ui-form-item" :data-invalid="!!error || undefined">
    <slot :field="field" :error="error" :validating="context?.validating.value || false" />
  </div>
</template>

<style scoped>
.ui-form-item { min-width: 0; }
</style>
