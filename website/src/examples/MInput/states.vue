<script setup lang="ts">
import { ref } from 'vue';
import { MInput } from 'malang-ui';

const name = ref('已存在的名称');
</script>

<template>
  <div class="input-states">
  <MInput v-model="name" label="存在冲突" error="这个名称已被使用，请更换。" />
  <MInput model-value="仅供展示的内容" label="禁用输入" disabled />
  </div>
</template>

<style scoped>
.input-states { display: grid; gap: 24px; width: min(100%, 420px); }
</style>
