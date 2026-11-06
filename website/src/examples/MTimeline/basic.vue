<script setup lang="ts">
import { computed, ref } from 'vue';
import { MButton, MTimeline, type MTimelineItem } from 'malang-ui';

const complete = ref(false);
const steps = computed<MTimelineItem[]>(() => [
  { value: 'prepare', title: '收录档案', time: '11 月 12 日', status: 'success' },
  { value: 'review', title: '校对题记', time: '11 月 14 日', status: 'success' },
  { value: 'store', title: '入库', description: complete.value ? '已登记柜位' : '核对卷号后登记柜位', status: complete.value ? 'success' : 'active' },
]);
</script>

<template>
  <div class="example">
    <MTimeline :items="steps" label="卷宗归档记录" />
    <MButton variant="secondary" :disabled="complete" @click="complete = true">确认入库</MButton>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
