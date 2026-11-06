<script setup lang="ts">
import { ref } from 'vue';
import { MColorPickerPanel } from 'malang-ui';

const color = ref('#28634e');
const presets = ['#28634e', '#9f342b', '#2b607a'];
</script>

<template>
  <div class="example">
    <MColorPickerPanel v-model="color" label="背景色样" :presets="presets" alpha />
    <p>当前色值：<code>{{ color || '未设置' }}</code></p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
