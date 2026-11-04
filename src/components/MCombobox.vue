<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, watch } from 'vue';
import type { MChoiceOption, MComboboxProps } from './types';
import { floatingPosition } from '../composables/floatingPosition';
import './nativeField.css';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MComboboxProps>(), { disabled: false, clearable: true });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const generated = `ui-combobox-${useId()}`;
const inputId = computed(() => props.id || generated);
const listId = computed(() => `${inputId.value}-list`);
const hintId = computed(() => `${inputId.value}-hint`);
const errorId = computed(() => `${inputId.value}-error`);
const root = ref<HTMLElement>(); const input = ref<HTMLInputElement>(); const popup = ref<HTMLElement>();
const visible = ref(false); const ready = ref(false); const filtering = ref(false); const composing = ref(false);
const selected = computed(() => props.options.find(option => option.value === props.modelValue));
const display = computed(() => selected.value?.label ?? '');
const draft = ref(display.value); const search = ref(''); const active = ref<string>();
const optionIndices = computed(() => new Map(props.options.map((option, index) => [option.value, index])));
const filtered = computed(() => {
  const query = filtering.value ? search.value.trim().normalize('NFKC').toLocaleLowerCase() : '';
  return query ? props.options.filter(option => `${option.label} ${option.description ?? ''} ${option.value}`.normalize('NFKC').toLocaleLowerCase().includes(query)) : props.options;
});
const enabled = computed(() => filtered.value.filter(option => !option.disabled));
const activeId = computed(() => visible.value && ready.value && active.value !== undefined && enabled.value.some(option => option.value === active.value) ? optionId(active.value) : undefined);
let mounted = false; let document: Document | undefined; let view: Window | undefined;
let positioning: ReturnType<typeof floatingPosition> | undefined;
let form: HTMLFormElement | null | undefined; let pointerInPopup = false;

function booleanAttr(name: string) { return attrs[name] != null && attrs[name] !== false; }
function readonly() { return booleanAttr('readonly'); }
function required() { return booleanAttr('required'); }
function blocked() { return props.disabled || readonly(); }
function textAttr(name: string) { return attrs[name] == null ? undefined : String(attrs[name]); }
function nativeAttrs() { const { name: _name, ...rest } = attrs; return rest; }
function describedBy() { return [...new Set([attrs['aria-describedby'], props.hint && hintId.value, props.error && errorId.value].filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined; }
function optionId(value: string) { return `${listId.value}-option-${optionIndices.value.get(value) ?? 0}`; }
function canClear() { return props.clearable && !blocked() && Boolean(draft.value || props.modelValue); }
function isOpen() { return popup.value?.matches(':popover-open') ?? false; }
function syncValidity() {
  const control = input.value;
  if (!control || composing.value) return;
  const unmatched = filtering.value && Boolean(draft.value.trim()) && draft.value !== display.value;
  control.setCustomValidity(!blocked() && ((required() && !selected.value) || unmatched) ? '请从候选列表中选择一项。' : '');
}
function syncDisplay() {
  if (!composing.value) {
    draft.value = display.value; search.value = ''; filtering.value = false;
    if (input.value && input.value.value !== display.value) input.value.value = display.value;
  }
  syncValidity();
}
function syncWidth() {
  if (!input.value || !popup.value || !document) return;
  const width = Math.max(1, Math.min(Math.max(220, input.value.getBoundingClientRect().width), document.documentElement.clientWidth - 24));
  if (popup.value.style.width !== `${width}px`) popup.value.style.width = `${width}px`;
}
function finishPointer() {
  pointerInPopup = false;
  document?.removeEventListener('pointerup', finishPointer, true);
  document?.removeEventListener('pointercancel', finishPointer, true);
  if (mounted && visible.value && document && document.activeElement === document.body && !blocked()) input.value?.focus({ preventScroll: true });
}
function cleanup() {
  positioning?.dispose(); positioning = undefined; ready.value = false; pointerInPopup = false;
  document?.removeEventListener('pointerdown', outside, true);
  document?.removeEventListener('focusin', outside, true);
  document?.removeEventListener('pointerup', finishPointer, true);
  document?.removeEventListener('pointercancel', finishPointer, true);
  view?.removeEventListener('blur', windowBlur);
  view?.removeEventListener('resize', syncWidth);
}
function close(reset = true) {
  visible.value = false; active.value = undefined; cleanup();
  if (isOpen()) popup.value?.hidePopover();
  if (reset) syncDisplay();
}
function outside(event: Event) { if (event.target instanceof Node && !root.value?.contains(event.target)) close(); }
function windowBlur() { close(); }
function popupPointer() {
  pointerInPopup = true;
  document?.addEventListener('pointerup', finishPointer, true);
  document?.addEventListener('pointercancel', finishPointer, true);
}
function blur(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && root.value?.contains(event.relatedTarget)) return;
  if (pointerInPopup && !event.relatedTarget) return;
  close();
}
function reveal() {
  void nextTick(() => {
    if (!mounted || !visible.value || active.value === undefined) return;
    popup.value?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  });
}
function open(where?: 'first' | 'last') {
  if (!mounted || blocked() || !popup.value?.isConnected || !input.value) return;
  if (where === 'first') active.value = enabled.value[0]?.value;
  else if (where === 'last') active.value = enabled.value.at(-1)?.value;
  else if (!enabled.value.some(option => option.value === active.value)) active.value = enabled.value.find(option => option.value === props.modelValue)?.value ?? enabled.value[0]?.value;
  visible.value = true;
  if (!isOpen()) popup.value.showPopover();
  syncWidth();
  if (!positioning) {
    document?.addEventListener('pointerdown', outside, true); document?.addEventListener('focusin', outside, true);
    view?.addEventListener('blur', windowBlur); view?.addEventListener('resize', syncWidth);
    positioning = floatingPosition(input.value, popup.value, () => 'bottom', () => { syncWidth(); ready.value = true; });
  } else positioning.update();
  reveal();
}
function request(value: string, shouldClose = true) {
  if (blocked()) return;
  if (shouldClose) close(false);
  if (value !== props.modelValue) emit('update:modelValue', value);
  void nextTick(() => { if (mounted) syncDisplay(); });
}
function choose(option: MChoiceOption) {
  if (blocked() || option.disabled || composing.value) return;
  draft.value = option.label; filtering.value = false; request(option.value);
  input.value?.focus({ preventScroll: true });
}
function clear() { if (!canClear()) return; draft.value = ''; filtering.value = false; request(''); input.value?.focus({ preventScroll: true }); }
function toggle() { if (blocked()) return; input.value?.focus({ preventScroll: true }); if (visible.value) close(); else open(); }
function clickInput() { if (!blocked()) { input.value?.focus({ preventScroll: true }); open(); } }
function query() {
  if (!input.value) return;
  if (blocked()) { void nextTick(syncDisplay); return; }
  draft.value = input.value.value;
  if (composing.value) return;
  if (!document || document.activeElement !== input.value || !document.hasFocus()) { syncDisplay(); return; }
  search.value = draft.value; filtering.value = true; active.value = enabled.value[0]?.value;
  if (!draft.value && props.clearable && props.modelValue) request('', false);
  open(); syncValidity();
}
function compositionStart() { composing.value = true; }
function compositionEnd() { composing.value = false; if (document?.activeElement === input.value) query(); else syncDisplay(); }
function keydown(event: KeyboardEvent) {
  if (blocked() || composing.value || event.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'Tab') { close(); return; }
  if (event.key === 'Escape' && visible.value) { event.preventDefault(); event.stopPropagation(); close(); return; }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!visible.value) { filtering.value = false; open(event.key === 'ArrowDown' ? 'first' : 'last'); return; }
    const index = enabled.value.findIndex(option => option.value === active.value);
    const next = event.key === 'ArrowDown' ? Math.min(index + 1, enabled.value.length - 1) : index < 0 ? enabled.value.length - 1 : Math.max(0, index - 1);
    active.value = enabled.value[next]?.value; reveal(); return;
  }
  if (!visible.value) return;
  if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); active.value = event.key === 'Home' ? enabled.value[0]?.value : enabled.value.at(-1)?.value; reveal(); }
  else if (event.key === 'Enter' && active.value !== undefined) { const option = enabled.value.find(option => option.value === active.value); if (option) { event.preventDefault(); choose(option); } }
}
function nativeToggle() { if (mounted && !isOpen() && visible.value) close(); }
function resetForm() { close(); void nextTick(() => { if (mounted) syncDisplay(); }); }
function attachForm() {
  const nextForm = input.value?.form;
  if (nextForm === form) return;
  form?.removeEventListener('reset', resetForm); form = nextForm; form?.addEventListener('reset', resetForm);
}
onMounted(() => { mounted = true; document = input.value?.ownerDocument; view = document?.defaultView ?? undefined; attachForm(); syncValidity(); });
onUpdated(() => { if (blocked()) { composing.value = false; if (visible.value) close(); syncDisplay(); } attachForm(); syncValidity(); });
watch([() => props.modelValue, display], () => {
  syncDisplay();
  if (visible.value && !composing.value) { active.value = enabled.value.find(option => option.value === props.modelValue)?.value ?? enabled.value[0]?.value; positioning?.update(); }
}, { flush: 'post' });
watch(() => props.options, () => {
  syncValidity();
  if (visible.value && !composing.value) {
    if (!enabled.value.some(option => option.value === active.value)) active.value = enabled.value.find(option => option.value === props.modelValue)?.value ?? enabled.value[0]?.value;
    positioning?.update();
  }
}, { flush: 'post', deep: true });
watch(() => props.disabled, () => { if (props.disabled) close(); syncValidity(); }, { flush: 'post' });
onBeforeUnmount(() => { mounted = false; cleanup(); form?.removeEventListener('reset', resetForm); if (isOpen()) popup.value?.hidePopover(); });
</script>

<template>
  <div ref="root" class="ui-native-field ui-combobox" :class="{ 'ui-native-field--disabled': disabled, 'ui-native-field--error': Boolean(error) }">
    <label class="ui-native-field__label" :for="inputId">{{ label }}</label>
    <div class="ui-native-field__control ui-combobox__control" :class="{ 'ui-combobox__control--clearable': canClear() }" :data-open="visible || undefined">
      <input v-bind="nativeAttrs()" :id="inputId" ref="input" class="ui-native-control ui-combobox__input" type="text" role="combobox" autocomplete="off" aria-autocomplete="list" aria-haspopup="listbox" :value="draft" :placeholder="placeholder" :disabled="disabled" :readonly="readonly()" :required="required()" :aria-required="required() || undefined" :aria-expanded="visible" :aria-controls="listId" :aria-activedescendant="activeId" :aria-describedby="describedBy()" :aria-invalid="error ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined" @input="query" @click="clickInput" @keydown="keydown" @blur="blur" @compositionstart="compositionStart" @compositionend="compositionEnd">
      <span class="ui-native-field__registration" aria-hidden="true"></span>
      <button v-if="canClear()" class="ui-combobox__clear" type="button" tabindex="-1" :aria-label="'清空' + label" @mousedown.prevent @click="clear"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.5" /></svg></button>
      <button class="ui-combobox__toggle" type="button" tabindex="-1" :aria-label="(visible ? '收起' : '展开') + label + '候选'" :disabled="blocked()" :aria-controls="listId" :aria-expanded="visible" @mousedown.prevent @click="toggle"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" /></svg></button>
    </div>
    <input type="hidden" :name="textAttr('name')" :form="textAttr('form')" :value="selected?.value ?? ''" :disabled="disabled">
    <p v-if="hint" :id="hintId" class="ui-native-field__hint">{{ hint }}</p><p v-if="error" :id="errorId" class="ui-native-field__error" role="alert">{{ error }}</p>
    <p class="ui-combobox__sr-only" role="status" aria-atomic="true">{{ visible && !composing && !filtered.length ? '没有匹配选项。' : '' }}</p>
    <div :id="listId" ref="popup" class="ui-combobox__popup" popover="manual" role="listbox" :aria-label="label + '候选'" :data-ready="ready || undefined" @toggle="nativeToggle" @pointerdown="popupPointer">
      <div class="ui-combobox__heading" aria-hidden="true"><span>候选清单</span><span>{{ filtered.length }} 项</span></div>
      <div class="ui-combobox__options">
        <div v-for="(option, index) in filtered" :id="optionId(option.value)" :key="option.value" class="ui-combobox__option" :class="{ 'ui-combobox__option--active': option.value === active, 'ui-combobox__option--disabled': option.disabled }" role="option" :aria-label="option.label" :aria-describedby="option.description ? optionId(option.value) + '-description' : undefined" :aria-selected="option.value === active" :aria-disabled="option.disabled || undefined" :aria-posinset="index + 1" :aria-setsize="filtered.length" @mousedown.prevent @click="choose(option)" @mousemove="!option.disabled && !composing && (active = option.value)">
          <span class="ui-combobox__cursor" aria-hidden="true"></span><span class="ui-combobox__copy"><span class="ui-combobox__option-label">{{ option.label }}</span><span v-if="option.description" :id="optionId(option.value) + '-description'" class="ui-combobox__option-description">{{ option.description }}</span></span><span class="ui-combobox__selected" aria-hidden="true">{{ option.value === modelValue ? '✓' : '' }}</span>
        </div>
        <p v-if="!filtered.length" class="ui-combobox__empty" aria-hidden="true">没有匹配选项。<span>调整关键词，或清空输入重新查找。</span></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-combobox { min-width: 0; }
.ui-combobox__input { padding-right: 46px; }
.ui-combobox__control--clearable .ui-combobox__input { padding-right: 82px; }
.ui-combobox__toggle, .ui-combobox__clear { position: absolute; top: 0; bottom: 0; display: grid; place-items: center; width: 36px; min-height: var(--ui-control-height); margin: 0; padding: 0; border: 0; border-radius: 0; background: transparent; color: var(--ui-color-text-secondary); cursor: pointer; }
.ui-combobox__toggle { right: 0; } .ui-combobox__clear { right: 36px; }
.ui-combobox__toggle:hover:not(:disabled), .ui-combobox__clear:hover { color: var(--ui-color-accent); background: linear-gradient(var(--ui-color-accent-soft), var(--ui-color-accent-soft)) center / calc(100% - 4px) calc(100% - 6px) no-repeat; }
.ui-combobox__toggle:disabled { opacity: .45; cursor: not-allowed; }
.ui-combobox__toggle svg { transition: transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-combobox__control[data-open] .ui-combobox__toggle svg { transform: rotate(180deg); }
.ui-combobox__popup { --ui-combobox-enter-y: -4px; --ui-combobox-height: min(320px, calc(100dvh - 24px)); position: fixed; isolation: isolate; inset: auto; top: 0; left: 0; box-sizing: border-box; display: none; width: 280px; max-width: calc(100vw - 24px); max-height: var(--ui-combobox-height); margin: 0; padding: 1px; border: 0; border-radius: 0; background: transparent; color: var(--ui-color-text); font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); visibility: hidden; overflow: visible; }
.ui-combobox__popup:popover-open { display: block; }
.ui-combobox__popup[data-placement='top'] { --ui-combobox-enter-y: 4px; }
.ui-combobox__popup::before, .ui-combobox__popup::after { content: ''; position: absolute; pointer-events: none; z-index: -1; clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px)); }
.ui-combobox__popup::before { inset: 0; background: var(--ui-color-metal); }
.ui-combobox__popup::after { inset: 1px; background: var(--ui-color-surface-raised); clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px)); }
.ui-combobox__popup[data-ready] { visibility: visible; animation: ui-combobox-enter var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-combobox__heading { display: flex; justify-content: space-between; gap: 16px; padding: 8px 16px 7px; border-bottom: 1px solid var(--ui-color-rule); color: var(--ui-color-text-secondary); font: 10px/1.6 var(--ui-font-family-mono); }
.ui-combobox__heading::before { content: ''; position: absolute; left: 17px; top: 0; width: 25px; height: 2px; background: var(--ui-color-accent); }
.ui-combobox__options { box-sizing: border-box; max-height: calc(var(--ui-combobox-height) - 34px); padding: 6px; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--ui-color-metal) transparent; }
.ui-combobox__option { box-sizing: border-box; display: grid; grid-template-columns: 6px minmax(0, 1fr) 14px; align-items: center; gap: 11px; min-height: 42px; padding: 10px 11px; border: 1px solid transparent; color: var(--ui-color-text); cursor: pointer; }
.ui-combobox__copy { display: grid; min-width: 0; gap: 4px; overflow-wrap: anywhere; }
.ui-combobox__option-description { color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); line-height: 1.7; }
.ui-combobox__cursor { width: 4px; height: 4px; border: 1px solid var(--ui-color-metal); }
.ui-combobox__selected { color: var(--ui-color-secondary-accent); font-size: 12px; }
.ui-combobox__option--active { border-color: var(--ui-color-accent); background: var(--ui-color-accent-soft); }
.ui-combobox__option--active .ui-combobox__cursor { background: var(--ui-color-accent); border-color: var(--ui-color-accent); }
.ui-combobox__option--disabled { opacity: .45; cursor: not-allowed; }
.ui-combobox__empty { margin: 0; padding: 20px 14px; color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); line-height: 1.8; }
.ui-combobox__empty span { display: block; margin-top: 6px; }
.ui-combobox__sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
@keyframes ui-combobox-enter { from { opacity: 0; transform: translateY(var(--ui-combobox-enter-y)); } to { opacity: 1; transform: translateY(0); } }
:global([data-ui-motion='reduced'] .ui-combobox__popup[data-ready]) { animation: none; }
:global([data-ui-motion='reduced'] .ui-combobox__toggle svg) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-combobox__popup[data-ready] { animation: none; } .ui-combobox__toggle svg { transition: none; } }
@media (pointer: coarse) { .ui-combobox__toggle, .ui-combobox__clear { width: 44px; min-height: 44px; } .ui-combobox__clear { right: 44px; } .ui-combobox__input { padding-right: 54px; } .ui-combobox__control--clearable .ui-combobox__input { padding-right: 98px; } .ui-combobox__option { min-height: 44px; } }
@media (forced-colors: active) { .ui-combobox__popup { border: 1px solid CanvasText; padding: 0; background: Canvas; color: CanvasText; } .ui-combobox__popup::before, .ui-combobox__popup::after { display: none; } .ui-combobox__option--active { outline: 2px solid Highlight; outline-offset: -2px; } .ui-combobox__option--disabled { color: GrayText; opacity: 1; } .ui-combobox__toggle, .ui-combobox__clear { color: ButtonText; } }
</style>
