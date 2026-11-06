<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MPopover } from 'malang-ui';

const open = ref(false);
const pinned = ref(false);
</script>

<template>
  <div>
    <MPopover v-model="open" label="卷宗标记" trigger-label="标记设置" placement="bottom">
      <template #trigger>标记设置</template>
      <template #default="{ close }">
        <p>重点卷宗会在资料列表中优先显示。</p>
        <MButton size="sm" @click="pinned = !pinned; close()">{{ pinned ? '取消重点' : '标为重点' }}</MButton>
      </template>
    </MPopover>
    <p role="status">{{ pinned ? '当前已标为重点。' : '当前为普通卷宗。' }}</p>
  </div>
</template>
