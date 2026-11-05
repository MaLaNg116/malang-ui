<script setup lang="ts" generic="Row extends object">
import { computed, ref } from 'vue';
import type { MTableColumn } from '../types';
import type { MDataKey, MVirtualAlign, MVirtualTableProps } from './types';
import MScrollbar from './MScrollbar.vue';
import { dataKey, useVirtualWindow } from './useVirtualWindow';
import { useMConfig } from '../../composables/useConfig';
import './reference-data.css';
const props = withDefaults(defineProps<MVirtualTableProps<Row>>(), { height: 360, itemHeight: 48, overscan: 4, rowKey: 'id', selectable: false, loading: false });
const emit = defineEmits<{ 'update:sort': [value: { key: string; order: 'asc' | 'desc' } | null]; 'update:selectedKeys': [value: MDataKey[]] }>();
defineSlots<{ [name: `cell-${string}`]: ((props: { row: Row; column: MTableColumn; value: unknown; index: number }) => unknown) | undefined }>();
const { t } = useMConfig(), scrollbar = ref<InstanceType<typeof MScrollbar>>(), table = ref<HTMLTableElement>();
const localSort = ref<{ key: string; order: 'asc' | 'desc' } | null>(null), localKeys = ref<MDataKey[]>([]);
const sort = computed(() => props.sort === undefined ? localSort.value : props.sort);
const selected = computed(() => new Set(props.selectedKeys ?? localKeys.value));
const getValue = (row: Row, key: string) => (row as Record<string, unknown>)[key];
const sorted = computed(() => {
  const rows = props.rows.map((row, index) => ({ row, key: dataKey(row, index, props.rowKey), original: index }));
  const order = sort.value; if (!order) return rows;
  return rows.sort((a, b) => { const x = getValue(a.row, order.key), y = getValue(b.row, order.key); const comparison = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }); return (order.order === 'asc' ? comparison : -comparison) || a.original - b.original; });
});
const windowed = useVirtualWindow({ count: () => props.loading ? 0 : sorted.value.length, itemHeight: () => Math.max(44, props.itemHeight), height: () => props.height, overscan: () => props.overscan, viewport: () => scrollbar.value?.viewport });
const segments = computed(() => {
  const rows: { index: number; gap: number; entry: typeof sorted.value[number] }[] = []; let previous = -1;
  for (const index of windowed.indices.value) { const entry = sorted.value[index]; if (entry) { rows.push({ index, gap: index - previous - 1, entry }); previous = index; } }
  return { rows, tail: Math.max(0, sorted.value.length - previous - 1) };
});
const columnsCount = computed(() => Math.max(1, props.columns.length + (props.selectable ? 1 : 0)));
function toggleSort(column: MTableColumn) {
  if (!column.sortable) return; const current = sort.value;
  const next = current?.key === column.key ? current.order === 'asc' ? { key: column.key, order: 'desc' as const } : null : { key: column.key, order: 'asc' as const };
  if (props.sort === undefined) localSort.value = next; emit('update:sort', next); windowed.scrollTo({ top: 0 });
}
function toggle(key: MDataKey, event: Event) {
  const input = event.target as HTMLInputElement, keys = new Set(selected.value); if (input.checked) keys.add(key); else keys.delete(key);
  if (props.selectedKeys === undefined) localKeys.value = [...keys]; emit('update:selectedKeys', [...keys]); input.checked = selected.value.has(key);
}
function display(value: unknown) { return ['string', 'number', 'boolean'].includes(typeof value) ? String(value) : '—'; }
function slotName(key: string): `cell-${string}` { return `cell-${key}`; }
function scrollToIndex(index: number, align: MVirtualAlign = 'auto') {
  const viewport = scrollbar.value?.viewport; if (!viewport || !sorted.value.length || !Number.isFinite(index)) return;
  const head = table.value?.tHead?.getBoundingClientRect().height ?? 0, caption = table.value?.caption?.getBoundingClientRect().height ?? 0;
  const target = caption + head + Math.max(0, Math.min(sorted.value.length - 1, Math.floor(index))) * windowed.rowHeight.value;
  const current = viewport.scrollTop, available = viewport.clientHeight;
  const top = align === 'start' ? target - head : align === 'center' ? target - head - (available - head - windowed.rowHeight.value) / 2 : align === 'end' ? target + windowed.rowHeight.value - available : target < current + head ? target - head : target + windowed.rowHeight.value > current + available ? target + windowed.rowHeight.value - available : current;
  windowed.scrollTo({ top: Math.max(0, top) });
}
defineExpose({ scrollToIndex, scrollTo: windowed.scrollTo, viewport: computed(() => scrollbar.value?.viewport) });
</script>
<template>
  <MScrollbar ref="scrollbar" class="ui-data ui-virtual-table" :height="windowed.height.value" :label="caption" @scroll="windowed.update" @focusin="windowed.focusin" @focusout="windowed.focusout">
    <table ref="table" class="ui-virtual-table__table" :aria-rowcount="rows.length + 1" :aria-busy="loading || undefined"><caption>{{caption}}</caption><thead><tr aria-rowindex="1"><th v-if="selectable" scope="col">选择</th><th v-for="column in columns" :key="column.key" scope="col" :aria-sort="sort?.key === column.key ? sort.order === 'asc' ? 'ascending' : 'descending' : column.sortable ? 'none' : undefined" :style="{ textAlign: column.align || 'start' }"><button v-if="column.sortable" type="button" @click="toggleSort(column)">{{column.label}} <span aria-hidden="true">{{sort?.key === column.key ? sort.order === 'asc' ? '↑' : '↓' : '↕'}}</span></button><template v-else>{{column.label}}</template></th></tr></thead>
    <tbody><tr v-if="loading || !sorted.length || !columns.length"><td :colspan="columnsCount" class="ui-data__empty">{{loading ? t('loading', '加载中') : t('empty', '暂无数据')}}</td></tr><template v-else v-for="segment in segments.rows" :key="segment.entry.key"><tr v-if="segment.gap" aria-hidden="true" class="ui-virtual-table__spacer" :style="{ height: segment.gap * windowed.rowHeight.value + 'px' }"><td :colspan="columnsCount" /></tr><tr :aria-rowindex="segment.index + 2" :data-virtual-index="segment.index" :data-selected="selected.has(segment.entry.key) || undefined" :style="{ height: windowed.rowHeight.value + 'px' }"><td v-if="selectable" class="ui-virtual-table__selection"><label><input type="checkbox" :aria-label="'选择第' + (segment.index + 1) + '行'" :checked="selected.has(segment.entry.key)" @change="toggle(segment.entry.key, $event)" /></label></td><td v-for="column in columns" :key="column.key" :style="{ textAlign: column.align || 'start' }"><div class="ui-virtual-table__cell" :style="{ maxHeight: windowed.rowHeight.value - 16 + 'px' }"><slot :name="slotName(column.key)" :row="segment.entry.row" :column="column" :value="getValue(segment.entry.row, column.key)" :index="segment.index">{{display(getValue(segment.entry.row, column.key))}}</slot></div></td></tr></template><tr v-if="!loading && sorted.length && columns.length && segments.tail" aria-hidden="true" class="ui-virtual-table__spacer" :style="{ height: segments.tail * windowed.rowHeight.value + 'px' }"><td :colspan="columnsCount" /></tr></tbody></table>
  </MScrollbar>
</template>
<style scoped>
.ui-virtual-table__table { width: 100%; min-width: 480px; border-collapse: collapse; table-layout: fixed; text-align: start; }.ui-virtual-table caption { padding: 12px 16px; text-align: start; font-family: var(--ui-font-family-display); }.ui-virtual-table th { position: sticky; z-index: 2; top: 0; background: var(--ui-color-canvas); }.ui-virtual-table th, .ui-virtual-table td { height: inherit; padding: 8px 16px; border-bottom: 1px solid var(--ui-color-rule); }.ui-virtual-table th button { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--ui-color-text); font: inherit; cursor: pointer; }.ui-virtual-table td.ui-virtual-table__selection { padding-block: 0; }.ui-virtual-table__selection label { display: grid; place-items: center; width: 44px; height: 44px; cursor: pointer; }.ui-virtual-table__cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.ui-virtual-table__spacer td { height: inherit; padding: 0; border: 0; line-height: 0; }.ui-virtual-table tr[data-selected] { background: var(--ui-color-accent-soft); }.ui-virtual-table td:has(input[type=checkbox]), .ui-virtual-table th:first-child:has(+ th) { min-width: 64px; }.ui-virtual-table input[type=checkbox] { width: 18px; height: 18px; }
</style>
