<script setup lang="ts">
import { ref } from 'vue';
import { MDateTimePicker } from 'malang-ui';

const scheduled = ref('2026-11-07T13:30');
</script>

<template>
  <div class="example">
    <MDateTimePicker
      v-model="scheduled"
      label="定时交付"
      min="2026-11-06T09:00"
      max="2026-11-08T17:00"
      :step="1800"
    />
    <p>计划交付：{{ scheduled ? scheduled.replace('T', ' ') : '尚未设定' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
