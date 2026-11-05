<script setup lang="ts">
import { computed,nextTick,ref,watch } from 'vue';
import MDatePicker from '../MDatePicker.vue';
import { parseISODate } from '../calendarDate';
import MValueBridge from './MValueBridge.vue';
import { useDraftReset } from './shared';
import { useReferenceConfig } from './locale';
import type { MDateRangePickerProps } from './types';
const props=defineProps<MDateRangePickerProps>();const emit=defineEmits<{ 'update:modelValue':[value:readonly[string,string]|null] }>();const {t}=useReferenceConfig();const root=ref<HTMLElement>(),start=ref(props.modelValue?.[0]||''),end=ref(props.modelValue?.[1]||'');
function restore(){start.value=props.modelValue?.[0]||'';end.value=props.modelValue?.[1]||'';}
const error=computed(()=>{if(props.min&&!parseISODate(props.min)||props.max&&!parseISODate(props.max)||props.min&&props.max&&props.min>props.max)return t('date.rangeConfig','日期范围配置无效。');if(!start.value&&!end.value)return '';if(!parseISODate(start.value)||!parseISODate(end.value))return t('date.rangeIncomplete','请补全有效的起止日期。');if(start.value>end.value)return t('date.rangeOrder','开始日期不得晚于结束日期。');if(props.min&&start.value<props.min||props.max&&end.value>props.max)return t('date.rangeBounds','日期区间超出可用范围。');return '';});
function change(which:'start'|'end',value:string){if(props.disabled||props.readonly)return;if(which==='start')start.value=value;else end.value=value;if(!value){emit('update:modelValue',null);void nextTick(restore);}else if(!error.value&&start.value&&end.value){emit('update:modelValue',[start.value,end.value]);void nextTick(restore);}}
watch(()=>props.modelValue,restore,{deep:true});useDraftReset(root,restore);
</script>
<template><div ref="root" class="ui-ri" role="group" :aria-label="label"><span class="ui-ri__label">{{label}}</span><div class="ui-ri__grid"><MDatePicker :model-value="start" :label="t('date.start','开始日期')" :form="form" :required="required" :min="min" :max="max" :disabled="disabled" :readonly="readonly" @update:model-value="change('start',$event)"/><MDatePicker :model-value="end" :label="t('date.end','结束日期')" :form="form" :required="required" :min="start&&parseISODate(start)?start:min" :max="max" :disabled="disabled" :readonly="readonly" @update:model-value="change('end',$event)"/></div><p v-if="error" class="ui-ri__error">{{error}}</p><MValueBridge v-bind="props" :values="modelValue||[]" :error="error"/></div></template>
