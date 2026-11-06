<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MFlex, MTag } from 'malang-ui';

const column = ref(false);
</script>

<template>
  <div class="flex-demo">
    <div><MButton variant="secondary" @click="column = !column">切换 {{ column ? '横向' : '纵向' }} 排列</MButton></div>
    <MFlex :direction="column ? 'column' : 'row'" :gap="10" align="start" wrap>
      <MTag>纸墨手记</MTag>
      <MTag tone="info">等待核对</MTag>
      <MTag tone="success">附录已登记</MTag>
    </MFlex>
  </div>
</template>

<style scoped>
.flex-demo { display: grid; gap: 12px; }
</style>
