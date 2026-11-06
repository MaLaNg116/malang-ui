<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MSpace, MSpinner } from 'malang-ui';

const waiting = ref(true);
</script>

<template>
  <MSpace direction="vertical" align="start">
    <MSpace v-if="waiting" :size="20">
      <span class="sample"><MSpinner size="sm" label="小尺寸等待" />小</span>
      <span class="sample"><MSpinner size="md" label="中尺寸等待" />中</span>
      <span class="sample"><MSpinner size="lg" label="大尺寸等待" />大</span>
    </MSpace>
    <MButton variant="secondary" @click="waiting = !waiting">{{ waiting ? '结束等待' : '显示等待' }}</MButton>
  </MSpace>
</template>

<style scoped>
.sample { display: inline-flex; align-items: center; gap: 8px; }
</style>
