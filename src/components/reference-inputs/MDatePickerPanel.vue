<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue';
import { addDays, addMonths, addYears, calendarMonth, formatISODate, isoWeekday, parseISODate } from '../calendarDate';
import type { CalendarDate } from '../calendarDate';
import type { MDatePanelCell, MDatePickerPanelProps } from './types';
import MValueBridge from './MValueBridge.vue';
import {useReferenceConfig} from './locale';
const props = defineProps<MDatePickerPanelProps>();
const emit = defineEmits<{ 'update:modelValue': [value: string]; 'panel-change': [month: string] }>();
const {config,t}=useReferenceConfig();
defineSlots<{ date?: (cell: MDatePanelCell) => unknown }>();
const id = `ui-ri-calendar-${useId()}`, root = ref<HTMLElement>();
const today = ref('2000-01-01'), view = ref(parseISODate(props.modelValue) || { year: 2000, month: 1, day: 1 }), active = ref(props.modelValue || today.value);
const error = computed(() => (props.min && !parseISODate(props.min)) || (props.max && !parseISODate(props.max)) || (props.min && props.max && props.min > props.max) ? t('date.rangeConfig','日期范围配置无效。') : props.modelValue && !parseISODate(props.modelValue) ? t('date.invalid','模型日期无效。') : '');
function unavailable(value: string) { return !!(props.disabled || (props.min&&!parseISODate(props.min)) || (props.max&&!parseISODate(props.max)) || (props.min&&props.max&&props.min>props.max) || props.min && value < props.min || props.max && value > props.max || props.disabledDate?.(value)); }
function formatter(options:Intl.DateTimeFormatOptions){try{return new Intl.DateTimeFormat(config.value.locale||'zh-CN',{...options,timeZone:'UTC'});}catch{return new Intl.DateTimeFormat('zh-CN',{...options,timeZone:'UTC'});}}
const weekdays=computed(()=>Array.from({length:7},(_,index)=>formatter({weekday:'narrow'}).format(new Date(Date.UTC(2020,0,6+index)))));
const monthNames=computed(()=>Array.from({length:12},(_,index)=>formatter({month:'long'}).format(new Date(Date.UTC(2020,index,1)))));
const caption=computed(()=>{const date=new Date(Date.UTC(2000,view.value.month-1,1));date.setUTCFullYear(view.value.year);return formatter({year:'numeric',month:'long'}).format(date);});
const cells = computed(() => calendarMonth(view.value).map(date => date ? { date: formatISODate(date), day: date.day, inMonth: date.month === view.value.month, selected: formatISODate(date) === props.modelValue, disabled: unavailable(formatISODate(date)), today: formatISODate(date) === today.value } : null));
const tabDate = computed(() => cells.value.find(cell => cell?.date === active.value && !cell.disabled)?.date || cells.value.find(cell => cell && !cell.disabled && cell.inMonth)?.date);
function choose(cell: MDatePanelCell) { if (props.readonly || cell.disabled) return; active.value = cell.date; view.value = parseISODate(cell.date)!; if (cell.date !== props.modelValue) emit('update:modelValue', cell.date); }
function month(delta: number) { if (props.disabled) return; view.value = addMonths(view.value, delta); emit('panel-change', `${String(view.value.year).padStart(4,'0')}-${String(view.value.month).padStart(2,'0')}`); }
async function keyboard(event: KeyboardEvent, value: string) {
  if (props.disabled || event.altKey || event.ctrlKey || event.metaKey) return;
  const date = parseISODate(value)!; let next: CalendarDate;
  if (event.key === 'ArrowRight') next = addDays(date, getComputedStyle(root.value!).direction === 'rtl' ? -1 : 1);
  else if (event.key === 'ArrowLeft') next = addDays(date, getComputedStyle(root.value!).direction === 'rtl' ? 1 : -1);
  else if (event.key === 'ArrowDown') next = addDays(date, 7); else if (event.key === 'ArrowUp') next = addDays(date, -7);
  else if (event.key === 'Home') next = addDays(date, -isoWeekday(date)); else if (event.key === 'End') next = addDays(date, 6 - isoWeekday(date));
  else if (event.key === 'PageUp') next = event.shiftKey ? addYears(date,-1) : addMonths(date,-1); else if (event.key === 'PageDown') next = event.shiftKey ? addYears(date,1) : addMonths(date,1); else return;
  event.preventDefault(); const direction = formatISODate(next) < value ? -1 : 1;
  for (let index=0; index<366 && unavailable(formatISODate(next)); index++) { const candidate=addDays(next,direction); if(formatISODate(candidate)===formatISODate(next))return;next=candidate; }
  if (unavailable(formatISODate(next))) return;
  active.value = formatISODate(next); view.value = next; await nextTick(); root.value?.querySelector<HTMLButtonElement>(`[data-date="${active.value}"]`)?.focus();
}
function changeYear(event: Event) { const control=event.target as HTMLInputElement,year=Number(control.value);if(Number.isInteger(year)&&year>=1&&year<=9999)view.value={year,month:view.value.month,day:1};control.value=String(view.value.year); }
watch(() => props.modelValue, value => { const date=parseISODate(value);if(date){view.value=date;active.value=value;} });
onMounted(() => { const date=new Date();today.value=formatISODate({year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate()});if(!props.modelValue){view.value=parseISODate(today.value)!;active.value=today.value;} });
</script>
<template><section ref="root" class="ui-ri ui-ri-calendar" :aria-labelledby="id"><span :id="id" class="ui-ri__label">{{ label }}</span><div class="ui-ri__row"><button type="button" class="ui-ri__button" :disabled="disabled || view.year === 1 && view.month === 1" :aria-label="t('previous','上个月')" @click="month(-1)">‹</button><input class="ui-ri__control ui-ri-calendar__year" type="number" :aria-label="t('date.year','日历年份')" :value="view.year" min="1" max="9999" :disabled="disabled" @change="changeYear"><select class="ui-ri__control ui-ri-calendar__month" :aria-label="t('date.month','日历月份')" :value="view.month" :disabled="disabled" @change="view = {year:view.year,month:Number(($event.target as HTMLSelectElement).value),day:1}"><option v-for="monthIndex in 12" :key="monthIndex" :value="monthIndex">{{ monthNames[monthIndex-1] }}</option></select><button type="button" class="ui-ri__button" :disabled="disabled || view.year === 9999 && view.month === 12" :aria-label="t('next','下个月')" @click="month(1)">›</button><button type="button" class="ui-ri__button" :disabled="disabled" @click="view=parseISODate(today)!;active=today">{{t('today','今天')}}</button></div><table class="ui-ri-calendar__table" role="grid" :aria-label="caption"><thead><tr><th v-for="day in weekdays" :key="day" scope="col">{{day}}</th></tr></thead><tbody><tr v-for="week in 6" :key="week"><td v-for="column in 7" :key="column" :aria-selected="cells[(week-1)*7+column-1]?.selected || false"><button v-if="cells[(week-1)*7+column-1]" type="button" class="ui-ri__button ui-ri-calendar__day" :data-date="cells[(week-1)*7+column-1]!.date" :data-outside="!cells[(week-1)*7+column-1]!.inMonth || undefined" :aria-label="cells[(week-1)*7+column-1]!.date" :aria-pressed="cells[(week-1)*7+column-1]!.selected" :aria-current="cells[(week-1)*7+column-1]!.today ? 'date' : undefined" :tabindex="cells[(week-1)*7+column-1]!.date === tabDate ? 0 : -1" :disabled="cells[(week-1)*7+column-1]!.disabled" @keydown="keyboard($event,cells[(week-1)*7+column-1]!.date)" @click="choose(cells[(week-1)*7+column-1]!)"><slot name="date" v-bind="cells[(week-1)*7+column-1]!">{{cells[(week-1)*7+column-1]!.day}}</slot></button></td></tr></tbody></table><p v-if="error" class="ui-ri__error">{{error}}</p><MValueBridge v-bind="props" :values="modelValue ? [modelValue] : []" :error="error || (modelValue && unavailable(modelValue) ? t('date.unavailable','日期不可选择。') : '')"/></section></template>
<style scoped>.ui-ri-calendar__table{table-layout:fixed;width:100%;border-collapse:collapse}.ui-ri-calendar__table th{font-size:11px;color:var(--ui-color-text-secondary);padding:8px 0}.ui-ri-calendar__table td{padding:1px;vertical-align:top}.ui-ri-calendar__day{width:100%;min-width:0;padding:6px 0}.ui-ri-calendar__day[data-outside]{opacity:.5}.ui-ri-calendar__day[aria-current=date]{text-decoration:underline;text-decoration-color:var(--ui-color-secondary-accent);text-underline-offset:5px}.ui-ri-calendar__year{width:90px}.ui-ri-calendar__month{width:88px}@media(pointer:coarse){.ui-ri-calendar__day{min-width:0;min-height:44px}}</style>
