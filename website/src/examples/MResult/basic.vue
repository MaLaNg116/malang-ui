<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MResult } from 'malang-ui';

const ready = ref(false);
</script>

<template>
  <MResult :status="ready ? 'success' : 'warning'" :title="ready ? '资料核对完成' : '仍需核对一项'" :description="ready ? '这份本地卷宗已满足示例条件。' : '确认卷宗名称后即可完成。'" heading-tag="h3">
    <template #footer>
      <MButton variant="secondary" @click="ready = !ready">{{ ready ? '重新核对' : '确认名称' }}</MButton>
    </template>
  </MResult>
</template>
