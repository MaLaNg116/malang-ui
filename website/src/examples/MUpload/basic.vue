<script setup lang="ts">
import { ref } from 'vue';
import { MUpload } from 'malang-ui';

const files = ref<File[]>([]);
</script>

<template>
  <div class="example">
    <MUpload v-model="files" label="档案附件" accept=".png,.jpg,.jpeg,.pdf" :max-count="3" multiple />
    <p>已选 {{ files.length }} 个附件{{ files.length ? '：' + files.map(file => file.name).join('、') : '。' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
