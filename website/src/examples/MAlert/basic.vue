<script setup lang="ts">
import { ref } from 'vue';
import { MAlert, MButton } from 'malang-ui';

const needsReview = ref(false);
</script>

<template>
  <div class="alert-demo">
    <MAlert :tone="needsReview ? 'warning' : 'info'" :title="needsReview ? '需要复核' : '资料已登记'" :description="needsReview ? '登记日期与附件名称不一致。' : '可继续补充藏品描述。'" />
    <div><MButton variant="secondary" @click="needsReview = !needsReview">切换提示状态</MButton></div>
  </div>
</template>

<style scoped>
.alert-demo { display: grid; gap: 12px; min-width: 0; }
</style>
