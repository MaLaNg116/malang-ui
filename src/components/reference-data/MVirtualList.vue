<script setup lang="ts" generic="Item">
import { computed, ref, useId, watch } from 'vue';
import MSpinner from '../MSpinner.vue';
import MScrollbar from './MScrollbar.vue';
import { dataKey, useVirtualWindow } from './useVirtualWindow';
import { useMConfig } from '../../composables/useConfig';
import type { MDataKey, MVirtualListProps } from './types';
import './reference-data.css';
const props = withDefaults(defineProps<MVirtualListProps<Item>>(), { height: 320, itemHeight: 44, overscan: 4, selectable: false, loading: false, disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: MDataKey] }>();
defineSlots<{ item?: (props: { item: Item; index: number; selected: boolean }) => unknown; header?: () => unknown; footer?: () => unknown; empty?: () => unknown }>();
const { t } = useMConfig(), scrollbar = ref<InstanceType<typeof MScrollbar>>(), active = ref(0), identity = `ui-virtual-list-${useId()}`;
const localValue = ref<MDataKey | null>(null), selectedValue = computed(() => props.modelValue === undefined ? localValue.value : props.modelValue);
const windowed = useVirtualWindow({ count: () => props.loading ? 0 : props.items.length, itemHeight: () => props.selectable ? Math.max(44, props.itemHeight) : props.itemHeight, height: () => props.height, overscan: () => props.overscan, viewport: () => scrollbar.value?.viewport });
const rows = computed(() => windowed.indices.value.map(index => ({ index, item: props.items[index]!, key: dataKey(props.items[index]!, index, props.itemKey) })));
const activeId = computed(() => props.selectable && rows.value.some(row => row.index === active.value) ? `${identity}-${active.value}` : undefined);
function select(index: number) { if (props.disabled || !props.selectable) return; active.value = index; scrollbar.value?.viewport?.focus({ preventScroll: true }); const value = dataKey(props.items[index]!, index, props.itemKey); if (props.modelValue === undefined) localValue.value = value; emit('update:modelValue', value); }
function keydown(event: KeyboardEvent) {
  if (event.target !== scrollbar.value?.viewport || event.altKey || event.ctrlKey || event.metaKey || event.isComposing || props.disabled) return;
  let next = active.value;
  if (event.key === 'ArrowDown') next++; else if (event.key === 'ArrowUp') next--; else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = props.items.length - 1;
  else if (event.key === 'PageDown') next += Math.floor(windowed.height.value / windowed.rowHeight.value); else if (event.key === 'PageUp') next -= Math.floor(windowed.height.value / windowed.rowHeight.value);
  else if ((event.key === 'Enter' || event.key === ' ') && props.selectable) { event.preventDefault(); if (props.items.length) select(active.value); return; } else return;
  event.preventDefault(); active.value = Math.max(0, Math.min(props.items.length - 1, next)); windowed.scrollToIndex(active.value);
}
watch(selectedValue, value => { const index = props.items.findIndex((item, index) => dataKey(item, index, props.itemKey) === value); if (index >= 0) active.value = index; }, { immediate: true });
watch(() => props.items.length, length => { active.value = Math.max(0, Math.min(length - 1, active.value)); });
defineExpose({ scrollToIndex: windowed.scrollToIndex, scrollTo: windowed.scrollTo, viewport: computed(() => scrollbar.value?.viewport) });
</script>
<template>
  <section class="ui-data ui-virtual-list" :aria-busy="loading || undefined">
    <header v-if="$slots.header" class="ui-data__heading"><slot name="header" /></header>
    <MScrollbar ref="scrollbar" :height="windowed.height.value" :label="label" :role="selectable ? 'listbox' : 'list'" tabindex="0" :aria-disabled="disabled || undefined" :aria-activedescendant="activeId" @scroll="windowed.update" @keydown="keydown" @focusin="windowed.focusin" @focusout="windowed.focusout">
      <div v-if="loading" class="ui-data__state"><MSpinner :label="t('loading', '加载中')" /></div>
      <div v-else-if="!items.length" class="ui-data__empty"><slot name="empty">{{ emptyText ?? t('empty', '暂无内容') }}</slot></div>
      <div v-else class="ui-virtual__canvas" :style="{ height: windowed.totalHeight.value + 'px' }" role="none"><div v-for="row in rows" :id="`${identity}-${row.index}`" :key="row.key" class="ui-virtual__row" :role="selectable ? 'option' : 'listitem'" :aria-selected="selectable ? row.key === selectedValue : undefined" :aria-posinset="row.index + 1" :aria-setsize="items.length" :data-virtual-index="row.index" :data-selectable="selectable || undefined" :data-active="selectable && row.index === active || undefined" :data-selected="selectable && row.key === selectedValue || undefined" :style="{ top: row.index * windowed.rowHeight.value + 'px', height: windowed.rowHeight.value + 'px' }" @click="select(row.index)"><slot name="item" :item="row.item" :index="row.index" :selected="row.key === selectedValue"><span class="ui-virtual__copy">{{ row.item }}</span></slot></div></div>
    </MScrollbar>
    <footer v-if="$slots.footer" class="ui-data__footer"><slot name="footer" /></footer>
  </section>
</template>
