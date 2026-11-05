<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, useId } from 'vue';
import MCheckbox from '../MCheckbox.vue';
import type { MChoiceOption } from '../types';
import { useMConfig } from '../../composables/useConfig';
const props = defineProps<{ modelValue: readonly string[]; options: readonly MChoiceOption[]; label: string; name?: string; form?: string; disabled?: boolean; required?: boolean; min?: number; max?: number; error?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
const { t } = useMConfig();
const root = ref<HTMLFieldSetElement>(), constraint = ref<HTMLInputElement>(), reported = ref(false), errorId = `ui-checkbox-group-error-${useId()}`;
const available = computed(() => new Set(props.options.filter(option => !option.disabled).map(option => option.value)));
const selected = computed(() => new Set(props.modelValue.filter(value => available.value.has(value))));
const minimum = computed(() => Math.max(props.required ? 1 : 0, props.min ?? 0));
const configuration = computed(() => !Number.isInteger(minimum.value) || minimum.value < 0 || props.min !== undefined && (!Number.isInteger(props.min) || props.min < 0) || props.max !== undefined && (!Number.isInteger(props.max) || props.max < minimum.value));
const constraintMessage = computed(() => {
  if (configuration.value) return t('checkboxGroup.bounds', '选择数量范围无效。');
  const count = selected.value.size;
  if (count < minimum.value) return t('checkboxGroup.min', '所选项目不足。') + ` (${count}/${minimum.value})`;
  if (props.max !== undefined && count > props.max) return t('checkboxGroup.max', '所选项目超出上限。') + ` (${count}/${props.max})`;
  return '';
});
const displayedError = computed(() => props.error || (reported.value ? constraintMessage.value : ''));
function update(value: string, checked: boolean) {
  if (props.disabled || !available.value.has(value)) return;
  const next = checked ? props.modelValue.includes(value) ? [...props.modelValue] : [...props.modelValue, value] : props.modelValue.filter(item => item !== value);
  const count = new Set(next.filter(item => available.value.has(item))).size;
  if (checked && props.max !== undefined && count > props.max) return;
  emit('update:modelValue', next);
}
function validity() { constraint.value?.setCustomValidity(props.disabled ? '' : constraintMessage.value); }
function invalidEvent(event: Event) { event.preventDefault(); reported.value = true; root.value?.querySelector<HTMLInputElement>('input[type=checkbox]:not(:disabled)')?.focus(); }
let owner: Document | undefined, timer: ReturnType<typeof setTimeout> | undefined;
function cancelReset() { if (timer !== undefined) clearTimeout(timer); timer = undefined; }
function reset(event: Event) {
  if (constraint.value?.form !== event.target) return;
  cancelReset(); timer = setTimeout(() => {
    timer = undefined; if (event.defaultPrevented) return;
    root.value?.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(input => { input.checked = props.modelValue.includes(input.value); });
    reported.value = false; validity();
  }, 0);
}
onMounted(() => { owner = root.value?.ownerDocument; owner?.addEventListener('reset', reset, true); root.value?.addEventListener('input', cancelReset, true); validity(); });
onUpdated(validity);
onBeforeUnmount(() => { cancelReset(); owner?.removeEventListener('reset', reset, true); root.value?.removeEventListener('input', cancelReset, true); });
</script>
<template>
  <fieldset ref="root" class="ui-checkbox-group" :disabled="disabled" :aria-invalid="!!(error || constraintMessage) || undefined" :aria-describedby="displayedError ? errorId : undefined">
    <legend>{{ label }}</legend>
    <div class="ui-checkbox-group__options">
      <MCheckbox v-for="option in options" :key="option.value" :model-value="modelValue.includes(option.value)" :label="option.label" :name="name" :form="form" :value="option.value" :disabled="disabled || option.disabled || (!modelValue.includes(option.value) && max !== undefined && selected.size >= max)" @update:model-value="update(option.value, $event)" />
    </div>
    <input ref="constraint" class="ui-checkbox-group__constraint" type="text" tabindex="-1" aria-hidden="true" :form="form" :disabled="disabled" @invalid="invalidEvent">
    <p v-if="displayedError" :id="errorId" role="alert">{{ displayedError }}</p>
  </fieldset>
</template>
<style scoped>.ui-checkbox-group { position:relative; margin: 0; padding: 0; border: 0; min-width: 0; font: 14px/1.5 var(--ui-font-family); color: var(--ui-color-text); }.ui-checkbox-group legend { padding: 0; margin-bottom: 10px; }.ui-checkbox-group__options { display: flex; flex-wrap: wrap; gap: 14px 20px; }.ui-checkbox-group p { color: var(--ui-color-danger); overflow-wrap:anywhere; }.ui-checkbox-group__constraint { position:absolute; inline-size:1px; block-size:1px; opacity:0; pointer-events:none; inset-inline-start:0; bottom:0; }</style>
