<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MMessageBox } from 'malang-ui';

const open = ref(false);
const name = ref('');
function validate(value: string) {
  return value.trim().length > 0 || '请输入卷宗名称。';
}
</script>

<template>
  <div>
    <MButton @click="open = true">填写卷宗名称</MButton>
    <p>记录名称：{{ name || '待填写' }}</p>
    <MMessageBox v-model="open" title="录入卷宗名称" kind="prompt" input-label="卷宗名称" :input-value="name" :validate="validate" @result="$event.action === 'confirm' && (name = $event.value.trim())" />
  </div>
</template>
