<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MSpace } from 'malang-ui';

const vertical = ref(false);
</script>

<template>
  <div class="space-demo">
    <div><MButton variant="ghost" @click="vertical = !vertical">切换排列方向</MButton></div>
    <MSpace :direction="vertical ? 'vertical' : 'horizontal'" :size="12" align="start" wrap>
      <MButton>保存草稿</MButton>
      <MButton variant="secondary">预览</MButton>
      <MButton variant="ghost">关闭</MButton>
    </MSpace>
  </div>
</template>

<style scoped>
.space-demo { display: grid; gap: 16px; }
</style>
