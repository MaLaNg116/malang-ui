<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MEmpty } from 'malang-ui';

const filtered = ref(true);
</script>

<template>
  <MEmpty v-if="filtered" title="没有匹配的卷宗" description="尝试清除当前筛选。">
    <MButton @click="filtered = false">清除筛选</MButton>
  </MEmpty>
  <div v-else>
    <ul><li>青玉卷宗</li><li>纸墨手记</li></ul>
    <MButton variant="secondary" @click="filtered = true">应用筛选</MButton>
  </div>
</template>
