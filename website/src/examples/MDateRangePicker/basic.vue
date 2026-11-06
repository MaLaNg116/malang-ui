<script setup lang="ts">
import { ref } from 'vue';
import { MDateRangePicker } from 'malang-ui';

const range = ref<readonly [string, string] | null>(['2026-11-06', '2026-11-09']);
</script>

<template>
  <div class="example">
    <MDateRangePicker v-model="range" label="展览周期" min="2026-11-01" max="2026-11-30" />
    <p>展览周期：{{ range ? range[0] + ' 至 ' + range[1] : '尚未确定' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
