<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, useId, watch } from 'vue';
import type { MInputNumberProps } from './types';
import './nativeField.css';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MInputNumberProps>(), { step: 1, disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>();
const attrs = useAttrs();
const control = ref<HTMLInputElement>();
const identity = `ui-input-number-${useId()}`;
const id = computed(() => props.id || identity);
const minimum = computed(() => Number.isFinite(props.min) ? props.min : undefined);
const maximum = computed(() => Number.isFinite(props.max) ? Math.max(minimum.value ?? -Infinity, props.max!) : undefined);
const increment = computed(() => Number.isFinite(props.step) && props.step > 0 ? props.step : 1);
function clamp(value: number) { return Math.max(minimum.value ?? -Infinity, Math.min(maximum.value ?? Infinity, value)); }
const current = computed(() => typeof props.modelValue === 'number' && Number.isFinite(props.modelValue) ? clamp(props.modelValue) : null);
const draft = ref(current.value === null ? '' : String(current.value));
let editing = false;
let composing = false;
let invalidDraft = false;
let pending: number | null | undefined;
let requestId = 0;

function readOnly() { return attrs.readonly != null && attrs.readonly !== false; }
function locked() { return props.disabled || readOnly(); }
function describedBy() {
  return [...new Set([attrs['aria-describedby'], props.hint && `${id.value}-hint`, props.error && `${id.value}-error`]
    .filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined;
}
function sync() {
  if (composing) return;
  invalidDraft = false;
  draft.value = current.value === null ? '' : String(current.value);
  if (control.value && control.value.value !== draft.value) control.value.value = draft.value;
}
function request(value: number | null) {
  if (locked() || value === props.modelValue || value === pending) return;
  const token = ++requestId;
  pending = value;
  emit('update:modelValue', value);
  void nextTick(() => {
    if (token !== requestId) return;
    // Keep an accepted editing draft, but restore a declined controlled value.
    if (props.modelValue !== value) sync();
    pending = undefined;
  });
}
function input(event: Event) {
  const element = event.target as HTMLInputElement;
  draft.value = element.value;
  invalidDraft = element.validity.badInput;
  if (locked()) { sync(); return; }
  if (composing || (event as InputEvent).isComposing) return;
  if (invalidDraft) return;
  if (element.value === '') request(null);
  else if (Number.isFinite(element.valueAsNumber)) request(clamp(element.valueAsNumber));
}
function commit() {
  editing = false;
  if (composing) return;
  const element = control.value;
  if (element && !invalidDraft && !element.validity.badInput) {
    if (element.value === '') request(null);
    else if (Number.isFinite(element.valueAsNumber)) request(clamp(element.valueAsNumber));
  }
  void nextTick(sync);
}
function finishComposition(event: CompositionEvent) { composing = false; input(event); }
function step(direction: 1 | -1) {
  const element = control.value;
  if (!element || locked() || composing) return;
  const value = Number.isFinite(element.valueAsNumber) ? clamp(element.valueAsNumber) : current.value;
  element.value = value === null ? '' : String(value);
  // Native stepping implements the decimal step grid without binary-float drift.
  if (direction > 0) element.stepUp(); else element.stepDown();
  draft.value = element.value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}
watch(() => props.modelValue, () => {
  if (editing && props.modelValue === pending) return;
  sync();
}, { flush: 'post' });
watch(() => [props.min, props.max, props.step, props.disabled], sync, { flush: 'post' });
</script>

<template>
  <div class="ui-native-field ui-input-number" :class="{ 'ui-native-field--disabled': disabled, 'ui-native-field--error': Boolean(error) }">
    <label class="ui-native-field__label ui-input-number__label" :for="id">{{ label }}</label>
    <div class="ui-native-field__control ui-input-number__control">
      <button class="ui-input-number__step" type="button" :aria-label="'减少' + label" :disabled="locked() || (current !== null && minimum !== undefined && current <= minimum)" @click="step(-1)"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10" stroke="currentColor" stroke-width="1.5" /></svg></button>
      <input v-bind="attrs" :id="id" ref="control" class="ui-native-control ui-input-number__input" type="number" :value="draft" :min="minimum" :max="maximum" :step="increment" :disabled="disabled" :aria-describedby="describedBy()" :aria-invalid="error ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined" @input="input" @focus="editing = true" @blur="commit" @compositionstart="composing = true" @compositionend="finishComposition">
      <button class="ui-input-number__step" type="button" :aria-label="'增加' + label" :disabled="locked() || (current !== null && maximum !== undefined && current >= maximum)" @click="step(1)"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M8 3v10" stroke="currentColor" stroke-width="1.5" /></svg></button>
      <span class="ui-native-field__registration" aria-hidden="true"></span>
    </div>
    <p v-if="hint" :id="`${id}-hint`" class="ui-native-field__hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="ui-native-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.ui-input-number__label { max-width: 100%; overflow-wrap: anywhere; }
.ui-input-number__control { --ui-number-line: var(--ui-color-border); display: grid; grid-template-columns: var(--ui-control-height) minmax(0, 1fr) var(--ui-control-height); }
.ui-input-number__input { height: var(--ui-control-height); padding-inline: 10px; text-align: center; font-family: var(--ui-font-family-mono); font-variant-numeric: tabular-nums; appearance: textfield; border-bottom-color: var(--ui-number-line); }
.ui-input-number__input::-webkit-inner-spin-button, .ui-input-number__input::-webkit-outer-spin-button { margin: 0; -webkit-appearance: none; }
.ui-input-number__step { box-sizing: border-box; display: grid; place-items: center; min-width: 0; min-height: var(--ui-control-height); padding: 0; border: 1px solid transparent; border-bottom-color: var(--ui-number-line); border-radius: 0; background: var(--ui-color-surface); color: var(--ui-color-text-secondary); cursor: pointer; transition: color var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard), background-color var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
.ui-input-number__step:first-child { border-inline-end-color: var(--ui-color-rule); }
.ui-input-number__step:last-of-type { border-inline-start-color: var(--ui-color-rule); }
.ui-input-number__step:hover:not(:disabled) { background: var(--ui-color-accent-soft); color: var(--ui-color-accent); }
.ui-input-number__step:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -4px; color: var(--ui-color-accent); }
.ui-input-number__step:disabled { opacity: .45; cursor: not-allowed; }
.ui-input-number__control:focus-within { --ui-number-line: var(--ui-color-focus); }
.ui-input-number__control:focus-within .ui-input-number__step, .ui-input-number__control:focus-within .ui-input-number__input { border-bottom-color: var(--ui-number-line); box-shadow: inset 0 -1px 0 var(--ui-number-line); }
.ui-native-field--error .ui-input-number__control { --ui-number-line: var(--ui-color-danger); }
:global([data-ui-motion='reduced'] .ui-input-number__step) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-input-number__step { transition: none; } }
@media (pointer: coarse) { .ui-input-number__control { grid-template-columns: 44px minmax(0, 1fr) 44px; } .ui-input-number__step, .ui-input-number__input { min-height: 44px; } }
@media (forced-colors: active) { .ui-input-number__step { border-color: CanvasText; } .ui-input-number__step:focus-visible { outline-color: Highlight; } }
</style>
