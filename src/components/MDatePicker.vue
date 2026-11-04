<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, watch } from 'vue';
import type { MDatePickerProps } from './types';
import { addDays, addMonths, addYears, calendarMonth, formatISODate, isoWeekday, parseISODate } from './calendarDate';
import type { CalendarDate } from './calendarDate';
import { floatingPosition } from '../composables/floatingPosition';
import './nativeField.css';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MDatePickerProps>(), { disabled: false, clearable: true, placeholder: 'YYYY-MM-DD' });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const generated = `ui-date-${useId()}`;
const inputId = computed(() => props.id || generated);
const calendarId = computed(() => `${inputId.value}-calendar`);
const monthId = computed(() => `${calendarId.value}-month`);
const helpId = computed(() => `${calendarId.value}-help`);
const root = ref<HTMLElement>(); const input = ref<HTMLInputElement>(); const popup = ref<HTMLElement>();
const draft = ref(props.modelValue); const composing = ref(false); const validationShown = ref(Boolean(props.modelValue && !parseISODate(props.modelValue)));
const visible = ref(false); const ready = ref(false);
const today = ref<CalendarDate>({ year: 2000, month: 1, day: 1 });
const active = ref<CalendarDate>(parseISODate(props.modelValue) ?? today.value);
const displayed = ref<CalendarDate>(active.value);
const minimum = computed(() => props.min ? parseISODate(props.min) : null);
const maximum = computed(() => props.max ? parseISODate(props.max) : null);
const configurationError = computed(() => {
  if ((props.min && !minimum.value) || (props.max && !maximum.value)) return '日期范围配置无效，请使用 YYYY-MM-DD。';
  return props.min && props.max && props.min > props.max ? '日期范围配置无效：最早日期晚于最晚日期。' : '';
});
const draftError = computed(() => {
  if (!draft.value) return '';
  if (!parseISODate(draft.value)) return '请输入有效日期（YYYY-MM-DD，年份 0001 至 9999）。';
  if (props.min && draft.value < props.min) return `日期不得早于 ${props.min}。`;
  if (props.max && draft.value > props.max) return `日期不得晚于 ${props.max}。`;
  return '';
});
const fieldError = computed(() => props.error || configurationError.value || (validationShown.value ? draftError.value : ''));
const feedback = computed(() => fieldError.value || draftError.value);
const activeISO = computed(() => formatISODate(active.value));
const todayISO = computed(() => formatISODate(today.value));
const selectedISO = computed(() => parseISODate(props.modelValue) ? props.modelValue : '');
const monthLabel = computed(() => `${String(displayed.value.year).padStart(4, '0')} 年 ${String(displayed.value.month).padStart(2, '0')} 月`);
const weeks = computed(() => {
  const days = calendarMonth(displayed.value);
  return Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7));
});
const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
let mounted = false; let ownerDocument: Document | undefined; let view: Window | undefined;
let positioning: ReturnType<typeof floatingPosition> | undefined;
let form: HTMLFormElement | null | undefined; let pending: string | undefined; let requestRevision = 0; let focusPending = false;
let resetTimer: ReturnType<typeof setTimeout> | undefined; let resetGeneration = 0;

function booleanAttr(name: string) { return attrs[name] != null && attrs[name] !== false; }
function readonly() { return booleanAttr('readonly'); }
function blocked() { return props.disabled || readonly(); }
function describedBy() {
  return [...new Set([attrs['aria-describedby'], props.hint && `${inputId.value}-hint`, fieldError.value && `${inputId.value}-error`].filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined;
}
function available(date: CalendarDate | null) {
  if (!date || configurationError.value) return false;
  const iso = formatISODate(date);
  return (!props.min || iso >= props.min) && (!props.max || iso <= props.max);
}
function constrain(date: CalendarDate) {
  if (configurationError.value) return date;
  const iso = formatISODate(date);
  if (minimum.value && props.min && iso < props.min) return minimum.value;
  if (maximum.value && props.max && iso > props.max) return maximum.value;
  return date;
}
function syncValidity() {
  if (!input.value || composing.value) return;
  input.value.setCustomValidity(blocked() ? '' : configurationError.value || draftError.value);
}
function syncOwner() {
  if (composing.value) return;
  draft.value = props.modelValue;
  if (input.value && input.value.value !== draft.value) input.value.value = draft.value;
  validationShown.value = Boolean(draft.value && (configurationError.value || draftError.value));
  syncValidity();
}
function request(value: string) {
  if (blocked() || composing.value || configurationError.value) return;
  cancelReset();
  if (value === props.modelValue) { draft.value = value; syncValidity(); return; }
  if (value === pending) return;
  pending = value; const revision = ++requestRevision;
  emit('update:modelValue', value);
  void nextTick(() => {
    if (!mounted || revision !== requestRevision) return;
    pending = undefined; syncOwner();
  });
}
function commit() {
  if (blocked() || composing.value) return;
  syncValidity();
  if (configurationError.value || draftError.value) { validationShown.value = true; return; }
  request(draft.value);
}
function edit(event: Event) {
  cancelReset();
  if (blocked()) { syncOwner(); return; }
  draft.value = (event.target as HTMLInputElement).value;
  if (!composing.value && !(event as InputEvent).isComposing) syncValidity();
}
function compositionStart() { cancelReset(); composing.value = true; if (!blocked()) input.value?.setCustomValidity('请先完成日期输入。'); }
function compositionEnd(event: CompositionEvent) {
  composing.value = false; edit(event);
  if (ownerDocument?.activeElement && !root.value?.contains(ownerDocument.activeElement)) commit();
}
function isOpen() { return popup.value?.matches(':popover-open') ?? false; }
function cleanup() {
  positioning?.dispose(); positioning = undefined; ready.value = false; focusPending = false;
  ownerDocument?.removeEventListener('pointerdown', outside, true);
  ownerDocument?.removeEventListener('focusin', outside, true);
  view?.removeEventListener('blur', windowBlur); view?.removeEventListener('resize', resize);
}
function close(returnFocus = false) {
  visible.value = false; cleanup();
  if (isOpen()) popup.value?.hidePopover();
  if (returnFocus && mounted) input.value?.focus({ preventScroll: true });
}
function outside(event: Event) {
  const target = event.target;
  if (target instanceof Node && !root.value?.contains(target)) { commit(); close(); }
}
function windowBlur() { commit(); close(); }
function leaving(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && root.value?.contains(event.relatedTarget)) return;
  // A pointer inside the calendar may focus its popover after focusout finishes.
  void nextTick(() => {
    if (!mounted || (ownerDocument?.activeElement && root.value?.contains(ownerDocument.activeElement))) return;
    commit(); close();
  });
}
function focusDay() {
  void nextTick(() => {
    if (!mounted || !visible.value || !ready.value) return;
    const day = popup.value?.querySelector<HTMLButtonElement>(`button[data-date="${activeISO.value}"]:not(:disabled)`);
    if (day) { day.focus({ preventScroll: true }); day.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' }); }
    else popup.value?.focus({ preventScroll: true });
  });
}
function resize() { positioning?.update(); }
function open() {
  if (!mounted || blocked() || composing.value || !popup.value || !input.value) return;
  active.value = constrain(parseISODate(draft.value) ?? parseISODate(props.modelValue) ?? today.value);
  displayed.value = active.value;
  visible.value = true; focusPending = true;
  if (!isOpen()) popup.value.showPopover();
  if (!positioning) {
    ownerDocument?.addEventListener('pointerdown', outside, true); ownerDocument?.addEventListener('focusin', outside, true);
    view?.addEventListener('blur', windowBlur); view?.addEventListener('resize', resize);
    positioning = floatingPosition(input.value, popup.value, () => 'bottom', () => {
      if (!visible.value) return;
      ready.value = true;
      if (focusPending) { focusPending = false; focusDay(); }
    });
  } else { positioning.update(); if (ready.value) { focusPending = false; focusDay(); } }
}
function toggle() { if (visible.value) close(true); else open(); }
function choose(date: CalendarDate) {
  if (blocked() || composing.value || !available(date)) return;
  draft.value = formatISODate(date); validationShown.value = false;
  request(draft.value); close(true);
}
function clear() {
  if (blocked() || !props.clearable) return;
  draft.value = ''; validationShown.value = false; request(''); close(true);
}
function moveTo(date: CalendarDate) { active.value = constrain(date); displayed.value = active.value; focusDay(); positioning?.update(); }
function canChangeMonth(direction: 1 | -1) {
  if (blocked() || configurationError.value) return false;
  const next = addMonths(displayed.value, direction);
  if (next.year === displayed.value.year && next.month === displayed.value.month) return false;
  if (direction < 0 && minimum.value) return next.year > minimum.value.year || (next.year === minimum.value.year && next.month >= minimum.value.month);
  if (direction > 0 && maximum.value) return next.year < maximum.value.year || (next.year === maximum.value.year && next.month <= maximum.value.month);
  return true;
}
function changeMonth(direction: 1 | -1) { if (canChangeMonth(direction)) moveTo(addMonths(active.value, direction)); }
function gridKeydown(event: KeyboardEvent) {
  if (blocked() || composing.value || event.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey) return;
  let next: CalendarDate | undefined;
  if (!event.shiftKey && event.key === 'ArrowLeft') next = addDays(active.value, -1);
  else if (!event.shiftKey && event.key === 'ArrowRight') next = addDays(active.value, 1);
  else if (!event.shiftKey && event.key === 'ArrowUp') next = addDays(active.value, -7);
  else if (!event.shiftKey && event.key === 'ArrowDown') next = addDays(active.value, 7);
  else if (!event.shiftKey && event.key === 'Home') next = addDays(active.value, -isoWeekday(active.value));
  else if (!event.shiftKey && event.key === 'End') next = addDays(active.value, 6 - isoWeekday(active.value));
  else if (event.key === 'PageUp') next = event.shiftKey ? addYears(active.value, -1) : addMonths(active.value, -1);
  else if (event.key === 'PageDown') next = event.shiftKey ? addYears(active.value, 1) : addMonths(active.value, 1);
  if (next) { event.preventDefault(); moveTo(next); }
}
function inputKeydown(event: KeyboardEvent) {
  if (blocked() || composing.value || event.isComposing || event.keyCode === 229 || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Enter' && !event.altKey) { event.preventDefault(); commit(); }
  else if (event.key === 'ArrowDown' && !event.shiftKey) { event.preventDefault(); open(); }
}
function rootKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && visible.value && !composing.value && !event.isComposing) { event.preventDefault(); event.stopPropagation(); close(true); }
}
function nativeToggle() { if (mounted && visible.value && !isOpen()) close(); }
function cancelReset() { resetGeneration++; if (resetTimer !== undefined) clearTimeout(resetTimer); resetTimer = undefined; }
function resetForm() {
  cancelReset(); composing.value = false; pending = undefined; requestRevision++; close(); syncOwner();
  const generation = resetGeneration;
  // Native reset may finish after event microtasks. Read the current owner in a
  // later task, and cancel that task if the user has already started a new edit.
  resetTimer = setTimeout(() => {
    resetTimer = undefined;
    if (mounted && generation === resetGeneration) syncOwner();
  }, 0);
}
function attachForm() { const nextForm = input.value?.form; if (nextForm === form) return; form?.removeEventListener('reset', resetForm); form = nextForm; form?.addEventListener('reset', resetForm); }
onMounted(() => {
  mounted = true; ownerDocument = input.value?.ownerDocument; view = ownerDocument?.defaultView ?? undefined;
  const now = new Date(); today.value = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  attachForm(); syncValidity();
});
onUpdated(() => {
  if (blocked()) { composing.value = false; close(); syncOwner(); }
  attachForm(); syncValidity();
});
watch(() => props.modelValue, () => { syncOwner(); }, { flush: 'post' });
watch(() => [props.min, props.max, props.disabled], () => {
  if (props.disabled) close();
  if (visible.value) { active.value = constrain(active.value); displayed.value = active.value; positioning?.update(); }
  syncValidity();
}, { flush: 'post' });
onBeforeUnmount(() => { mounted = false; requestRevision++; cancelReset(); cleanup(); form?.removeEventListener('reset', resetForm); if (isOpen()) popup.value?.hidePopover(); });
</script>

<template>
  <div ref="root" class="ui-native-field ui-date-picker" :class="{ 'ui-native-field--disabled': disabled, 'ui-native-field--error': Boolean(fieldError) }" @focusout="leaving" @keydown="rootKeydown">
    <label class="ui-native-field__label" :for="inputId">{{ label }}</label>
    <div class="ui-native-field__control ui-date-picker__control" :data-clearable="clearable && !blocked() && Boolean(draft) || undefined">
      <input v-bind="attrs" :id="inputId" ref="input" class="ui-native-control ui-date-picker__input" type="text" :value="draft" :placeholder="placeholder" :disabled="disabled" :readonly="readonly()" :aria-describedby="describedBy()" :aria-invalid="fieldError ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined" @input="edit" @keydown="inputKeydown" @invalid="validationShown = true" @compositionstart="compositionStart" @compositionend="compositionEnd">
      <span class="ui-native-field__registration" aria-hidden="true"></span>
      <button v-if="clearable && !blocked() && Boolean(draft)" class="ui-date-picker__clear" type="button" tabindex="-1" :aria-label="'清空' + label" @mousedown.prevent @click="clear"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" fill="none" stroke="currentColor" stroke-width="1.4" /></svg></button>
      <button class="ui-date-picker__trigger" type="button" :aria-label="(visible ? '收起' : '打开') + label + '日历'" :aria-controls="calendarId" :aria-expanded="visible" :disabled="blocked()" @click="toggle"><svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true"><path d="M3 5h12v10H3zM3 8h12M6 3v4m6-4v4" stroke="currentColor" stroke-width="1.3"/><path d="M6 10h2v2H6z" fill="currentColor"/></svg></button>
    </div>
    <p v-if="hint" :id="`${inputId}-hint`" class="ui-native-field__hint">{{ hint }}</p>
    <!-- Reserve draft feedback before blur so the next pointer target cannot move between down and up. -->
    <p v-if="feedback" :id="fieldError ? `${inputId}-error` : undefined" class="ui-native-field__error ui-date-picker__feedback" :data-pending="!fieldError || undefined" :role="fieldError ? 'alert' : undefined" :aria-hidden="!fieldError || undefined">{{ feedback }}</p>
    <div :id="calendarId" ref="popup" class="ui-date-picker__calendar" popover="manual" role="region" :aria-label="label + '日历'" :aria-describedby="helpId" tabindex="-1" :data-ready="ready || undefined" @toggle="nativeToggle">
      <div class="ui-date-picker__masthead"><span>历盘 · GREGORIAN</span><span>周一始</span></div>
      <div class="ui-date-picker__navigation">
        <button class="ui-date-picker__navigation-button" type="button" aria-label="上一月" :disabled="!canChangeMonth(-1)" @click="changeMonth(-1)"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="m10 3-5 5 5 5" stroke="currentColor" stroke-width="1.4"/></svg></button>
        <h3 :id="monthId" class="ui-date-picker__month" aria-live="polite" aria-atomic="true">{{ monthLabel }}</h3>
        <button class="ui-date-picker__navigation-button" type="button" aria-label="下一月" :disabled="!canChangeMonth(1)" @click="changeMonth(1)"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.4"/></svg></button>
      </div>
      <table class="ui-date-picker__grid" role="grid" :aria-labelledby="monthId" :aria-describedby="helpId" @keydown="gridKeydown">
        <thead><tr><th v-for="(weekday, index) in weekdays" :key="weekday" scope="col" :aria-label="'星期' + (index === 6 ? '日' : weekday)">{{ weekday }}</th></tr></thead>
        <tbody><tr v-for="(week, index) in weeks" :key="index"><td v-for="(date, column) in week" :key="date ? formatISODate(date) : 'empty-' + column" :aria-selected="Boolean(date && formatISODate(date) === selectedISO)" :aria-disabled="!available(date) || undefined"><button v-if="date" class="ui-date-picker__day" type="button" :data-date="formatISODate(date)" :data-outside="date.month !== displayed.month || undefined" :data-today="formatISODate(date) === todayISO || undefined" :aria-label="formatISODate(date)" :aria-current="formatISODate(date) === todayISO ? 'date' : undefined" :tabindex="formatISODate(date) === activeISO && available(date) ? 0 : -1" :disabled="blocked() || !available(date)" @focus="active = date" @click="choose(date)">{{ date.day }}</button><span v-else aria-hidden="true" class="ui-date-picker__empty"></span></td></tr></tbody>
      </table>
      <div class="ui-date-picker__footer"><span>朱砂选定 · 青玉今日</span><button class="ui-date-picker__today" type="button" :disabled="blocked() || !available(today)" @click="moveTo(today)">定位今日</button></div>
      <p :id="helpId" class="ui-date-picker__help">方向键逐日或逐周；Home / End 到周首末。PageUp / Down 换月，配合 Shift 换年。Enter 选定，Escape 回输入。</p>
    </div>
  </div>
</template>

<style scoped>
.ui-date-picker { min-width: 0; }
.ui-date-picker__feedback[data-pending] { visibility: hidden; }
.ui-date-picker__input { padding-right: 48px; font-variant-numeric: tabular-nums; }
.ui-date-picker__control[data-clearable] .ui-date-picker__input { padding-right: 84px; }
.ui-date-picker__trigger, .ui-date-picker__clear { position: absolute; top: 0; bottom: 0; display: grid; place-items: center; width: 36px; min-height: var(--ui-control-height); padding: 0; border: 0; border-radius: 0; background: transparent; color: var(--ui-color-text-secondary); cursor: pointer; transition: color var(--ui-motion-duration-feedback), background-color var(--ui-motion-duration-feedback); }
.ui-date-picker__trigger { right: 0; } .ui-date-picker__clear { right: 36px; }
.ui-date-picker__trigger:hover:not(:disabled), .ui-date-picker__clear:hover { color: var(--ui-color-accent); background: var(--ui-color-accent-soft); }
.ui-date-picker__trigger:focus-visible, .ui-date-picker__clear:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -4px; }
.ui-date-picker__trigger:disabled { opacity: .45; cursor: not-allowed; }
.ui-date-picker__calendar { --ui-calendar-y: -4px; position: fixed; isolation: isolate; inset: auto; display: none; box-sizing: border-box; width: min(348px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); margin: 0; padding: 12px; border: 1px solid var(--ui-color-metal); border-radius: 0; background: var(--ui-color-surface-raised); color: var(--ui-color-text); font: 12px/1.7 var(--ui-font-family); overflow: auto; overscroll-behavior: contain; visibility: hidden; box-shadow: 0 12px 32px color-mix(in srgb, var(--ui-color-ink) 16%, transparent); }
.ui-date-picker__calendar:popover-open { display: block; }
.ui-date-picker__calendar[data-ready] { visibility: visible; animation: ui-calendar-in var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-date-picker__calendar[data-placement='top'] { --ui-calendar-y: 4px; }
.ui-date-picker__calendar::before { content: ''; position: absolute; top: 0; left: 12px; width: 36px; height: 2px; background: var(--ui-color-accent); pointer-events: none; }
.ui-date-picker__masthead { display: flex; justify-content: space-between; gap: 12px; color: var(--ui-color-metal); font: 9px/1.8 var(--ui-font-family-mono); letter-spacing: .08em; }
.ui-date-picker__navigation { display: grid; grid-template-columns: 36px minmax(0, 1fr) 36px; align-items: center; gap: 8px; margin-block: 8px; }
.ui-date-picker__month { margin: 0; text-align: center; font: 500 19px/1.6 var(--ui-font-family-display); font-variant-numeric: tabular-nums; }
.ui-date-picker__navigation-button { display: grid; place-items: center; min-width: 0; height: 36px; padding: 0; border: 1px solid var(--ui-color-rule); border-radius: 0; background: transparent; color: var(--ui-color-text); cursor: pointer; }
.ui-date-picker__navigation-button:hover:not(:disabled) { border-color: var(--ui-color-accent); color: var(--ui-color-accent); }
.ui-date-picker__grid { width: 100%; table-layout: fixed; border-spacing: 0; }
.ui-date-picker__grid th { height: 28px; padding: 0; border-bottom: 1px solid var(--ui-color-rule); color: var(--ui-color-text-secondary); font-size: 10px; font-weight: 400; }
.ui-date-picker__grid td { padding: 0; text-align: center; }
.ui-date-picker__day, .ui-date-picker__empty { box-sizing: border-box; position: relative; display: grid; place-items: center; width: 100%; min-width: 0; height: 36px; padding: 0; border: 2px solid transparent; border-radius: 0; background: transparent; color: var(--ui-color-text); font: 12px/1 var(--ui-font-family-mono); cursor: pointer; }
.ui-date-picker__day[data-outside] { color: var(--ui-color-text-secondary); }
.ui-date-picker__day:hover:not(:disabled) { background: var(--ui-color-accent-soft); color: var(--ui-color-accent); }
.ui-date-picker__day[data-today]::after { content: ''; position: absolute; bottom: 3px; width: 4px; height: 4px; background: var(--ui-color-secondary-accent); transform: rotate(45deg); }
.ui-date-picker__grid td[aria-selected='true'] .ui-date-picker__day { background: var(--ui-color-accent); color: var(--ui-color-on-accent); clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px); }
.ui-date-picker__day:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -4px; }
.ui-date-picker__grid td[aria-selected='true'] .ui-date-picker__day:focus-visible { border-color: var(--ui-color-on-accent); outline: 2px solid var(--ui-color-focus); outline-offset: -4px; }
.ui-date-picker__day:disabled, .ui-date-picker__navigation-button:disabled, .ui-date-picker__today:disabled { opacity: .35; cursor: not-allowed; }
.ui-date-picker__footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--ui-color-rule); color: var(--ui-color-text-secondary); font-size: 10px; }
.ui-date-picker__today { min-height: 32px; padding: 4px 8px; border: 0; border-bottom: 1px solid var(--ui-color-secondary-accent); border-radius: 0; background: transparent; color: var(--ui-color-secondary-accent); font: inherit; cursor: pointer; }
.ui-date-picker__navigation-button:focus-visible, .ui-date-picker__today:focus-visible, .ui-date-picker__calendar:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -3px; }
.ui-date-picker__help { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-calendar-in { from { opacity: 0; transform: translateY(var(--ui-calendar-y)); } to { opacity: 1; transform: translateY(0); } }
:global([data-ui-motion='reduced'] .ui-date-picker__calendar[data-ready]) { animation: none; }
:global([data-ui-motion='reduced'] .ui-date-picker__trigger), :global([data-ui-motion='reduced'] .ui-date-picker__clear) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-date-picker__calendar[data-ready] { animation: none; } .ui-date-picker__trigger, .ui-date-picker__clear { transition: none; } }
@media (pointer: coarse) { .ui-date-picker__trigger, .ui-date-picker__clear { width: 44px; min-height: 44px; } .ui-date-picker__clear { right: 44px; } .ui-date-picker__input { padding-right: 56px; } .ui-date-picker__control[data-clearable] .ui-date-picker__input { padding-right: 100px; } .ui-date-picker__navigation { grid-template-columns: 44px minmax(0, 1fr) 44px; } .ui-date-picker__day, .ui-date-picker__empty, .ui-date-picker__navigation-button, .ui-date-picker__today { min-height: 44px; } }
@media (forced-colors: active) { .ui-date-picker__calendar { border-color: CanvasText; background: Canvas; box-shadow: none; } .ui-date-picker__calendar::before { display: none; } .ui-date-picker__day, .ui-date-picker__navigation-button, .ui-date-picker__today { color: ButtonText; } .ui-date-picker__grid td[aria-selected='true'] .ui-date-picker__day { forced-color-adjust: none; background: Highlight; color: HighlightText; clip-path: none; } .ui-date-picker__day[data-today]::after { forced-color-adjust: none; background: LinkText; } .ui-date-picker__day:focus-visible { outline-color: Highlight; } }
</style>
