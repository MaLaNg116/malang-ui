<script setup lang="ts">
import { ref } from 'vue';
import { MSegmented } from 'malang-ui';

const view = ref('总览');
const options = ['总览', '明细', '记录'].map(value => ({ value, label: value }));
</script>

<template>
  <div class="example">
    <MSegmented v-model="view" label="工作视图" :options="options" />
    <p>正在查看：{{ view }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
