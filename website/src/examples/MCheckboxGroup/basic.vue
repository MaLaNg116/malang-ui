<script setup lang="ts">
import { ref } from 'vue';
import { MCheckboxGroup } from 'malang-ui';

const formats = ref<string[]>(['SVG']);
const options = ['SVG', 'PNG', 'PDF'].map(value => ({ value, label: value }));
</script>

<template>
  <div class="example">
    <MCheckboxGroup v-model="formats" label="导出格式" :options="options" :min="1" :max="2" />
    <p>已选格式：{{ formats.join('、') || '无' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
