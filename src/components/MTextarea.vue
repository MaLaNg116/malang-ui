<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, useId } from 'vue';
import type { MTextareaProps } from './types';
import './nativeField.css';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MTextareaProps>(), { rows: 4, disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const control = ref<HTMLTextAreaElement>();
const identity = `ui-textarea-${useId()}`;
const id = computed(() => props.id || identity);
const hintId = computed(() => `${id.value}-hint`);
const errorId = computed(() => `${id.value}-error`);
const rowCount = computed(() => Number.isFinite(props.rows) ? Math.max(1, Math.floor(props.rows)) : 4);
function describedBy() {
  return [...new Set([attrs['aria-describedby'], props.hint && hintId.value, props.error && errorId.value]
    .filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined;
}
let pending: string | undefined;
const value = computed({
  get: () => props.modelValue,
  set(next: string | number) {
    const text = String(next);
    if (props.disabled || text === props.modelValue || text === pending) return;
    pending = text;
    emit('update:modelValue', text);
    void nextTick(() => {
      const element = control.value as (HTMLTextAreaElement & { composing?: boolean }) | undefined;
      if (element && !element.composing && element.value !== props.modelValue) element.value = props.modelValue ?? '';
    });
    // Composition completion may dispatch synthetic and native input together.
    queueMicrotask(() => { if (pending === text) pending = undefined; });
  },
});
</script>

<template>
  <div class="ui-native-field" :class="{ 'ui-native-field--disabled': disabled, 'ui-native-field--error': Boolean(error) }">
    <label v-if="label" class="ui-native-field__label" :for="id">{{ label }}</label>
    <div class="ui-native-field__control">
      <textarea
        v-bind="attrs" :id="id" ref="control" v-model="value" class="ui-native-control ui-textarea" :rows="rowCount" :disabled="disabled"
        :aria-invalid="error ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined"
        :aria-describedby="describedBy()"
      />
      <span class="ui-native-field__registration" aria-hidden="true" />
    </div>
    <p v-if="hint" :id="hintId" class="ui-native-field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="ui-native-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.ui-textarea { padding-block: var(--ui-space-3); resize: vertical; overflow: auto; }
</style>
