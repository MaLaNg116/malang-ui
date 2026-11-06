<script setup lang="ts">
import { ref } from 'vue';
import { MTimePicker } from 'malang-ui';

const time = ref('09:30');
</script>

<template>
  <div class="example">
    <MTimePicker v-model="time" label="开场时间" min="09:00" max="17:00" :step="900" />
    <p>将于 {{ time || '待定时间' }} 开场。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
