<script setup lang="ts">
import { ref } from 'vue';
import { MTimeSelect } from 'malang-ui';

const slot = ref('10:00');
</script>

<template>
  <div class="example">
    <MTimeSelect v-model="slot" label="预约时段" start="09:00" end="17:00" :step="1800" />
    <p>已选时段：{{ slot || '尚未选择' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
