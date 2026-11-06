<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { MButton } from 'malang-ui';

const loading = ref(false);
const message = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;

function save() {
  if (loading.value) return;
  loading.value = true;
  message.value = '';
  // 模拟请求；接入业务时，在请求的 finally 中复位 loading。
  timer = setTimeout(() => {
    loading.value = false;
    message.value = '模拟保存完成';
  }, 800);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div>
    <div class="button-loading">
      <MButton :loading="loading" @click="save">{{ loading ? '正在保存…' : '模拟保存' }}</MButton>
      <MButton disabled>暂不可用</MButton>
    </div>
    <p role="status">{{ message }}</p>
  </div>
</template>

<style scoped>
.button-loading { display: flex; flex-wrap: wrap; gap: 12px; }
p { margin: 20px 0 0; min-height: 20px; font-size: 14px; color: var(--ui-color-text-secondary); }
</style>
