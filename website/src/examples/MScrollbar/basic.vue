<script setup lang="ts">
import { MScrollbar } from 'malang-ui';

const records = ['宣纸与边锋', '青玉与冷墨', '绢素与压纹', '朱砂刻印', '装订位置', '附件编号', '材质备忘', '后续校对'];
</script>

<template>
  <MScrollbar :height="160" label="材质手记列表">
    <ol><li v-for="record in records" :key="record">{{ record }}</li></ol>
  </MScrollbar>
</template>

<style scoped>
ol { margin: 0; padding: 6px 28px; }
li { padding: 8px 0; border-bottom: 1px solid var(--ui-color-rule); }
</style>
