<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, watch } from 'vue';
import type { MChoiceOption } from '../types';
import type { MAutoCompleteProps } from './types';
import MScrollbar from './MScrollbar.vue';
import MSpinner from '../MSpinner.vue';
import { floatingPosition } from '../../composables/floatingPosition';
import { useMConfig } from '../../composables/useConfig';
import { useVirtualWindow } from './useVirtualWindow';
import '../nativeField.css';
import './reference-data.css';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MAutoCompleteProps>(), { disabled: false, readonly: false, required: false, loading: false, clearable: true, filter: true });
const emit = defineEmits<{ 'update:modelValue': [value: string]; search: [value: string]; select: [option: MChoiceOption] }>();
const { t } = useMConfig(), attrs = useAttrs(), identity = `ui-autocomplete-${useId()}`;
const inputId = computed(() => props.id ?? identity), listId = computed(() => `${inputId.value}-list`);
const root = ref<HTMLElement>(), input = ref<HTMLInputElement>(), popup = ref<HTMLElement>(), scrollbar = ref<InstanceType<typeof MScrollbar>>();
const draft = ref(props.modelValue), opened = ref(false), ready = ref(false), composing = ref(false), active = ref(-1);
const blocked = computed(() => props.disabled || props.readonly);
const options = computed(() => { const seen = new Set<string>(); return props.options.filter(option => { if (seen.has(option.value)) return false; seen.add(option.value); return true; }); });
const indices = computed(() => new Map(options.value.map((option, index) => [option.value, index])));
const filtered = computed(() => {
  const needle = props.filter ? draft.value.trim().normalize('NFKC').toLocaleLowerCase() : '';
  return needle ? options.value.filter(option => `${option.value} ${option.label}`.normalize('NFKC').toLocaleLowerCase().includes(needle)) : options.value;
});
const listHeight = computed(() => props.loading || !filtered.value.length ? 88 : Math.min(264, filtered.value.length * 44));
const windowed = useVirtualWindow({ count: () => props.loading ? 0 : filtered.value.length, height: () => listHeight.value, itemHeight: () => 44, overscan: () => 4, viewport: () => scrollbar.value?.viewport });
const rows = computed(() => windowed.indices.value.map(index => ({ option: filtered.value[index]!, index })));
const optionId = (option: MChoiceOption) => `${listId.value}-${indices.value.get(option.value)}`;
const activeId = computed(() => opened.value && ready.value && !props.loading && rows.value.some(row => row.index === active.value) ? optionId(filtered.value[active.value]!) : undefined);
let owner: Document | undefined, alive = false, position: ReturnType<typeof floatingPosition> | undefined, form: HTMLFormElement | null | undefined;
let resetTimer: ReturnType<typeof setTimeout> | undefined, emission: string | undefined;
function cancelReset() { if (resetTimer !== undefined) clearTimeout(resetTimer); resetTimer = undefined; }
function sync() { if (!composing.value) { draft.value = props.modelValue; if (input.value && input.value.value !== props.modelValue) input.value.value = props.modelValue; } }
function cleanup() { position?.dispose(); position = undefined; ready.value = false; owner?.removeEventListener('pointerdown', outside, true); owner?.removeEventListener('focusin', outside, true); owner?.defaultView?.removeEventListener('resize', width); }
function close() { opened.value = false; active.value = -1; cleanup(); if (popup.value?.matches(':popover-open')) popup.value.hidePopover(); }
function outside(event: Event) { const target = event.target as Node | null; if (target && !root.value?.contains(target)) close(); }
function width() { if (popup.value && input.value && owner) popup.value.style.width = `${Math.min(Math.max(220, input.value.getBoundingClientRect().width), owner.documentElement.clientWidth - 24)}px`; }
function open() {
  if (!alive || blocked.value || !input.value || !popup.value) return;
  opened.value = true; if (!popup.value.matches(':popover-open')) popup.value.showPopover(); width();
  if (!position) { owner?.addEventListener('pointerdown', outside, true); owner?.addEventListener('focusin', outside, true); owner?.defaultView?.addEventListener('resize', width); position = floatingPosition(input.value, popup.value, () => 'bottom', () => { ready.value = true; width(); windowed.update(); }); } else position.update();
}
function commit(value: string, search = true) {
  if (blocked.value || composing.value) { sync(); return; } cancelReset(); draft.value = value;
  if (emission !== value) {
    emission = value; if (value !== props.modelValue) emit('update:modelValue', value); if (search) emit('search', value);
    queueMicrotask(() => { if (emission === value) emission = undefined; });
  }
  void nextTick(() => { if (alive) sync(); });
}
function onInput() {
  cancelReset(); draft.value = input.value?.value ?? ''; if (composing.value) return;
  if (blocked.value) { sync(); return; } active.value = -1; commit(draft.value); open(); windowed.scrollTo({ top: 0 });
}
function choose(option: MChoiceOption) { if (blocked.value || composing.value || props.loading || option.disabled) return; commit(option.value, false); emit('select', option); close(); input.value?.focus({ preventScroll: true }); }
function clear() { if (blocked.value) return; active.value = -1; commit(''); input.value?.focus({ preventScroll: true }); open(); }
function enabled(last = false) { if (last) { for (let i = filtered.value.length - 1; i >= 0; i--) if (!filtered.value[i]!.disabled) return i; } else { for (let i = 0; i < filtered.value.length; i++) if (!filtered.value[i]!.disabled) return i; } return -1; }
function keydown(event: KeyboardEvent) {
  if (blocked.value || event.isComposing || event.keyCode === 229) return;
  if (composing.value) {
    // An unmarked Enter must not submit the pending native input value.
    if (event.key === 'Enter') event.preventDefault();
    return;
  }
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'Tab') { close(); return; }
  if (event.key === 'Escape' && opened.value) { event.preventDefault(); event.stopPropagation(); close(); return; }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault(); open(); if (props.loading) return;
    if (active.value < 0) active.value = enabled(event.key === 'ArrowUp');
    else { const direction = event.key === 'ArrowDown' ? 1 : -1; let index = active.value + direction; while (index >= 0 && index < filtered.value.length && filtered.value[index]!.disabled) index += direction; if (index >= 0 && index < filtered.value.length) active.value = index; }
    void nextTick(() => { if (alive && opened.value) windowed.scrollToIndex(active.value); }); return;
  }
  if (!opened.value) return;
  if (event.key === 'Enter') { if (!props.loading && active.value >= 0 && filtered.value[active.value]) { event.preventDefault(); choose(filtered.value[active.value]!); } else close(); }
  else if ((event.key === 'Home' || event.key === 'End') && active.value >= 0) { event.preventDefault(); active.value = enabled(event.key === 'End'); windowed.scrollToIndex(active.value); }
}
function reset() { close(); cancelReset(); resetTimer = setTimeout(() => { resetTimer = undefined; if (alive) sync(); }, 0); }
function attachForm() { const next = input.value?.form; if (next !== form) { form?.removeEventListener('reset', reset); form = next; form?.addEventListener('reset', reset); } }
onMounted(() => { alive = true; owner = input.value?.ownerDocument; attachForm(); sync(); });
onUpdated(attachForm);
watch(() => props.modelValue, () => { cancelReset(); sync(); });
watch(() => [props.options, props.loading], () => { active.value = -1; if (opened.value) { position?.update(); void nextTick(() => windowed.update()); } }, { deep: true, flush: 'post' });
watch(blocked, () => { if (blocked.value) { composing.value = false; sync(); close(); } });
onBeforeUnmount(() => { alive = false; cancelReset(); cleanup(); form?.removeEventListener('reset', reset); if (popup.value?.matches(':popover-open')) popup.value.hidePopover(); });
defineExpose({ focus: () => input.value?.focus(), close });
</script>

<template>
  <div ref="root" class="ui-native-field ui-autocomplete" :class="{ 'ui-native-field--disabled': disabled, 'ui-native-field--error': error }">
    <label class="ui-native-field__label" :for="inputId">{{label}}</label><div class="ui-native-field__control"><input v-bind="attrs" :id="inputId" ref="input" class="ui-native-control" type="text" :name="name" :form="props.form" :value="draft" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" :required="required" autocomplete="off" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" :aria-expanded="opened" :aria-controls="listId" :aria-activedescendant="activeId" :aria-invalid="!!error || undefined" :aria-describedby="[hint && inputId + '-hint', error && inputId + '-error'].filter(Boolean).join(' ') || undefined" @input="onInput" @focus="open" @click="open" @keydown="keydown" @blur="event => { if (!event.relatedTarget || !root?.contains(event.relatedTarget as Node)) close(); }" @compositionstart="composing = true" @compositionend="composing = false; onInput()" /><span class="ui-native-field__registration" aria-hidden="true" /><button v-if="clearable && draft && !blocked" class="ui-autocomplete__clear" type="button" tabindex="-1" :aria-label="t('clear', '清空') + label" @mousedown.prevent @click="clear">×</button></div>
    <p v-if="hint" :id="inputId + '-hint'" class="ui-native-field__hint">{{hint}}</p><p v-if="error" :id="inputId + '-error'" class="ui-native-field__error" role="alert">{{error}}</p>
    <div ref="popup" class="ui-data ui-autocomplete__popup" popover="manual" :data-ready="ready || undefined" @mousedown.prevent @toggle="() => { if (opened && !popup?.matches(':popover-open')) close(); }"><div class="ui-autocomplete__heading" aria-hidden="true">自由输入 <span>候选补全</span></div><MScrollbar :id="listId" ref="scrollbar" role="listbox" tabindex="-1" :label="label + '建议'" :height="listHeight" :max-height="'calc(100dvh - 130px)'" :aria-busy="loading || undefined" @scroll="windowed.update"><div v-if="loading" class="ui-data__state"><MSpinner :label="t('loading', '正在读取建议')" /></div><div v-else-if="filtered.length" class="ui-virtual__canvas" role="none" :style="{ height: windowed.totalHeight.value + 'px' }"><div v-for="row in rows" :id="optionId(row.option)" :key="row.option.value" class="ui-virtual__row" role="option" :aria-label="row.option.label" :aria-selected="active === row.index" :aria-disabled="row.option.disabled || undefined" :aria-posinset="row.index + 1" :aria-setsize="filtered.length" :data-active="active === row.index || undefined" :style="{ top: row.index * 44 + 'px', height: '44px' }" @click="choose(row.option)"><span class="ui-virtual__copy">{{row.option.label}}</span><span aria-hidden="true">{{row.option.disabled ? '—' : '↵'}}</span></div></div><p v-else class="ui-data__empty">{{ t('empty', '暂无建议，可直接使用输入的文字。') }}</p></MScrollbar></div>
  </div>
</template>
<style scoped>
.ui-autocomplete { min-width: 0; }.ui-autocomplete .ui-native-control { padding-inline-end: 44px; }.ui-autocomplete__clear { position: absolute; inset-inline-end: 0; top: 0; bottom: 0; width: 44px; min-height: 44px; padding: 0; border: 0; border-radius: 0; background: transparent; color: var(--ui-color-text-secondary); font: 20px/1 var(--ui-font-family-mono); cursor: pointer; }.ui-autocomplete__clear:hover { color: var(--ui-color-text); background: var(--ui-color-surface-muted); }.ui-autocomplete__popup { position: fixed; inset: auto; top: 0; left: 0; box-sizing: border-box; width: 280px; max-width: calc(100vw - 24px); margin: 0; padding: 0; border: 1px solid var(--ui-color-metal); border-radius: 0; background: var(--ui-color-surface-raised); box-shadow: var(--ui-shadow-panel); visibility: hidden; }.ui-autocomplete__popup:popover-open { display: block; }.ui-autocomplete__popup[data-ready] { visibility: visible; }.ui-autocomplete__heading { display: flex; justify-content: space-between; padding: 8px 16px; border-bottom: 1px solid var(--ui-color-rule); font: var(--ui-font-size-caption)/1.5 var(--ui-font-family-mono); }.ui-autocomplete__heading::before { content: ''; position: absolute; top: 0; left: 16px; width: 24px; height: 2px; background: var(--ui-color-accent); }.ui-autocomplete [aria-disabled=true] { opacity: .5; }
@media (forced-colors: active) { .ui-autocomplete__popup { border-color: CanvasText; background: Canvas; color: CanvasText; } }
</style>
