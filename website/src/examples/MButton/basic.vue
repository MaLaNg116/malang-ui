<script setup lang="ts">
import { ref } from 'vue';
import { MButton } from 'malang-ui';
const lastAction = ref('');
</script>

<template>
  <div>
    <div class="button-levels">
      <MButton @click="lastAction = '主要操作'">主要操作</MButton>
      <MButton variant="secondary" @click="lastAction = '次要操作'">次要操作</MButton>
      <MButton variant="ghost" @click="lastAction = '文字操作'">文字操作</MButton>
    </div>
    <p role="status">{{ lastAction ? `已触发：${lastAction}` : '点击按钮体验不同的操作层级。' }}</p>
  </div>
</template>

<style scoped>
.button-levels { display: flex; flex-wrap: wrap; gap: 12px; }
p { margin: 20px 0 0; font-size: 14px; color: var(--ui-color-text-secondary); }
</style>
