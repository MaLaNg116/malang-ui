<script setup lang="ts">
import { ref } from 'vue';
import { MDatePicker } from 'malang-ui';

const date = ref('2026-11-06');
</script>

<template>
  <div class="example">
    <MDatePicker v-model="date" label="交付日期" min="2026-11-01" max="2026-11-30" />
    <p>交付安排：{{ date || '尚未选择日期' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
