<script setup lang="ts">
import { computed, ref } from 'vue';
import { MVirtualSelect } from 'malang-ui';

const selected = ref('');
const options = Array.from({ length: 1000 }, (_, index) => ({
  value: String(index + 1),
  label: '档案 ' + String(index + 1).padStart(4, '0'),
}));
const label = computed(() => options.find(option => option.value === selected.value)?.label);
</script>

<template>
  <div class="example">
    <MVirtualSelect v-model="selected" label="检索档案" placeholder="试试 0088" :options="options" :height="220" />
    <p>当前档案：{{ label || '尚未选择' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
