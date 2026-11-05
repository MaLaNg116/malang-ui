<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowReactive, watch } from 'vue';
import type { MFormErrors, MFormModel, MFormProps, MFormValidation } from './types';
import { formContextKey } from './formContext';
import type { FormField } from './formContext';

const props = withDefaults(defineProps<MFormProps>(), { rules: () => ({}), label: '表单', disabled: false, validateOn: 'submit', showSummary: true });
const emit = defineEmits<{ submit: [model: MFormModel, event: SubmitEvent]; invalid: [errors: Readonly<MFormErrors>]; reset: [initialModel: MFormModel] }>();
const element = ref<HTMLFormElement>();
const errors = ref<MFormErrors>(Object.create(null));
const validating = ref(false);
const fields = shallowReactive(new Map<string, FormField>());
const composing = new Set<EventTarget>();
const summary = computed(() => Object.entries(errors.value).filter(([name]) => fields.has(name)).map(([name, message]) => ({ name, message, field: fields.get(name)! })));
let alive = true, version = 0, controller: AbortController | undefined, queued = false, submitting = false;
function copy(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value);
  if (seen.has(value)) return seen.get(value);
  if (Array.isArray(value)) { const result: unknown[] = []; seen.set(value, result); for (const item of value) result.push(copy(item, seen)); return result; }
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return value;
  const result = Object.create(null) as MFormModel; seen.set(value, result);
  for (const key of Object.keys(value)) result[key] = copy((value as MFormModel)[key], seen);
  return result;
}
// Always own the outer record, including when the caller uses a class instance.
const modelCopy = (model: object) => copy({ ...model }) as MFormModel;
const initial = modelCopy(props.model);
function invalidate() { version++; controller?.abort(); controller = undefined; validating.value = false; submitting = false; }
function rulesFor(name: string) { return Object.hasOwn(props.rules, name) ? props.rules[name] : []; }
function hasComposition() {
  for (const target of composing) {
    const node = target as HTMLElement;
    if (!node.isConnected || !element.value?.contains(node) || node.matches?.(':disabled')) composing.delete(target);
  }
  return composing.size > 0;
}
function control(field: FormField) {
  const root = field.element(); if (!root) return undefined;
  return root.ownerDocument.getElementById(field.id) as HTMLElement | null
    || root.querySelector<HTMLElement>('input,select,textarea,button,[tabindex]') || undefined;
}
function focusField(name: string) {
  const field = fields.get(name); if (!field) return;
  const root = control(field);
  const target = root?.matches('input,select,textarea,button,[tabindex]') ? root : root?.querySelector<HTMLElement>('input:not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),[tabindex="0"]');
  target?.focus({ preventScroll: false });
}
function nativeError(field: FormField) {
  const root = control(field);
  const targets = root?.matches('input,select,textarea') ? [root] : [...root?.querySelectorAll<HTMLElement>('input,select,textarea') || []];
  for (const target of targets) {
    const input = target as HTMLInputElement;
    if (input.willValidate && !input.validity.valid) return input.validationMessage;
  }
  return '';
}
async function validate(names?: readonly string[]): Promise<MFormValidation> {
  invalidate();
  const ticket = version, abort = new AbortController(); controller = abort;
  const selected = [...fields.keys()].filter(name => !names || names.includes(name));
  const model = Object.freeze(modelCopy(props.model)), next: MFormErrors = Object.assign(Object.create(null), names ? errors.value : {});
  validating.value = true;
  for (const name of selected) {
    delete next[name]; const field = fields.get(name)!;
    if (props.disabled || field.disabled() || control(field)?.matches(':disabled')) continue;
    const value = model[name];
    for (const rule of rulesFor(name)) {
      const empty = value === undefined || value === null || value === '' || value === false || Array.isArray(value) && value.length === 0;
      const length = typeof value === 'number' ? value : typeof value === 'string' || Array.isArray(value) ? value.length : undefined;
      let message = '';
      if (rule.required && empty) message = `${field.label()}不能为空。`;
      else if (typeof value === 'number' && !Number.isFinite(value)) message = `${field.label()}需要有效数值。`;
      else if (!empty && rule.min !== undefined && length !== undefined && length < rule.min) message = `${field.label()}至少为 ${rule.min}。`;
      else if (!empty && rule.max !== undefined && length !== undefined && length > rule.max) message = `${field.label()}不能超过 ${rule.max}。`;
      else if (!empty && rule.pattern && !new RegExp(rule.pattern.source, rule.pattern.flags).test(String(value))) message = `${field.label()}格式不正确。`;
      if (!message && rule.validator) {
        try { const result = await rule.validator(value, model, abort.signal); if (result === false) message = `${field.label()}未通过校验。`; else if (typeof result === 'string') message = result.trim() || `${field.label()}未通过校验。`; }
        catch (error) { if (!abort.signal.aborted) message = error instanceof Error && error.message.trim() ? error.message : `${field.label()}校验未完成，请重试。`; }
      }
      if (!alive || ticket !== version || abort.signal.aborted) return { valid: false, errors: { ...errors.value }, cancelled: true };
      if (message) { next[name] = rule.message?.trim() || message; break; }
    }
    if (!next[name]) { const message = nativeError(field); if (message) next[name] = message; }
  }
  if (!alive || ticket !== version || abort.signal.aborted) return { valid: false, errors: { ...errors.value }, cancelled: true };
  errors.value = next; validating.value = false; controller = undefined;
  return { valid: !Object.keys(next).length, errors: { ...next }, cancelled: false };
}
function clearValidation(names?: readonly string[]) { invalidate(); if (!names) errors.value = Object.create(null); else errors.value = Object.fromEntries(Object.entries(errors.value).filter(([name]) => !names.includes(name))); }
function reset() { composing.clear(); clearValidation(); emit('reset', copy(initial) as MFormModel); }
async function submit(event: SubmitEvent) {
  if (props.disabled || submitting || validating.value || hasComposition()) return;
  const submitter = event.submitter;
  const owned = !!submitter && submitter.ownerDocument.activeElement === submitter;
  const pending = validate();
  const ticket = version;
  submitting = true;
  try {
    const result = await pending;
    if (result.cancelled || ticket !== version) return;
    if (result.valid) {
      emit('submit', modelCopy(props.model), event);
      await nextTick();
      if (alive && ticket === version && owned && submitter?.isConnected && submitter.ownerDocument.activeElement === submitter.ownerDocument.body && !submitter.matches(':disabled')) submitter.focus({ preventScroll: true });
    }
    else {
      emit('invalid', result.errors); await nextTick();
      const active = element.value?.ownerDocument.activeElement;
      if (alive && ticket === version && (active && element.value?.contains(active) || owned && active === element.value?.ownerDocument.body)) focusField(Object.keys(result.errors)[0]!);
    }
  } finally { if (ticket === version) submitting = false; }
}
function changed() {
  invalidate();
  if (props.validateOn !== 'change' || hasComposition() || queued) return;
  queued = true; queueMicrotask(() => { queued = false; if (alive && !hasComposition()) void validate(); });
}
watch(() => props.model, changed, { deep: true, flush: 'sync' });
watch(() => [props.rules, props.disabled], () => clearValidation(), { deep: true, flush: 'sync' });
provide(formContextKey, {
  disabled: computed(() => props.disabled), errors, validating,
  required: name => rulesFor(name).some(rule => rule.required),
  register(name, field) {
    fields.set(name, field);
    return () => { if (fields.get(name) === field) { fields.delete(name); clearValidation([name]); } };
  },
  validate,
  blur: name => { if (props.validateOn === 'blur' && !hasComposition()) void validate([name]); },
});
onBeforeUnmount(() => { alive = false; invalidate(); composing.clear(); });
defineExpose({ validate, clearValidation, reset, focusField });
</script>

<template>
  <form ref="element" class="ui-form" :aria-label="label" :aria-busy="validating || undefined" novalidate
    @submit.prevent="submit" @reset.prevent="reset" @compositionstart.capture="event => { if (event.target) composing.add(event.target); }"
    @compositionend.capture="event => { if (event.target) composing.delete(event.target); if (validateOn === 'change') changed(); }">
    <section v-if="showSummary && summary.length" class="ui-form__summary" aria-label="表单校验结果">
      <p>有 {{ summary.length }} 项需要核对</p><ul><li v-for="item in summary" :key="item.name"><button type="button" @click="focusField(item.name)">{{ item.field.label() }}：{{ item.message }}</button></li></ul>
    </section>
    <fieldset class="ui-form__fields" :disabled="disabled"><slot :errors="errors" :validating="validating" :validate="validate" :reset="reset" /></fieldset>
  </form>
</template>

<style scoped>
.ui-form { min-width: 0; color: var(--ui-color-text); font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-form__fields { display: grid; gap: var(--ui-field-gap); min-width: 0; padding: 0; margin: 0; border: 0; }
.ui-form__summary { position: relative; margin-bottom: var(--ui-space-6); padding: 14px 16px; border: 1px solid var(--ui-color-danger); border-left-width: 3px; background: color-mix(in srgb, var(--ui-color-danger) 5%, var(--ui-color-surface)); }
.ui-form__summary::after { content: ''; position: absolute; right: 4px; bottom: 4px; width: 7px; height: 5px; border-right: 1px solid var(--ui-color-danger); border-bottom: 1px solid var(--ui-color-danger); pointer-events: none; }
.ui-form__summary p { margin: 0; font-weight: var(--ui-font-weight-emphasis); color: var(--ui-color-danger); }
.ui-form__summary ul { display: grid; gap: 4px; margin: 8px 0 0; padding-left: 20px; }
.ui-form__summary button { border: 0; padding: 4px 0; background: transparent; color: var(--ui-color-danger); text-align: start; font: inherit; overflow-wrap: anywhere; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.ui-form__summary button:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: 2px; }
@media (pointer: coarse) { .ui-form__summary button { min-height: 44px; } }
@media (forced-colors: active) { .ui-form__summary { border-color: CanvasText; background: Canvas; } .ui-form__summary p, .ui-form__summary button { color: CanvasText; } }
</style>
