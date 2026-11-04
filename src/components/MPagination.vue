<script setup lang="ts">
import { computed } from 'vue';
import MButton from './MButton.vue';
import type { MPaginationProps } from './types';

const props = withDefaults(defineProps<MPaginationProps>(), { pageSize: 10, disabled: false, label: '分页导航' });
const emit = defineEmits<{ 'update:modelValue': [page: number] }>();
const total = computed(() => Number.isFinite(props.total) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(props.total))) : 0);
const size = computed(() => Number.isFinite(props.pageSize) && props.pageSize >= 1 ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(props.pageSize)) : 10);
const count = computed(() => Math.max(1, Math.ceil(total.value / size.value)));
const current = computed(() => Math.min(count.value, Math.max(1, Number.isFinite(props.modelValue) ? Math.floor(props.modelValue) : 1)));
const pages = computed(() => {
  const values = new Set([1, count.value]);
  for (const value of [current.value - 1, current.value, current.value + 1]) if (value >= 1 && value <= count.value) values.add(value);
  const sorted = [...values].sort((a, b) => a - b);
  const result: (number | string)[] = [];
  sorted.forEach((value, index) => { if (index && value - sorted[index - 1]! > 1) result.push(`gap-${index}`); result.push(value); });
  return result;
});
function select(page: number) {
  if (!props.disabled && page >= 1 && page <= count.value && page !== props.modelValue) emit('update:modelValue', page);
}
</script>

<template>
  <nav class="ui-pagination" :aria-label="label">
    <p class="ui-pagination__summary" role="status" aria-atomic="true">{{ total ? '共 ' + total + ' 条 · 第 ' + current + ' / ' + count + ' 页' : '暂无记录' }}</p>
    <div class="ui-pagination__controls">
      <MButton class="ui-pagination__previous" variant="secondary" size="sm" :disabled="disabled || current <= 1 || !total" @click="select(current - 1)">← 上一页</MButton>
      <div class="ui-pagination__pages">
        <template v-for="page in pages" :key="page">
          <MButton v-if="typeof page === 'number'" size="sm" :variant="page === current ? 'primary' : 'ghost'" :disabled="disabled || !total" :aria-label="'第 ' + page + ' 页'" :aria-current="page === current ? 'page' : undefined" @click="select(page)">{{ page }}</MButton>
          <span v-else class="ui-pagination__ellipsis" aria-hidden="true">…</span>
        </template>
      </div>
      <MButton class="ui-pagination__next" variant="secondary" size="sm" :disabled="disabled || current >= count || !total" @click="select(current + 1)">下一页 →</MButton>
    </div>
  </nav>
</template>

<style scoped>
.ui-pagination { min-width: 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ui-space-4); font-family: var(--ui-font-family); }
.ui-pagination__summary { margin: 0; color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); line-height: 1.7; }
.ui-pagination__controls, .ui-pagination__pages { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-space-2); min-width: 0; max-width: 100%; }
.ui-pagination__pages { gap: var(--ui-space-1); }
.ui-pagination__ellipsis { padding-inline: var(--ui-space-1); color: var(--ui-color-text-secondary); }
@media (max-width: 480px) { .ui-pagination__controls { display: grid; grid-template-columns: 1fr 1fr; width: 100%; } .ui-pagination__pages { grid-column: 1 / -1; grid-row: 1; justify-content: center; } .ui-pagination__previous { justify-self: start; } .ui-pagination__next { justify-self: end; } }
</style>
