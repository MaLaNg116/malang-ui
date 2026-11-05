<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from 'vue';
import type { MReferenceFieldProps } from './types';
import './referenceInputs.css';
import {useReferenceConfig} from './locale';
defineOptions({inheritAttrs:false});
const props = defineProps<MReferenceFieldProps & { values: readonly string[]; error?: string }>();
const input = ref<HTMLInputElement>(); const reported = ref(false);
const {t}=useReferenceConfig();
const message = computed(() => props.error || (props.required && !props.values.length ? t('field.required',`请选择或填写${props.label}。`) : ''));
function sync() { input.value?.setCustomValidity(props.disabled || props.readonly ? '' : message.value); }
function invalid(event: Event) { event.preventDefault(); reported.value = true; const root = input.value?.closest('.ui-ri'); root?.querySelector<HTMLElement>('button:not(:disabled),input:not(.ui-ri__bridge):not([type=hidden]):not(:disabled),textarea:not(:disabled),select:not(:disabled)')?.focus(); }
onMounted(sync); onUpdated(sync);
</script>
<template><input ref="input" class="ui-ri__bridge" type="text" tabindex="-1" aria-hidden="true" :value="values.join(',')" :form="form" :disabled="disabled" :readonly="readonly" @invalid="invalid"><input v-for="(value,index) in values" :key="index" type="hidden" :name="name" :value="value" :form="form" :disabled="disabled"><p v-if="reported && message" class="ui-ri__error" role="alert">{{ message }}</p></template>
