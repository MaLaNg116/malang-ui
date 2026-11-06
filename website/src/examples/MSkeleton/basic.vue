<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MCard, MSkeleton } from 'malang-ui';

const loading = ref(true);
</script>

<template>
  <div class="skeleton-demo">
    <div><MButton variant="secondary" @click="loading = !loading">{{ loading ? '显示内容' : '显示占位' }}</MButton></div>
    <MCard title="卷宗简介" :aria-busy="loading || undefined">
      <MSkeleton v-if="loading" :lines="3" />
      <p v-else>这份手记记录了纸样、墨色和装订方式。</p>
    </MCard>
  </div>
</template>

<style scoped>
.skeleton-demo { display: grid; gap: 12px; min-width: 0; }
</style>
