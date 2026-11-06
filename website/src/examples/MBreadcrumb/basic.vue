<script setup lang="ts">
import { MBreadcrumb } from 'malang-ui';

const items = [
  { label: '首页', href: '#/' },
  { label: '组件目录', href: '#/components' },
  { label: '面包屑' },
];
</script>

<template>
  <MBreadcrumb :items="items" label="当前页面路径" />
</template>
