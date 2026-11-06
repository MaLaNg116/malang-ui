<script setup lang="ts">
import { ref } from 'vue';
import { MAccordion } from 'malang-ui';

const open = ref(['material']);
const items = [
  { value: 'material', label: '材质信息' },
  { value: 'revision', label: '修订说明' },
  { value: 'private', label: '封存附件', disabled: true },
];
</script>

<template>
  <MAccordion v-model="open" :items="items" label="卷宗补充资料" heading-tag="h4">
    <template #material><p>宣纸底，朱砂刻印，青玉夹轨。</p></template>
    <template #revision><p>第二版补充了材料编号及归档时间。</p></template>
  </MAccordion>
</template>
