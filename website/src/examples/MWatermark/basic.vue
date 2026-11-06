<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MWatermark } from 'malang-ui';

const draft = ref(true);
</script>

<template>
  <MWatermark :content="draft ? ['纸墨卷宗', '审阅副本'] : ['纸墨卷宗', '归档副本']" :gap="[72, 50]" :opacity="0.16">
    <article>
      <strong>卷宗 INK-028</strong>
      <p>材料、来源与登记信息。</p>
      <MButton variant="secondary" size="sm" @click="draft = !draft">切换副本类型</MButton>
    </article>
  </MWatermark>
</template>

<style scoped>
article { min-height: 144px; padding: 18px; border: 1px solid var(--ui-color-rule); }
</style>
