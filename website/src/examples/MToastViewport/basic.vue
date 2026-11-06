<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MSpace, MToast, MToastViewport } from 'malang-ui';
import type { MToastPlacement } from 'malang-ui';

const show = ref(false);
const placement = ref<MToastPlacement>('top-start');
function changePlacement() {
  placement.value = placement.value === 'top-start' ? 'bottom-end' : 'top-start';
}
</script>

<template>
  <div class="viewport-demo">
    <MSpace>
      <MButton @click="show = true">显示通知</MButton>
      <MButton variant="secondary" @click="changePlacement">切换落点</MButton>
    </MSpace>
    <div class="notice-area">
      <MToastViewport :placement="placement" label="示例通知" style="position: absolute; max-height: calc(100% - 24px)">
        <MToast v-model="show" title="已完成资料核对" variant="success" :duration="0" closable />
      </MToastViewport>
    </div>
  </div>
</template>

<style scoped>
.viewport-demo { display: grid; gap: 12px; }
.notice-area { position: relative; min-height: 138px; background: var(--ui-color-surface-muted); }
</style>
