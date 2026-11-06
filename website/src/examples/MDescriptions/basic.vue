<script setup lang="ts">
import { computed, ref } from 'vue';
import { MDescriptions, MSegmented, MTag, type MDescriptionItem } from 'malang-ui';

const source = ref('paper');
const options = [{ value: 'paper', label: '纸本' }, { value: 'book', label: '图册' }];
const items = computed<MDescriptionItem[]>(() => {
  const paper = source.value === 'paper';
  return [
    { key: 'name', label: '卷名', value: paper ? '山水拓本' : '飞檐图册' },
    { key: 'drawer', label: '保管柜', value: paper ? '甲 03' : '丙 12' },
    { key: 'status', label: '状态', value: paper ? '已入库' : '待校对' },
  ];
});
</script>

<template>
  <div class="example">
    <MSegmented v-model="source" :options="options" label="档案类型" />
    <MDescriptions :items="items" :columns="2" label="卷宗详情">
      <template #status="{ item }">
        <MTag :tone="item.value === '已入库' ? 'success' : 'warning'">{{ item.value }}</MTag>
      </template>
    </MDescriptions>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
