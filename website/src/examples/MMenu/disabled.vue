<script setup lang="ts">
import { ref } from 'vue';
import { MMenu, MSwitch } from 'malang-ui';
import type { MMenuItem } from 'malang-ui';

const selected = ref<string | null>('public');
const expanded = ref(['library']);
const disabled = ref(false);
const items: MMenuItem[] = [
  { value: 'library', label: '素材管理', children: [
    { value: 'public', label: '公开素材' },
    { value: 'private', label: '私密素材（无权限）', disabled: true },
    { value: 'favorites', label: '我的收藏' },
  ] },
];
</script>

<template>
  <div class="menu-disabled">
    <MSwitch v-model="disabled" label="禁用整组菜单" />
    <MMenu v-model="selected" v-model:expanded-values="expanded" :items="items" :disabled="disabled" label="素材导航" />
    <p aria-live="polite">当前选中：{{ selected }}</p>
  </div>
</template>

<style scoped>
.menu-disabled { display: grid; gap: 20px; width: min(100%, 380px); }
.menu-disabled p { margin: 0; font-size: 14px; color: var(--ui-color-text-secondary); }
</style>
