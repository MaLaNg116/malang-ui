<script setup lang="ts" generic="Multiple extends boolean = false">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, watch } from 'vue';
import type { MChoiceOption } from '../types';
import type { MVirtualSelectProps, MVirtualSelectValue } from './types';
import MScrollbar from './MScrollbar.vue';
import { useVirtualWindow } from './useVirtualWindow';
import { floatingPosition } from '../../composables/floatingPosition';
import { useMConfig } from '../../composables/useConfig';
import '../nativeField.css';
import './reference-data.css';
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MVirtualSelectProps<Multiple>>(), { disabled: false, readonly: false, required: false, height: 264, itemHeight: 44, overscan: 4 });
const emit = defineEmits<{ 'update:modelValue': [value: MVirtualSelectValue<Multiple>] }>();
const { t } = useMConfig(), attrs = useAttrs(), identity = `ui-virtual-select-${useId()}`;
const inputId = computed(() => props.id ?? identity), listId = computed(() => `${inputId.value}-list`);
const root = ref<HTMLElement>(), input = ref<HTMLInputElement>(), popup = ref<HTMLElement>(), scrollbar = ref<InstanceType<typeof MScrollbar>>();
const opened = ref(false), ready = ref(false), composing = ref(false), searching = ref(false), query = ref(''), draft = ref(''), active = ref(-1);
const blocked = computed(() => props.disabled || props.readonly);
const options = computed(() => { const seen = new Set<string>(); return props.options.filter(option => { if (seen.has(option.value)) return false; seen.add(option.value); return true; }); });
const values = computed(() => typeof props.modelValue === 'string' ? props.modelValue ? [props.modelValue] : [] : [...props.modelValue]);
const selected = computed(() => options.value.filter(option => values.value.includes(option.value)));
const indices = computed(() => new Map(options.value.map((option, index) => [option.value, index])));
const filtered = computed(() => { const needle = searching.value ? query.value.trim().normalize('NFKC').toLocaleLowerCase() : ''; return needle ? options.value.filter(option => `${option.label} ${option.value} ${option.description ?? ''}`.normalize('NFKC').toLocaleLowerCase().includes(needle)) : options.value; });
const windowed = useVirtualWindow({ count: () => filtered.value.length, itemHeight: () => Math.max(44, props.itemHeight), height: () => props.height, overscan: () => props.overscan, viewport: () => scrollbar.value?.viewport });
const rows = computed(() => windowed.indices.value.map(index => ({ item: filtered.value[index]!, index })));
const optionId = (option: MChoiceOption) => `${listId.value}-${indices.value.get(option.value)}`;
const activeId = computed(() => opened.value && ready.value && rows.value.some(row => row.index === active.value) && filtered.value[active.value] ? optionId(filtered.value[active.value]!) : undefined);
let alive = false, position: ReturnType<typeof floatingPosition> | undefined, owner: Document | undefined, ownerForm: HTMLFormElement | null | undefined;
let resetTimer: ReturnType<typeof setTimeout> | undefined;
function cancelReset() { if (resetTimer !== undefined) clearTimeout(resetTimer); resetTimer = undefined; }
function validity() { input.value?.setCustomValidity(!blocked.value && ((props.required && !selected.value.length) || (searching.value && !!draft.value && (!props.multiple && draft.value !== selected.value[0]?.label || props.multiple))) ? t('select.required', '请从候选列表中选择。') : ''); }
function display() { if (composing.value) return; draft.value = props.multiple ? '' : selected.value[0]?.label ?? ''; query.value = ''; searching.value = false; if (input.value) input.value.value = draft.value; validity(); }
function cleanup() { position?.dispose(); position = undefined; ready.value = false; owner?.removeEventListener('pointerdown', outside, true); owner?.removeEventListener('focusin', outside, true); owner?.defaultView?.removeEventListener('resize', width); }
function close() { opened.value = false; active.value = -1; cleanup(); if (popup.value?.matches(':popover-open')) popup.value.hidePopover(); display(); }
function outside(event: Event) { const target = event.target as Node | null; if (target && !root.value?.contains(target)) close(); }
function width() { if (popup.value && input.value && owner) popup.value.style.width = `${Math.min(Math.max(220, input.value.getBoundingClientRect().width), owner.documentElement.clientWidth - 24)}px`; }
function firstEnabled(last = false) { if (last) { for (let i = filtered.value.length - 1; i >= 0; i--) if (!filtered.value[i]!.disabled) return i; } else { for (let i = 0; i < filtered.value.length; i++) if (!filtered.value[i]!.disabled) return i; } return -1; }
function reveal() { void nextTick(() => { if (alive && opened.value) windowed.scrollToIndex(active.value); }); }
function open(last = false) {
  if (!alive || blocked.value || !popup.value || !input.value) return; cancelReset();
  if (!opened.value) { active.value = filtered.value.findIndex(option => !option.disabled && values.value.includes(option.value)); if (active.value < 0) active.value = firstEnabled(last); }
  opened.value = true; if (!popup.value.matches(':popover-open')) popup.value.showPopover(); width();
  if (!position) { owner?.addEventListener('pointerdown', outside, true); owner?.addEventListener('focusin', outside, true); owner?.defaultView?.addEventListener('resize', width); position = floatingPosition(input.value, popup.value, () => 'bottom', () => { ready.value = true; width(); windowed.update(); }); } else position.update(); reveal();
}
function request(next: string[]) { if (blocked.value || composing.value) return; cancelReset(); emit('update:modelValue', (props.multiple ? next : next[0] ?? '') as MVirtualSelectValue<Multiple>); void nextTick(() => { if (alive) display(); }); }
function choose(option: MChoiceOption) { if (blocked.value || option.disabled || composing.value) return; const next = props.multiple ? values.value.includes(option.value) ? values.value.filter(value => value !== option.value) : [...values.value, option.value] : [option.value]; request(next); if (!props.multiple) close(); else { query.value = ''; searching.value = false; reveal(); } input.value?.focus({ preventScroll: true }); }
function remove(value: string) { request(values.value.filter(item => item !== value)); input.value?.focus({ preventScroll: true }); }
function onInput() { cancelReset(); if (blocked.value) { display(); return; } draft.value = input.value?.value ?? ''; if (composing.value) return; searching.value = true; query.value = draft.value; active.value = firstEnabled(); open(); windowed.scrollTo({ top: 0 }); validity(); }
function keydown(event: KeyboardEvent) {
  if (blocked.value || composing.value || event.isComposing || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  if (event.key === 'Tab') { close(); return; }
  if (event.key === 'Escape' && opened.value) { event.preventDefault(); event.stopPropagation(); close(); return; }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (!opened.value) { open(event.key === 'ArrowUp'); return; } const direction = event.key === 'ArrowDown' ? 1 : -1; let index = active.value + direction; while (index >= 0 && index < filtered.value.length && filtered.value[index]!.disabled) index += direction; if (index >= 0 && index < filtered.value.length) active.value = index; reveal(); return; }
  if (!opened.value) return;
  if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); active.value = firstEnabled(event.key === 'End'); reveal(); }
  else if (event.key === 'Enter' && filtered.value[active.value]) { event.preventDefault(); choose(filtered.value[active.value]!); }
}
function reset() { close(); cancelReset(); resetTimer = setTimeout(() => { resetTimer = undefined; if (alive) display(); }, 0); }
function attachForm() { const next = input.value?.form; if (next !== ownerForm) { ownerForm?.removeEventListener('reset', reset); ownerForm = next; ownerForm?.addEventListener('reset', reset); } }
onMounted(() => { alive = true; owner = input.value?.ownerDocument; display(); attachForm(); });
onUpdated(() => { attachForm(); validity(); if (blocked.value && opened.value) close(); });
watch(() => [props.modelValue, props.options, props.multiple], () => { cancelReset(); if (!opened.value) display(); else { validity(); if (!filtered.value[active.value] || filtered.value[active.value]?.disabled) active.value = firstEnabled(); reveal(); } }, { deep: true, flush: 'post' });
watch(blocked, () => { if (blocked.value) { composing.value = false; close(); } });
onBeforeUnmount(() => { alive = false; cancelReset(); cleanup(); ownerForm?.removeEventListener('reset', reset); if (popup.value?.matches(':popover-open')) popup.value.hidePopover(); });
defineExpose({ focus: () => input.value?.focus(), close, scrollToIndex: windowed.scrollToIndex });
</script>
<template>
  <div ref="root" class="ui-native-field ui-virtual-select" :class="{ 'ui-native-field--error': error, 'ui-native-field--disabled': disabled }">
    <label class="ui-native-field__label" :for="inputId">{{label}}</label><div class="ui-native-field__control"><input v-bind="attrs" :id="inputId" ref="input" class="ui-native-control" type="text" role="combobox" autocomplete="off" aria-autocomplete="list" aria-haspopup="listbox" :value="draft" :disabled="disabled" :readonly="readonly" :required="required && !selected.length" :form="form" :placeholder="placeholder ?? (multiple && selected.length ? selected.length + ' 项已选' : '')" :aria-expanded="opened" :aria-controls="listId" :aria-activedescendant="activeId" :aria-required="required || undefined" :aria-invalid="!!error || undefined" :aria-describedby="[hint && inputId + '-hint', error && inputId + '-error'].filter(Boolean).join(' ') || undefined" @click="open()" @input="onInput" @keydown="keydown" @compositionstart="composing = true" @compositionend="composing = false; onInput()" @blur="event => { if (!event.relatedTarget || !root?.contains(event.relatedTarget as Node)) close(); }" /><span class="ui-native-field__registration" aria-hidden="true" /></div>
    <div v-if="multiple && selected.length" class="ui-virtual-select__chosen"><button v-for="option in selected.slice(0, 20)" :key="option.value" type="button" :disabled="blocked" :aria-label="'移除' + option.label" @click="remove(option.value)">{{option.label}} <span aria-hidden="true">×</span></button><span v-if="selected.length > 20">另 {{selected.length - 20}} 项</span></div>
    <input v-for="option in selected" :key="option.value" type="hidden" :name="name" :form="form" :disabled="disabled" :value="option.value" />
    <p v-if="hint" :id="inputId + '-hint'" class="ui-native-field__hint">{{hint}}</p><p v-if="error" :id="inputId + '-error'" class="ui-native-field__error" role="alert">{{error}}</p>
    <div :id="listId + '-surface'" ref="popup" class="ui-data ui-virtual-select__popup" popover="manual" :data-ready="ready || undefined" @toggle="() => { if (opened && !popup?.matches(':popover-open')) close(); }" @mousedown.prevent>
      <div class="ui-virtual-select__heading" aria-hidden="true">{{ t('search', '候选清单') }} <span>{{filtered.length}} 项</span></div>
      <MScrollbar :id="listId" ref="scrollbar" :height="windowed.height.value" :max-height="'calc(100dvh - 130px)'" :label="label + '候选'" role="listbox" :aria-multiselectable="multiple || undefined" tabindex="-1" @scroll="windowed.update"><div v-if="filtered.length" class="ui-virtual__canvas" role="none" :style="{ height: windowed.totalHeight.value + 'px' }"><div v-for="row in rows" :id="optionId(row.item)" :key="row.item.value" class="ui-virtual__row" role="option" :aria-label="row.item.label" :aria-selected="values.includes(row.item.value)" :aria-disabled="row.item.disabled || undefined" :aria-posinset="row.index + 1" :aria-setsize="filtered.length" :data-active="row.index === active || undefined" :data-selected="values.includes(row.item.value) || undefined" :style="{ height: windowed.rowHeight.value + 'px', top: row.index * windowed.rowHeight.value + 'px' }" @click="choose(row.item)"><span class="ui-virtual__copy">{{row.item.label}}</span><span aria-hidden="true">{{ values.includes(row.item.value) ? '✓' : row.item.disabled ? '—' : '' }}</span></div></div><p v-else class="ui-data__empty" role="status">{{t('empty', '没有匹配选项')}}</p></MScrollbar>
    </div>
  </div>
</template>
<style scoped>
.ui-virtual-select { min-width: 0; }.ui-virtual-select__chosen { display: flex; flex-wrap: wrap; gap: 6px; }.ui-virtual-select__chosen button { display: inline-flex; gap: 8px; align-items: center; min-height: 44px; max-width: 100%; padding: 6px 10px; border: 1px solid var(--ui-color-border); border-radius: 0; background: var(--ui-color-surface); color: var(--ui-color-text); font: inherit; overflow-wrap: anywhere; cursor: pointer; }.ui-virtual-select__chosen button:disabled { cursor: default; }.ui-virtual-select__popup { position: fixed; inset: auto; top: 0; left: 0; box-sizing: border-box; width: 280px; max-width: calc(100vw - 24px); padding: 0; margin: 0; border: 1px solid var(--ui-color-metal); border-radius: 0; box-shadow: var(--ui-shadow-panel); visibility: hidden; }.ui-virtual-select__popup:popover-open { display: block; }.ui-virtual-select__popup[data-ready] { visibility: visible; }.ui-virtual-select__heading { display: flex; justify-content: space-between; padding: 8px 16px; border-block-end: 1px solid var(--ui-color-rule); font: var(--ui-font-size-caption)/1.5 var(--ui-font-family-mono); }.ui-virtual-select__heading::before { content: ''; position: absolute; top: 0; left: 16px; width: 24px; height: 2px; background: var(--ui-color-accent); }.ui-virtual-select [aria-disabled=true] { opacity: .5; }
@media (forced-colors: active) { .ui-virtual-select__popup, .ui-virtual-select__chosen button { border-color: CanvasText; background: Canvas; color: CanvasText; } }
</style>
