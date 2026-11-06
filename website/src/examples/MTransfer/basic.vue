<script setup lang="ts">
import { ref } from 'vue';
import { MTransfer } from 'malang-ui';

const archived = ref<string[]>(['印记']);
const titles = ['待归档', '已归档'] as const;
const options = ['墨迹', '刻线', '印记', '经纬', '轨道'].map(value => ({ value, label: value }));
</script>

<template>
  <div class="example">
    <MTransfer v-model="archived" label="归档素材" :titles="titles" :options="options" filterable />
    <p>已归档：{{ archived.join('、') || '无' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
