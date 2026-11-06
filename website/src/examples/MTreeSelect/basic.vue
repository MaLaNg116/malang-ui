<script setup lang="ts">
import { ref } from 'vue';
import { MTreeSelect, type MReferenceTreeOption } from 'malang-ui';

const selected = ref<string | readonly string[] | null>(null);
const options: MReferenceTreeOption[] = [
  { value: '设计资料', label: '设计资料', children: [
    { value: '初版草稿', label: '初版草稿' },
    { value: '最终稿', label: '最终稿' },
  ] },
  { value: '交付记录', label: '交付记录' },
];
</script>

<template>
  <div class="example">
    <MTreeSelect v-model="selected" label="关联目录" :options="options" filterable />
    <p>已选目录：{{ typeof selected === 'string' ? selected : selected?.join('、') || '尚未选择' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
