<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MMenu, MSwitch } from 'malang-ui';
import type { MMenuItem } from 'malang-ui';

const selected = ref<string | null>('drafts');
const expanded = ref(['work']);
const single = ref(true);
const items: MMenuItem[] = [
  { value: 'work', label: '作品管理', children: [
    { value: 'drafts', label: '进行中的作品' },
    { value: 'published', label: '已归档作品' },
  ] },
  { value: 'team', label: '协作空间', children: [
    { value: 'members', label: '团队成员' },
    { value: 'invites', label: '邀请记录' },
  ] },
];
function updateExpanded(next: string[]) {
  const opened = next.find(value => !expanded.value.includes(value));
  expanded.value = single.value && opened ? [opened] : next;
}
function changeSingle(value: boolean) {
  single.value = value;
  if (value) expanded.value = expanded.value.slice(-1);
}
</script>

<template>
  <div class="menu-control">
    <MSwitch :model-value="single" label="只展开一个分组" @update:model-value="changeSingle" />
    <div class="menu-control__actions">
      <MButton variant="secondary" size="sm" @click="single = false; expanded = ['work', 'team']">全部展开</MButton>
      <MButton variant="ghost" size="sm" @click="expanded = []">全部收起</MButton>
    </div>
    <MMenu v-model="selected" :expanded-values="expanded" :items="items" label="工作空间" @update:expanded-values="updateExpanded" />
    <p aria-live="polite">展开分组：{{ expanded.join('、') || '无' }}</p>
  </div>
</template>

<style scoped>
.menu-control { display: grid; gap: 20px; width: min(100%, 400px); }
.menu-control__actions { display: flex; flex-wrap: wrap; gap: 12px; }
.menu-control p { margin: 0; font-size: 14px; color: var(--ui-color-text-secondary); }
</style>
