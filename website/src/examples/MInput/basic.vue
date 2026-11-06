<script setup lang="ts">
import { ref } from 'vue';
import { MInput } from 'malang-ui';

const name = ref('山海之间');
</script>

<template>
  <div class="input-basic">
  <MInput
    v-model="name"
    label="项目名称"
    hint="支持中文输入，最多 32 个字符。"
    placeholder="为新项目起个名字"
    :maxlength="32"
  />
  <p>当前值：{{ name || '尚未填写' }}</p>
  </div>
</template>

<style scoped>
.input-basic { width: min(100%, 420px); }
p { margin: 20px 0 0; font-size: 14px; color: var(--ui-color-text-secondary); }
</style>
