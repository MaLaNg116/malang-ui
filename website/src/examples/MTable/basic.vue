<script setup lang="ts">
import { ref } from 'vue';
import { MTable, MTag, type MTableColumn } from 'malang-ui';

const columns: MTableColumn[] = [
  { key: 'name', label: '卷名' },
  { key: 'copies', label: '份数', sortable: true, align: 'end' },
  { key: 'status', label: '状态' },
];
const rows = [
  { id: 1, name: '山水拓本', copies: 12, status: '已入库' },
  { id: 2, name: '青竹纹样', copies: 3, status: '待校对' },
  { id: 3, name: '飞檐图册', copies: 8, status: '已入库' },
];
const selected = ref<(string | number)[]>([]);
</script>

<template>
  <div class="example">
    <MTable v-model:selected-keys="selected" :columns="columns" :rows="rows" caption="卷宗清单" selectable>
      <template #cell-status="{ row }">
        <MTag :tone="row.status === '已入库' ? 'success' : 'warning'">{{ row.status }}</MTag>
      </template>
    </MTable>
    <p>已选 {{ selected.length }} 份卷宗。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
