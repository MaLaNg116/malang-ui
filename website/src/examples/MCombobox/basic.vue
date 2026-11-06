<script setup lang="ts">
import { computed, ref } from 'vue';
import { MCombobox } from 'malang-ui';

const collection = ref('ink');
const options = [
  { value: 'ink', label: '水墨档案', description: '笔触与纹样' },
  { value: 'rail', label: '轨道档案', description: '机械构形' },
  { value: 'seal', label: '印章档案', description: '落印图样' },
];
const selected = computed(() => options.find(option => option.value === collection.value)?.label);
</script>

<template>
  <div class="example">
    <MCombobox v-model="collection" label="所属卷宗" placeholder="输入关键词筛选" :options="options" />
    <p>当前卷宗：{{ selected || '尚未选择' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
