<script setup lang="ts">
import { ref } from 'vue';
import { MMenu } from 'malang-ui';
import type { MMenuItem } from 'malang-ui';

const selected = ref<string | null>('overview');
const expanded = ref(['workspace']);
const items: MMenuItem[] = [
  { value: 'overview', label: '工作概览' },
  { value: 'workspace', label: '创作空间', children: [
    { value: 'projects', label: '我的项目' },
    { value: 'assets', label: '素材收藏' },
  ] },
  { value: 'settings', label: '偏好设置' },
];
</script>

<template>
  <div class="menu-basic">
    <MMenu
      v-model="selected"
      v-model:expanded-values="expanded"
      :items="items"
      label="项目导航"
    />
    <p aria-live="polite">当前选中：<code>{{ selected }}</code></p>
  </div>
</template>

<style scoped>
.menu-basic { width: min(100%, 360px); }
.menu-basic p { margin: 20px 0 0; color: var(--ui-color-text-secondary); font-size: 14px; }
.menu-basic code { color: var(--ui-color-accent); }
</style>
