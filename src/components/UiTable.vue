<script setup lang="ts" generic="Row extends object">
import UiEmpty from './UiEmpty.vue';
import UiSpinner from './UiSpinner.vue';
import type { UiTableColumn, UiTableProps } from './types';
const props = withDefaults(defineProps<UiTableProps<Row>>(), { rowKey: 'id', loading: false, emptyTitle: '暂无数据', emptyDescription: '调整筛选条件，或创建第一条记录。' });
defineSlots<{
  [name: `cell-${string}`]: ((props: { row: Row; column: UiTableColumn; value: unknown; index: number }) => unknown) | undefined;
  empty?: () => unknown;
  loading?: () => unknown;
}>();
function valueOf(row: Row, key: string) { return (row as Record<string, unknown>)[key]; }
function keyOf(row: Row, index: number) { const value = valueOf(row, props.rowKey); return typeof value === 'string' || typeof value === 'number' ? value : index; }
function display(value: unknown) { return ['string', 'number', 'boolean'].includes(typeof value) ? String(value) : '—'; }
function cellSlot(key: string): `cell-${string}` { return `cell-${key}`; }
</script>

<template>
  <div class="ui-table" role="region" :aria-label="caption" tabindex="0">
    <table class="ui-table__table" :class="{ 'ui-table__table--state': loading || !rows.length || !columns.length }" :aria-busy="loading || undefined">
      <caption class="ui-table__caption">{{ caption }}</caption>
      <thead v-if="columns.length"><tr><th v-for="column in columns" :key="column.key" scope="col" :style="{ textAlign: column.align || 'start' }">{{ column.label }}</th></tr></thead>
      <tbody>
        <tr v-if="loading"><td :colspan="Math.max(1, columns.length)" class="ui-table__state"><slot name="loading"><UiSpinner label="正在加载数据" /></slot></td></tr>
        <tr v-else-if="!rows.length || !columns.length"><td :colspan="Math.max(1, columns.length)" class="ui-table__state"><slot name="empty"><UiEmpty :title="!columns.length ? '暂无列配置' : emptyTitle" :description="emptyDescription" /></slot></td></tr>
        <tr v-for="(row, index) in rows" v-else :key="keyOf(row, index)" class="ui-table__row">
          <td v-for="column in columns" :key="column.key" :style="{ textAlign: column.align || 'start' }"><slot :name="cellSlot(column.key)" :row="row" :column="column" :value="valueOf(row, column.key)" :index="index">{{ display(valueOf(row, column.key)) }}</slot></td>
        </tr>
      </tbody>
    </table>
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
</style>
