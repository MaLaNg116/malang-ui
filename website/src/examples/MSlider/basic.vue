<script setup lang="ts">
import { ref } from 'vue';
import { MSlider } from 'malang-ui';

const density = ref(40);
</script>

<template>
  <div class="example">
    <MSlider v-model="density" label="墨色浓度" :min="0" :max="100" :step="5" :show-value="false" />
    <p>当前浓度：{{ density }}%</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
