<script setup lang="ts">
import MDatePickerPanel from './MDatePickerPanel.vue';
import type { MCalendarProps, MDatePanelCell } from './types';
const props=defineProps<MCalendarProps>();const emit=defineEmits<{ 'update:modelValue':[value:string];'panel-change':[month:string] }>();defineSlots<{date?:(cell:MDatePanelCell)=>unknown}>();
</script>
<template><MDatePickerPanel v-bind="props" class="ui-ri-calendar-full" @update:model-value="emit('update:modelValue',$event)" @panel-change="emit('panel-change',$event)"><template #date="cell"><slot name="date" v-bind="cell"><span>{{cell.day}}</span></slot></template></MDatePickerPanel></template>
<style scoped>.ui-ri-calendar-full :deep(.ui-ri-calendar__day){min-height:72px;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;padding:8px;overflow-wrap:anywhere}@media(max-width:480px){.ui-ri-calendar-full :deep(.ui-ri-calendar__day){min-height:56px;padding:4px;font-size:12px}}</style>
