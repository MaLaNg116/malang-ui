<script setup lang="ts">
import { ref } from 'vue';
import { MBorderBeam, MButton } from 'malang-ui';

const count = ref(2);
</script>

<template>
  <MBorderBeam :count="count" :duration="7" :width="2">
    <strong>当前展示 · 青玉卷宗</strong>
    <p>沿边界移动的光迹用于标记展示区域。</p>
    <MButton variant="secondary" size="sm" @click="count = count === 2 ? 1 : 2">切换光迹数量</MButton>
  </MBorderBeam>
</template>
