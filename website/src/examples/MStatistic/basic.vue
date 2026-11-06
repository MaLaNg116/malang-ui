<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MStatistic } from 'malang-ui';

const count = ref(24);
</script>

<template>
  <div class="example">
    <MStatistic label="已登记的纸本素材" :value="count" unit="件" description="本次盘点" />
    <MButton variant="secondary" @click="count += 1">登记一件</MButton>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
