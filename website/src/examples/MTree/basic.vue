<script setup lang="ts">
import { ref } from 'vue';
import { MTree, type MTreeNode } from 'malang-ui';

const items: MTreeNode[] = [
  { value: '纸本', label: '纸本', children: [
    { value: '山水拓本', label: '山水拓本' },
    { value: '青竹纹样', label: '青竹纹样' },
  ] },
  { value: '图册', label: '图册', children: [
    { value: '飞檐图册', label: '飞檐图册' },
    { value: '木构详图', label: '木构详图' },
  ] },
];
const selected = ref<string | null>('山水拓本');
const expanded = ref(['纸本']);
</script>

<template>
  <div class="example">
    <MTree v-model="selected" v-model:expanded-values="expanded" :items="items" label="档案目录" />
    <p>当前节点：{{ selected || '尚未选择' }}。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
