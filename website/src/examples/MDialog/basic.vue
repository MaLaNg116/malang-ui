<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MDialog, MSpace } from 'malang-ui';

const open = ref(false);
const saved = ref(false);
</script>

<template>
  <div>
    <MButton @click="open = true">核对资料</MButton>
    <p role="status">{{ saved ? '当前资料已确认。' : '当前资料等待核对。' }}</p>
    <MDialog v-model="open" title="确认这份资料？" description="确认只会更新此示例中的状态。">
      <p>档案 INK-028 · 青玉卷宗</p>
      <template #footer="{ close }">
        <MSpace>
          <MButton variant="secondary" @click="close">返回</MButton>
          <MButton @click="saved = true; close()">确认资料</MButton>
        </MSpace>
      </template>
    </MDialog>
  </div>
</template>
