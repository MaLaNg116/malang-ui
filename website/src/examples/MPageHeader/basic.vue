<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MPageHeader } from 'malang-ui';

const detail = ref(true);
const marked = ref(false);
</script>

<template>
  <MPageHeader :title="detail ? '青玉卷宗' : '卷宗列表'" :subtitle="detail ? '资料与修订记录' : '选择一项继续'" :back="detail" @back="detail = false">
    <template #extra>
      <MButton v-if="detail" size="sm" variant="secondary" @click="marked = !marked">{{ marked ? '取消标记' : '标记' }}</MButton>
      <MButton v-else size="sm" @click="detail = true">查看青玉卷宗</MButton>
    </template>
  </MPageHeader>
</template>
