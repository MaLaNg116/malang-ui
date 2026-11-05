<script setup lang="ts">
import { ref } from 'vue';
import {
  MCascader, MTreeSelect, MColorPicker, MColorPickerPanel, MRate, MTransfer,
  MInputOTP, MInputTag, MMention, MTimePicker, MTimeSelect, MDateRangePicker,
  MDateTimePicker, MDatePickerPanel, MCalendar,
} from 'malang-ui';
import type {
  MReferenceTreeOption, MTransferOption, MMentionOption, MDatePanelCell,
  MCascaderProps, MTreeSelectProps, MColorPickerProps, MColorPickerPanelProps,
  MRateProps, MTransferProps, MInputOTPProps, MInputTagProps, MMentionProps,
  MTimePickerProps, MTimeSelectProps, MDateRangePickerProps, MDateTimePickerProps,
  MDatePickerPanelProps, MCalendarProps,
} from 'malang-ui';
const tree: readonly MReferenceTreeOption[] = [{ value: 'paper', label: '纸本', children: [{ value: 'ink', label: '墨迹' }] }];
const transferOptions: readonly MTransferOption[] = [{ value: 'ink', label: '墨迹' }, { value: 'seal', label: '刻印', disabled: true }];
const mentions: readonly MMentionOption[] = [{ value: 'malang', label: 'MaLang' }];
const path = ref<string[]>(['paper', 'ink']), checkedPaths = ref<string[][]>([['paper', 'ink']]);
const node = ref<string | readonly string[] | null>('ink'), multipleNodes = ref<string | readonly string[] | null>(['ink']);
const color = ref('#28634E'), rating = ref(2.5), transferred = ref<string[]>(['ink']);
const otp = ref(''), tags = ref<string[]>(['墨迹']), mention = ref('');
const time = ref('09:30'), slot = ref('09:00'), range = ref<readonly [string, string] | null>(['2026-11-05', '2026-11-12']);
const dateTime = ref('2026-11-05T09:30'), date = ref('2026-11-05');
const api: {
  cascader: MCascaderProps; tree: MTreeSelectProps; picker: MColorPickerProps; panel: MColorPickerPanelProps;
  rate: MRateProps; transfer: MTransferProps; otp: MInputOTPProps; tags: MInputTagProps; mention: MMentionProps;
  time: MTimePickerProps; select: MTimeSelectProps; range: MDateRangePickerProps; dateTime: MDateTimePickerProps;
  date: MDatePickerPanelProps; calendar: MCalendarProps;
} = {
  cascader: { label: '路径', modelValue: path.value, options: tree }, tree: { label: '目录', modelValue: null, options: tree },
  picker: { label: '颜色', modelValue: color.value }, panel: { label: '颜色面板', modelValue: color.value, alpha: true },
  rate: { label: '评分', modelValue: rating.value, step: 0.5 }, transfer: { label: '项目', modelValue: [], options: transferOptions },
  otp: { label: '验证码', modelValue: '', length: 6 }, tags: { label: '关键词', modelValue: [] }, mention: { label: '协作', modelValue: '', options: mentions },
  time: { label: '时间', modelValue: '09:30', step: 900 }, select: { label: '时段', modelValue: '09:00', start: '08:00', end: '18:00', step: 1800 },
  range: { label: '区间', modelValue: null }, dateTime: { label: '日期时间', modelValue: '', showSeconds: false },
  date: { label: '日期', modelValue: date.value, disabledDate: value => value.endsWith('-13') }, calendar: { label: '日历', modelValue: date.value },
};
const cellLabel = (cell: MDatePanelCell) => `${cell.day}${cell.today ? ' 今日' : ''}`;
</script>
<template>
  <form id="reference-consumer">
    <MCascader v-bind="api.cascader" v-model="path" name="path" required />
    <MCascader v-bind="api.cascader" v-model="path" v-model:checked-paths="checkedPaths" multiple check-strictly name="paths" />
    <MTreeSelect v-bind="api.tree" v-model="node" name="node" />
    <MTreeSelect v-bind="api.tree" v-model="multipleNodes" multiple name="nodes" />
    <MColorPicker v-bind="api.picker" v-model="color" name="color" />
    <MColorPickerPanel v-bind="api.panel" v-model="color" name="panelColor" />
    <MRate v-bind="api.rate" v-model="rating" name="rating" />
    <MTransfer v-bind="api.transfer" v-model="transferred" name="selected" />
    <MInputOTP v-bind="api.otp" v-model="otp" name="otp" autocomplete="one-time-code" />
    <MInputTag v-bind="api.tags" v-model="tags" name="tags" />
    <MMention v-bind="api.mention" v-model="mention" name="mention" />
    <MTimePicker v-bind="api.time" v-model="time" name="time" required />
    <MTimeSelect v-bind="api.select" v-model="slot" name="slot" />
    <MDateRangePicker v-bind="api.range" v-model="range" name="range" min="2026-01-01" max="2027-12-31" />
    <MDateTimePicker v-bind="api.dateTime" v-model="dateTime" name="dateTime" min="2026-01-01T00:00" max="2027-12-31T23:59" />
    <MDatePickerPanel v-bind="api.date" v-model="date" name="date"><template #date="cell">{{ cellLabel(cell) }}</template></MDatePickerPanel>
    <MCalendar v-bind="api.calendar" v-model="date" name="calendar"><template #date="cell">{{ cellLabel(cell) }}</template></MCalendar>
  </form>
  <MDateRangePicker v-bind="api.range" v-model="range" form="reference-consumer" name="externalRange" required />
</template>
