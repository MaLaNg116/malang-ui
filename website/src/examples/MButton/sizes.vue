<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MSegmented } from 'malang-ui';
import type { MControlSize } from 'malang-ui';

const size = ref<MControlSize>('md');
const sizes = [
  { value: 'sm', label: '小尺寸' },
  { value: 'md', label: '中尺寸' },
  { value: 'lg', label: '大尺寸' },
];
</script>

<template>
  <div class="button-sizes">
    <MSegmented v-model="size" :options="sizes" label="按钮尺寸" />
    <div class="button-sizes__preview">
      <MButton :size="size">创建项目</MButton>
      <MButton :size="size" variant="secondary">取消</MButton>
    </div>
  </div>
</template>

<style scoped>
.button-sizes { display: grid; justify-items: start; gap: 24px; }
.button-sizes__preview { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; min-height: 48px; }
</style>
