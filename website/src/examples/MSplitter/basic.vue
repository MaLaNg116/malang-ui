<script setup lang="ts">
import { ref } from 'vue';
import { MSplitter } from 'malang-ui';

const width = ref(44);
</script>

<template>
  <div>
    <p>左侧比例：{{ Math.round(width) }}%</p>
    <MSplitter v-model="width" :min="24" :max="72" label="调节资料区比例" collapsible>
      <template #first><strong>目录</strong><p>卷宗摘要与附件</p></template>
      <template #second><strong>正文</strong><p>可拖动中间轨道，或聚焦后用方向键调整。</p></template>
    </MSplitter>
  </div>
</template>
