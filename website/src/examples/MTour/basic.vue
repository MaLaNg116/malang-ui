<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MTour } from 'malang-ui';
import type { MTourStep } from 'malang-ui';

const tools = ref<HTMLElement>(), summary = ref<HTMLElement>();
const open = ref(false), step = ref(0), finished = ref(false);
const steps: MTourStep[] = [
  { key: 'summary', title: '核对卷宗摘要', description: '先确认名称与编号。', target: () => summary.value ?? null },
  { key: 'tools', title: '找到后续操作', description: '从工具区开始下一项工作。', target: () => tools.value ?? null },
];
function start() {
  step.value = 0;
  finished.value = false;
  open.value = true;
}
</script>

<template>
  <div class="tour-demo">
    <div ref="summary" class="tour-target"><strong>卷宗 INK-028</strong><p>已完成基础资料登记。</p></div>
    <div ref="tools"><MButton @click="start">开始导览</MButton></div>
    <p v-if="finished" role="status">导览已完成。</p>
    <MTour v-model="open" v-model:step="step" :steps="steps" @finish="finished = true" />
  </div>
</template>

<style scoped>
.tour-demo { display: grid; gap: 12px; justify-items: start; }
.tour-target { padding: 12px; border: 1px solid var(--ui-color-rule); }
.tour-target p { margin: 6px 0 0; }
</style>
