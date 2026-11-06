<script setup lang="ts">
import { ref } from 'vue';
import { MVirtualTable, type MTableColumn } from 'malang-ui';

const columns: MTableColumn[] = [
  { key: 'title', label: '卷名' },
  { key: 'box', label: '保管柜' },
  { key: 'pages', label: '页数', sortable: true },
];
const rows = Array.from({ length: 800 }, (_, index) => ({
  id: index + 1,
  title: '纸本卷宗 ' + String(index + 1).padStart(4, '0'),
  box: '第 ' + (Math.floor(index / 40) + 1) + ' 柜',
  pages: 8 + (index % 23),
}));
const selected = ref<(string | number)[]>([]);
</script>

<template>
  <div class="example">
    <MVirtualTable
      v-model:selected-keys="selected"
      :columns="columns"
      :rows="rows"
      :height="228"
      caption="纸本卷宗盘点"
      selectable
    />
    <p>共 {{ rows.length }} 卷，已选 {{ selected.length }} 卷。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
