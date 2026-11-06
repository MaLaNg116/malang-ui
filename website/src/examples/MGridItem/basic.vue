<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MGrid, MGridItem } from 'malang-ui';

const shifted = ref(false);
</script>

<template>
  <div class="grid-item-demo">
    <div><MButton variant="secondary" @click="shifted = !shifted">切换摘要偏移</MButton></div>
    <MGrid :columns="3" :gap="8">
      <MGridItem :span="2" :offset="shifted ? 1 : 0"><div class="tile">卷宗摘要</div></MGridItem>
      <MGridItem><div class="tile">类别</div></MGridItem>
      <MGridItem><div class="tile">编号</div></MGridItem>
    </MGrid>
  </div>
</template>

<style scoped>
.grid-item-demo { display: grid; gap: 12px; }
.tile { padding: 10px; background: var(--ui-color-surface-muted); border: 1px solid var(--ui-color-rule); overflow-wrap: anywhere; }
</style>
