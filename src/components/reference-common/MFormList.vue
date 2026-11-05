<script setup lang="ts" generic="Item extends object">
import { computed } from 'vue';
import type { MFormListProps } from './formListTypes';
const props = defineProps<MFormListProps<Item>>();
const emit = defineEmits<{ 'update:modelValue': [items: Item[]] }>();
const identities = new WeakMap<object, number>(); let sequence = 0;
function key(item: Item, index: number) { if (typeof props.itemKey === 'function') return props.itemKey(item, index); if (props.itemKey) return String(item[props.itemKey]); if (!identities.has(item)) identities.set(item, ++sequence); return identities.get(item)!; }
const fields = computed(() => props.modelValue.map((value, index) => ({ value, index, key: key(value, index), name: `${props.name}.${index}` })));
function add(item: Item, index = props.modelValue.length) { if (!props.disabled && (props.max === undefined || props.modelValue.length < props.max)) { const items = [...props.modelValue]; items.splice(Math.max(0, Math.min(items.length, index)), 0, item); emit('update:modelValue', items); } }
function remove(index: number) { if (!props.disabled && index >= 0 && index < props.modelValue.length && props.modelValue.length > (props.min ?? 0)) emit('update:modelValue', props.modelValue.filter((_, at) => at !== index)); }
function move(from: number, to: number) { if (props.disabled || from < 0 || to < 0 || from >= props.modelValue.length || to >= props.modelValue.length || from === to) return; const items = [...props.modelValue]; items.splice(to, 0, items.splice(from, 1)[0]!); emit('update:modelValue', items); }
defineExpose({ add, remove, move });
</script>
<template><div class="ui-form-list" role="group" :aria-label="label ?? name"><slot :fields="fields" :add="add" :remove="remove" :move="move" /></div></template>
<style scoped>.ui-form-list { display: flex; flex-direction: column; gap: var(--ui-field-gap); min-width: 0; }</style>
