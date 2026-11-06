<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MLoading } from 'malang-ui';

const waiting = ref(false);
const selected = ref(false);
</script>

<template>
  <div class="loading-demo">
    <div><MButton :disabled="waiting" @click="waiting = true">开始本地等待</MButton></div>
    <MLoading :model-value="waiting" text="正在整理资料" cancelable cancel-label="结束等待" @cancel="waiting = false">
      <div class="area">
        <strong>已登记的卷宗</strong>
        <p>选中一份继续编辑。</p>
        <MButton variant="secondary" @click="selected = !selected">{{ selected ? '取消选中' : '选中卷宗' }}</MButton>
      </div>
    </MLoading>
  </div>
</template>

<style scoped>
.loading-demo { display: grid; gap: 12px; }
.area { min-height: 140px; padding: 16px; border: 1px solid var(--ui-color-rule); }
</style>
