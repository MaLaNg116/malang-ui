<script setup lang="ts">
import { ref } from 'vue';
import { MRate } from 'malang-ui';

const score = ref(3.5);
</script>

<template>
  <div class="example">
    <MRate v-model="score" label="画面完成度" :max="5" :step="0.5" clearable />
    <p>已确认：{{ score }} / 5 分</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
