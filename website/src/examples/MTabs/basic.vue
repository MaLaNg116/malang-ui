<script setup lang="ts">
import { ref } from 'vue';
import { MTabs } from 'malang-ui';

const active = ref('overview');
const items = [
  { value: 'overview', label: '概况' },
  { value: 'history', label: '记录' },
  { value: 'notes', label: '备注', disabled: true },
];
</script>

<template>
  <MTabs v-model="active" :items="items" label="档案视图">
    <template #overview><p>卷宗编号 INK-028，已完成第一轮核对。</p></template>
    <template #history><p>11 月 6 日 · 已登记藏品名称与分类。</p></template>
  </MTabs>
</template>
