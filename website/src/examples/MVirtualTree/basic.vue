<script setup lang="ts">
import { ref } from 'vue';
import { MVirtualTree, type MTreeNode } from 'malang-ui';

const items: MTreeNode[] = Array.from({ length: 48 }, (_, index) => {
  const group = '保管柜 ' + String(index + 1).padStart(2, '0');
  return {
    value: group,
    label: group,
    children: Array.from({ length: 6 }, (_, slot) => {
      const volume = group + ' · 第 ' + (slot + 1) + ' 卷';
      return { value: volume, label: volume };
    }),
  };
});
const selected = ref<string | null>(null);
const expanded = ref([items[0].value]);
</script>

<template>
  <div class="example">
    <MVirtualTree
      v-model="selected"
      v-model:expanded-values="expanded"
      :items="items"
      :height="224"
      label="保管柜目录"
    />
    <p>当前节点：{{ selected || '尚未选择' }}。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
