<script setup lang="ts" generic="Row extends object">
import { computed, onBeforeUpdate, onUpdated, ref } from 'vue';
import MEmpty from './MEmpty.vue';
import MSpinner from './MSpinner.vue';
import MPagination from './MPagination.vue';
import type { MTableColumn, MTableProps } from './types';
const props = withDefaults(defineProps<MTableProps<Row>>(), { rowKey: 'id', loading: false, emptyTitle: '暂无数据', emptyDescription: '调整筛选条件，或创建第一条记录。' });
type Key = string | number;
type Sort = { key: string; order: 'asc' | 'desc' } | null;
const emit = defineEmits<{ 'update:sort': [value: Sort]; 'update:filters': [value: Record<string, string>]; 'update:selectedKeys': [value: Key[]]; 'update:expandedKeys': [value: Key[]]; 'update:page': [value: number] }>();
const localSort = ref<Sort>(null), localFilters = ref<Record<string, string>>({}), localSelected = ref<Key[]>([]), localExpanded = ref<Key[]>([]), localPage = ref(1);
const sort = computed(() => props.sort === undefined ? localSort.value : props.sort);
const filters = computed(() => props.filters ?? localFilters.value);
const selected = computed(() => new Set(props.selectedKeys ?? localSelected.value));
const expanded = computed(() => new Set(props.expandedKeys ?? localExpanded.value));
const processed = computed(() => {
  const entries = props.rows.map((row, index) => ({ row, original: index, key: keyOf(row, index) }));
  const filtered = entries.filter(entry => Object.entries(filters.value).every(([key, value]) => !value || String(valueOf(entry.row, key) ?? '') === value));
  const order = sort.value;
  if (order) filtered.sort((a, b) => { const x = valueOf(a.row, order.key), y = valueOf(b.row, order.key); const compare = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }); return (order.order === 'asc' ? compare : -compare) || a.original - b.original; });
  return filtered;
});
const pageSize = computed(() => props.pageSize !== undefined && Number.isFinite(props.pageSize) && props.pageSize > 0 ? Math.max(1, Math.floor(props.pageSize)) : undefined);
const page = computed(() => Math.min(Math.max(1, Math.ceil(processed.value.length / (pageSize.value ?? Math.max(1, processed.value.length)))), Math.max(1, Math.floor(Number.isFinite(props.page ?? localPage.value) ? props.page ?? localPage.value : 1))));
const visible = computed(() => pageSize.value ? processed.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value) : processed.value);
const colspan = computed(() => Math.max(1, props.columns.length + (props.selectable ? 1 : 0) + (props.expandable ? 1 : 0)));
const allChecked = computed(() => visible.value.length > 0 && visible.value.every(entry => selected.value.has(entry.key)));
const someChecked = computed(() => visible.value.some(entry => selected.value.has(entry.key)));
const region = ref<HTMLElement>(); let focusedBeforeUpdate: Element | null = null;
onBeforeUpdate(() => { const active = region.value?.ownerDocument.activeElement; focusedBeforeUpdate = active && region.value?.contains(active) ? active : null; });
onUpdated(() => { const previous = focusedBeforeUpdate; focusedBeforeUpdate = null; const element = region.value; if (previous && !previous.isConnected && element && element.ownerDocument.activeElement === element.ownerDocument.body) element.focus({ preventScroll: true }); });
defineSlots<{
  [name: `cell-${string}`]: ((props: { row: Row; column: MTableColumn; value: unknown; index: number }) => unknown) | undefined;
  empty?: () => unknown;
  loading?: () => unknown;
  expanded?: (props: { row: Row; index: number }) => unknown;
}>();
function valueOf(row: Row, key: string) { return (row as Record<string, unknown>)[key]; }
function keyOf(row: Row, index: number) { const value = valueOf(row, props.rowKey); return typeof value === 'string' || typeof value === 'number' ? value : index; }
function display(value: unknown) { return ['string', 'number', 'boolean'].includes(typeof value) ? String(value) : '—'; }
function cellSlot(key: string): `cell-${string}` { return `cell-${key}`; }
function requestPage(value: number) { if (props.page === undefined) localPage.value = value; emit('update:page', value); }
function sortColumn(column: MTableColumn) { const current = sort.value; const next = current?.key === column.key ? current.order === 'asc' ? { key: column.key, order: 'desc' as const } : null : { key: column.key, order: 'asc' as const }; if (props.sort === undefined) localSort.value = next; emit('update:sort', next); if (pageSize.value) requestPage(1); }
function filterColumn(key: string, event: Event) { const input = event.target as HTMLSelectElement; const next = { ...filters.value, [key]: input.value }; if (props.filters === undefined) localFilters.value = next; emit('update:filters', next); input.value = filters.value[key] ?? ''; if (pageSize.value) requestPage(1); }
function selectRows(event: Event, key?: Key) { const input = event.target as HTMLInputElement, keys = new Set(selected.value); for (const value of key === undefined ? visible.value.map(entry => entry.key) : [key]) { if (input.checked) keys.add(value); else keys.delete(value); } if (props.selectedKeys === undefined) localSelected.value = [...keys]; emit('update:selectedKeys', [...keys]); input.checked = key === undefined ? allChecked.value : selected.value.has(key); }
function expandRow(key: Key) { const keys = new Set(expanded.value); if (keys.has(key)) keys.delete(key); else keys.add(key); if (props.expandedKeys === undefined) localExpanded.value = [...keys]; emit('update:expandedKeys', [...keys]); }
</script>

<template>
  <div ref="region" class="ui-table" role="region" :aria-label="caption" tabindex="0">
    <table class="ui-table__table" :class="{ 'ui-table__table--state': loading || !rows.length || !columns.length }" :aria-busy="loading || undefined">
      <caption class="ui-table__caption">{{ caption }}</caption>
      <thead v-if="columns.length"><tr><th v-if="selectable" scope="col" class="ui-table__selection"><label><input type="checkbox" aria-label="选择本页全部行" :checked="allChecked" :indeterminate="someChecked && !allChecked" :disabled="loading || !visible.length" @change="selectRows($event)" /></label></th><th v-if="expandable" scope="col">详情</th><th v-for="column in columns" :key="column.key" scope="col" :aria-sort="sort?.key === column.key ? sort.order === 'asc' ? 'ascending' : 'descending' : column.sortable ? 'none' : undefined" :style="{ textAlign: column.align || 'start' }"><button v-if="column.sortable" type="button" class="ui-table__sort" :disabled="loading" @click="sortColumn(column)">{{column.label}} <span aria-hidden="true">{{sort?.key === column.key ? sort.order === 'asc' ? '↑' : '↓' : '↕'}}</span></button><template v-else>{{ column.label }}</template><select v-if="column.filterOptions" class="ui-table__filter" :aria-label="'筛选' + column.label" :value="filters[column.key] ?? ''" :disabled="loading" @change="filterColumn(column.key, $event)"><option value="">全部</option><option v-for="option in column.filterOptions" :key="option.value" :value="option.value">{{option.label}}</option></select></th></tr></thead>
      <tbody>
        <tr v-if="loading"><td :colspan="colspan" class="ui-table__state"><slot name="loading"><MSpinner label="正在加载数据" /></slot></td></tr>
        <tr v-else-if="!visible.length || !columns.length"><td :colspan="colspan" class="ui-table__state"><slot name="empty"><MEmpty :title="!columns.length ? '暂无列配置' : emptyTitle" :description="emptyDescription" /></slot></td></tr>
        <template v-for="(entry, index) in visible" v-else :key="entry.key"><tr class="ui-table__row" :aria-selected="selectable ? selected.has(entry.key) : undefined">
          <td v-if="selectable" class="ui-table__selection"><label><input type="checkbox" :aria-label="'选择第' + ((pageSize ? (page - 1) * pageSize : 0) + index + 1) + '行'" :checked="selected.has(entry.key)" @change="selectRows($event, entry.key)" /></label></td><td v-if="expandable"><button type="button" class="ui-table__expand" :aria-expanded="expanded.has(entry.key)" :aria-label="(expanded.has(entry.key) ? '收起' : '展开') + '第' + ((pageSize ? (page - 1) * pageSize : 0) + index + 1) + '行详情'" @click="expandRow(entry.key)">{{expanded.has(entry.key) ? '−' : '+'}}</button></td>
          <td v-for="column in columns" :key="column.key" :style="{ textAlign: column.align || 'start' }"><slot :name="cellSlot(column.key)" :row="entry.row" :column="column" :value="valueOf(entry.row, column.key)" :index="(pageSize ? (page - 1) * pageSize : 0) + index">{{ display(valueOf(entry.row, column.key)) }}</slot></td>
        </tr><tr v-if="expandable && expanded.has(entry.key)" class="ui-table__detail"><td :colspan="colspan"><slot name="expanded" :row="entry.row" :index="(pageSize ? (page - 1) * pageSize : 0) + index"><dl><template v-for="column in columns" :key="column.key"><dt>{{column.label}}</dt><dd>{{display(valueOf(entry.row, column.key))}}</dd></template></dl></slot></td></tr></template>
      </tbody>
    </table>
    <MPagination v-if="pageSize && !loading" :model-value="page" :total="processed.length" :page-size="pageSize" :label="caption + '分页'" @update:model-value="requestPage" />
  </div>
</template>

<style scoped>
.ui-table { min-width: 0; max-width: 100%; overflow: auto; scrollbar-width: thin; scrollbar-color: var(--ui-color-metal) transparent; color: var(--ui-color-text); background: var(--ui-color-surface); font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-table:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: var(--ui-focus-offset); }
.ui-table__table { width: 100%; min-width: 560px; border-collapse: collapse; text-align: start; }
.ui-table__table--state { min-width: 100%; }
.ui-table__caption { text-align: start; padding: var(--ui-space-4); font-family: var(--ui-font-family-display); font-size: var(--ui-font-size-heading); border-bottom: 2px solid var(--ui-color-text); }
.ui-table th, .ui-table td { padding: var(--ui-field-gap) var(--ui-space-4); border-bottom: 1px solid var(--ui-color-rule); vertical-align: middle; overflow-wrap: anywhere; max-width: 420px; }
.ui-table th { color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); font-weight: var(--ui-font-weight-emphasis); background: var(--ui-color-canvas); }
.ui-table__row:hover { background: color-mix(in srgb, var(--ui-color-wash) 15%, transparent); }
.ui-table__state { text-align: center; height: 180px; }
.ui-table__state :deep(.ui-spinner) { margin-inline: auto; }
.ui-table__sort { display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--ui-color-text); font: inherit; cursor: pointer; }.ui-table__filter { box-sizing: border-box; display: block; width: 100%; min-height: 44px; margin-top: 4px; border: 1px solid var(--ui-color-border); border-radius: 0; background: var(--ui-color-surface); color: var(--ui-color-text); font: inherit; }.ui-table__selection { width: 44px; }.ui-table__selection label { display: grid; place-items: center; width: 44px; height: 44px; cursor: pointer; }.ui-table input[type=checkbox] { width: 18px; height: 18px; accent-color: var(--ui-color-accent); }.ui-table__expand { width: 44px; height: 44px; border: 1px solid var(--ui-color-border); border-radius: 0; background: var(--ui-color-surface); color: var(--ui-color-text); font: inherit; cursor: pointer; }.ui-table button:focus-visible, .ui-table select:focus-visible, .ui-table input:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: 2px; }.ui-table__detail { background: var(--ui-color-surface-muted); }.ui-table__detail dl { margin: 0; }.ui-table__detail dd { margin: 0 0 10px; }.ui-table__detail dt { color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); }
</style>
