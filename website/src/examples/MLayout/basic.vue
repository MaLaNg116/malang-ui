<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MLayout } from 'malang-ui';

const showAside = ref(true);
</script>

<template>
  <MLayout label="藏品工作台" :aside-width="138" :gap="10">
    <template #header>
      <div class="pane header"><strong>藏品工作台</strong><MButton variant="ghost" size="sm" @click="showAside = !showAside">{{ showAside ? '隐藏侧栏' : '显示侧栏' }}</MButton></div>
    </template>
    <template v-if="showAside" #aside><div class="pane">目录分类</div></template>
    <div class="pane">正文 · 核对资料并整理附件</div>
    <template #footer><div class="pane">底部 · 草稿保留在此页</div></template>
  </MLayout>
</template>

<style scoped>
.pane { padding: 12px; border: 1px solid var(--ui-color-rule); background: var(--ui-color-surface-muted); }
.header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
</style>
