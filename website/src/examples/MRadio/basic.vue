<script setup lang="ts">
import { ref } from 'vue';
import { MRadio } from 'malang-ui';

const schedule = ref('今日');
</script>

<template>
  <div class="example">
    <div role="group" aria-label="交付时间" class="radio-row">
      <MRadio v-model="schedule" name="delivery-time" value="今日" label="今日" />
      <MRadio v-model="schedule" name="delivery-time" value="明日" label="明日" />
    </div>
    <p>预计{{ schedule }}交付。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.radio-row { display: flex; flex-wrap: wrap; gap: 12px; }
</style>
