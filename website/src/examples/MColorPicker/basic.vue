<script setup lang="ts">
import { ref } from 'vue';
import { MColorPicker } from 'malang-ui';

const color = ref('#9f342b');
const presets = ['#9f342b', '#28634e', '#8c652e'];
</script>

<template>
  <div class="example">
    <MColorPicker v-model="color" label="印章颜色" :presets="presets" />
    <p class="swatch"><span :style="{ backgroundColor: color }" aria-hidden="true" /> 当前色值：<code>{{ color || '未设置' }}</code></p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.swatch { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.swatch span { width: 22px; height: 22px; border: 1px solid var(--ui-color-rule); }
</style>
