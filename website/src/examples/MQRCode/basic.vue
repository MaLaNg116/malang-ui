<script setup lang="ts">
import { ref } from 'vue';
import { MInput, MQRCode } from 'malang-ui';

const content = ref('档案编号 P-031');
</script>

<template>
  <div class="example">
    <MInput v-model="content" label="二维码内容" maxlength="80" />
    <MQRCode v-if="content.trim()" class="archive-code" :value="content" :size="148" label="档案二维码" />
    <p v-else>输入档案编号以生成二维码。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.archive-code { justify-self: start; }
</style>
