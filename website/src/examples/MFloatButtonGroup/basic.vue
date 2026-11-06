<script setup lang="ts">
import { ref } from 'vue';
import { MFloatButton, MFloatButtonGroup, MIcon } from 'malang-ui';

const open = ref(false);
const selected = ref('');
function choose(label: string) {
  selected.value = label;
  open.value = false;
}
</script>

<template>
  <div class="group-demo">
    <p role="status">{{ selected || '展开右下角的卷宗操作。' }}</p>
    <MFloatButtonGroup v-model="open" label="卷宗操作" style="position: absolute; inset-inline-end: 16px; bottom: 14px; z-index: 1">
      <MFloatButton label="查看资料" @click="choose('已选择查看资料')"><MIcon name="file" /></MFloatButton>
      <MFloatButton label="标记重点" @click="choose('已选择标记重点')"><MIcon name="star" /></MFloatButton>
    </MFloatButtonGroup>
  </div>
</template>

<style scoped>
.group-demo { position: relative; min-height: 226px; padding: 12px 86px 12px 14px; background: var(--ui-color-surface-muted); }
</style>
