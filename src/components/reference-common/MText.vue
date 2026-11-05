<script setup lang="ts">
import MTypography from './MTypography.vue';
import type { MTypographyProps } from './textTypes';
const props = withDefaults(defineProps<MTypographyProps>(), { as: 'span' });
const emit = defineEmits<{ 'update:modelValue': [value: string]; copy: [value: string]; error: [error: unknown] }>();
</script>
<template><MTypography v-bind="props" @update:model-value="emit('update:modelValue', $event)" @copy="emit('copy', $event)" @error="emit('error', $event)"><slot>{{ modelValue }}</slot></MTypography></template>
