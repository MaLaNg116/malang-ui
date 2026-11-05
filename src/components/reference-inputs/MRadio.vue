<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId } from 'vue';
import type { MRadioProps } from './types';

defineOptions({ inheritAttrs: false });
const props = defineProps<MRadioProps>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs(), identity = `ui-radio-control-${useId()}`, input = ref<HTMLInputElement>();
const controlId = computed(() => props.id || identity);
const describedBy = computed(() => [...new Set([attrs['aria-describedby'], props.hint && `${controlId.value}-hint`, props.error && `${controlId.value}-error`].filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined);
let owner: Document | undefined, timer: ReturnType<typeof setTimeout> | undefined, alive = false;
function sync() { if (input.value) input.value.checked = props.modelValue === props.value; }
function cancelReset() { if (timer !== undefined) clearTimeout(timer); timer = undefined; }
function sameGroup(target: EventTarget | null) {
  const control = input.value;
  if (!control || !target || !(target instanceof control.ownerDocument.defaultView!.HTMLInputElement) || target.type !== 'radio') return false;
  return target === control || !!control.name && target.name === control.name && target.form === control.form && target.getRootNode() === control.getRootNode();
}
function groupChange(event: Event) {
  if (!sameGroup(event.target)) return;
  cancelReset();
  // Native activation unchecks sibling radios before dispatching change. Every
  // instance in this native group restores its own controlled state after emit.
  void nextTick(() => { if (alive) sync(); });
}
function change() { if (!props.disabled && props.modelValue !== props.value) emit('update:modelValue', props.value); void nextTick(() => { if (alive) sync(); }); }
function reset(event: Event) {
  if (input.value?.form !== event.target) return;
  cancelReset(); timer = setTimeout(() => { timer = undefined; if (alive && !event.defaultPrevented) sync(); }, 0);
}
onMounted(() => { alive = true; owner = input.value?.ownerDocument; owner?.addEventListener('change', groupChange, true); owner?.addEventListener('reset', reset, true); sync(); });
onUpdated(sync);
onBeforeUnmount(() => { alive = false; cancelReset(); owner?.removeEventListener('change', groupChange, true); owner?.removeEventListener('reset', reset, true); });
</script>
<template>
  <div class="ui-radio" :class="{'ui-radio--disabled':disabled,'ui-radio--error':!!error}">
    <label class="ui-radio__label" :for="controlId">
      <input v-bind="attrs" :id="controlId" ref="input" type="radio" class="ui-radio__input" :value="value" :name="name" :form="form" :required="required" :disabled="disabled" :checked="modelValue===value" :aria-describedby="describedBy" :aria-invalid="error ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined" @change="change">
      <span class="ui-radio__text">{{label}}</span>
    </label>
    <p v-if="hint" :id="`${controlId}-hint`" class="ui-radio__hint">{{hint}}</p>
    <p v-if="error" :id="`${controlId}-error`" class="ui-radio__error" role="alert">{{error}}</p>
  </div>
</template>
<style scoped>
.ui-radio{min-width:0;color:var(--ui-color-text);font:var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family)}.ui-radio__label{display:inline-flex;align-items:center;gap:12px;min-height:var(--ui-control-height);max-width:100%;cursor:pointer}.ui-radio__input{appearance:none;box-sizing:border-box;flex:none;position:relative;width:20px;height:20px;margin:0;border:1px solid var(--ui-color-border);border-radius:50%;background:var(--ui-color-surface);cursor:inherit;transition:border-color var(--ui-motion-duration-feedback)}.ui-radio__input::after{content:'';position:absolute;inset:4px;background:var(--ui-color-accent);border-radius:50%;transform:scale(0);transition:transform var(--ui-motion-duration-feedback)}.ui-radio__input:checked{border-color:var(--ui-color-accent)}.ui-radio__input:checked::after{transform:scale(1)}.ui-radio__input:focus-visible{outline:2px solid var(--ui-color-focus);outline-offset:3px}.ui-radio__text{overflow-wrap:anywhere;min-width:0}.ui-radio__hint,.ui-radio__error{margin:4px 0 0 32px;font-size:12px;overflow-wrap:anywhere}.ui-radio__hint{color:var(--ui-color-text-secondary)}.ui-radio__error{color:var(--ui-color-danger)}.ui-radio--error .ui-radio__input{border-color:var(--ui-color-danger)}.ui-radio--disabled{opacity:.5}.ui-radio--disabled .ui-radio__label{cursor:not-allowed}@media(pointer:coarse){.ui-radio__label{min-height:44px}}:global([data-ui-motion=reduced] .ui-radio__input),:global([data-ui-motion=reduced] .ui-radio__input::after){transition:none}@media(prefers-reduced-motion:reduce){.ui-radio__input,.ui-radio__input::after{transition:none}}@media(forced-colors:active){.ui-radio__input{appearance:auto;background:none}.ui-radio__input::after{display:none}}
</style>
