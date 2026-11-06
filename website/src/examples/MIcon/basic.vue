<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MIcon, MSpace } from 'malang-ui';

const large = ref(false);
</script>

<template>
  <MSpace :size="18">
    <span class="icon"><MIcon name="search" :size="large ? 30 : 18" /> 查找</span>
    <span class="icon"><MIcon name="folder" :size="large ? 30 : 18" /> 目录</span>
    <span class="icon"><MIcon name="check" :size="large ? 30 : 18" /> 完成</span>
    <MButton variant="secondary" size="sm" @click="large = !large">切换尺寸</MButton>
  </MSpace>
</template>

<style scoped>
.icon { display: inline-flex; align-items: center; gap: 6px; }
</style>
