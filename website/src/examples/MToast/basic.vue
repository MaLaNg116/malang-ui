<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MToast } from 'malang-ui';

const show = ref(false);
</script>

<template>
  <div class="toast-demo">
    <div><MButton @click="show = true">显示归档通知</MButton></div>
    <MToast v-model="show" title="草稿已归档" description="可在当前卷宗列表继续核对。" variant="success" :duration="0" closable />
  </div>
</template>

<style scoped>
.toast-demo { display: grid; gap: 12px; min-width: 0; }
</style>
