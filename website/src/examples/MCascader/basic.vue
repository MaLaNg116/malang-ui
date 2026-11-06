<script setup lang="ts">
import { ref } from 'vue';
import { MCascader, type MReferenceTreeOption } from 'malang-ui';

const path = ref<string[]>([]);
const options: MReferenceTreeOption[] = [
  { value: '纸本', label: '纸本', children: [
    { value: '墨迹', label: '墨迹' },
    { value: '线稿', label: '线稿' },
  ] },
  { value: '机关', label: '机关', children: [
    { value: '轨道', label: '轨道' },
    { value: '印面', label: '印面' },
  ] },
];
</script>

<template>
  <div class="example">
    <MCascader v-model="path" label="归档路径" :options="options" />
    <p>已选路径：{{ path.join(' / ') || '尚未选择' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
