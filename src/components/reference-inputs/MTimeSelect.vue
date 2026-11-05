<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import type { MTimeSelectProps } from './types';
import { timeSeconds, formatTime, timeError, useNativeOwner } from './shared';
import './referenceInputs.css';
import {useReferenceConfig} from './locale';
const props=withDefaults(defineProps<MTimeSelectProps>(),{start:'08:00',end:'18:00',step:1800});const emit=defineEmits<{ 'update:modelValue':[value:string] }>();const {t}=useReferenceConfig();const control=ref<HTMLSelectElement>();const identity=`ui-time-select-${useId()}`;
const error=computed(()=>timeError(props.modelValue,props.min||props.start,props.max||props.end,props.step,t)||timeError('',props.start,props.end,props.step,t));
const times=computed(()=>{const a=timeSeconds(props.start),b=timeSeconds(props.end);if(a===null||b===null||a>b||!Number.isInteger(props.step)||props.step<1)return[];return Array.from({length:Math.min(86400,Math.floor((b-a)/props.step)+1)},(_,index)=>formatTime(a+index*props.step,props.showSeconds||props.step%60!==0));});
const sync=useNativeOwner(control,()=>props.modelValue,()=>props.disabled||props.readonly?'':error.value);
function update(event:Event){const value=(event.target as HTMLSelectElement).value;if(!props.disabled&&!props.readonly&&value!==props.modelValue)emit('update:modelValue',value);void sync();}
</script>
<template><div class="ui-ri"><label :for="id||identity" class="ui-ri__label">{{label}}</label><select :id="id||identity" ref="control" class="ui-ri__control" :value="modelValue" :name="name" :form="form" :required="required&&!readonly" :disabled="disabled" :aria-readonly="readonly || undefined" :aria-invalid="!!error || undefined" @change="update"><option value="">{{t('time.placeholder','请选择时间')}}</option><option v-if="modelValue && !times.includes(modelValue)" :value="modelValue" disabled>{{modelValue}}（{{t('time.unavailable','不在选项内')}}）</option><option v-for="time in times" :key="time" :value="time" :disabled="!!timeError(time,min||start,max||end,step)">{{time}}</option></select><p v-if="error" class="ui-ri__error">{{error}}</p></div></template>
