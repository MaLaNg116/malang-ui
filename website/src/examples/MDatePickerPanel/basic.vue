<script setup lang="ts">
import { ref } from 'vue';
import { MDatePickerPanel } from 'malang-ui';

const selected = ref('2026-11-06');
const unavailable = ['2026-11-09', '2026-11-16'];
const disabledDate = (date: string) => unavailable.includes(date);
</script>

<template>
  <div class="example">
    <MDatePickerPanel
      v-model="selected"
      label="可预约日期"
      min="2026-11-01"
      max="2026-11-30"
      :disabled-date="disabledDate"
    />
    <p>预约日期：{{ selected }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
