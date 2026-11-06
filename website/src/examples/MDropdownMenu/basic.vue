<script setup lang="ts">
import { ref } from 'vue';
import { MDropdownMenu } from 'malang-ui';
import type { MDropdownMenuItem } from 'malang-ui';

const open = ref(false);
const selected = ref('');
const items: MDropdownMenuItem[] = [
  { value: '查看资料', label: '查看资料' },
  { value: '另存草稿', label: '另存草稿' },
  { value: '发布记录', label: '发布记录', disabled: true },
];
</script>

<template>
  <div>
    <MDropdownMenu v-model="open" :items="items" label="卷宗操作" @select="selected = $event">
      <template #trigger>卷宗操作</template>
    </MDropdownMenu>
    <p role="status">{{ selected ? '已选操作：' + selected : '打开菜单选择操作。' }}</p>
  </div>
</template>
