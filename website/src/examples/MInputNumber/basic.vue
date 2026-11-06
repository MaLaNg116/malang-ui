<script setup lang="ts">
import { ref } from 'vue';
import { MInputNumber } from 'malang-ui';

const thickness = ref<number | null>(2);
</script>

<template>
  <div class="example">
    <MInputNumber v-model="thickness" label="线条宽度" :min="0.5" :max="6" :step="0.5" hint="每次调整 0.5 px" />
    <p>当前宽度：{{ thickness === null ? '未填写' : thickness + ' px' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
