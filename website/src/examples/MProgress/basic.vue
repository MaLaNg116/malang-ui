<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MProgress, MSpace } from 'malang-ui';

const value = ref(36);
</script>

<template>
  <div class="progress-demo">
    <MProgress :value="value" label="资料核对进度" :status="value === 100 ? 'success' : 'default'" />
    <MSpace>
      <MButton :disabled="value === 100" @click="value = Math.min(100, value + 16)">推进进度</MButton>
      <MButton variant="secondary" @click="value = 36">重置进度</MButton>
    </MSpace>
  </div>
</template>

<style scoped>
.progress-demo { display: grid; gap: 12px; min-width: 0; }
</style>
