<script setup lang="ts">
import { ref } from 'vue';
import { MAvatar, MButton } from 'malang-ui';

const showImage = ref(true);
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#31575a" d="M0 0h64v64H0z"/><circle cx="32" cy="25" r="11" fill="#e9dcc2"/><path fill="#d1bd93" d="M9 64c0-15 9-24 23-24s23 9 23 24z"/></svg>';
const avatar = 'data:image/svg+xml,' + encodeURIComponent(svg);
</script>

<template>
  <div class="example">
    <div class="profile">
      <MAvatar :src="showImage ? avatar : undefined" alt="归档员陆衡" name="陆衡" size="lg" tone="jade" />
      <span>陆衡 · 归档员</span>
    </div>
    <MButton variant="secondary" @click="showImage = !showImage">{{ showImage ? '切换姓名头像' : '恢复图片头像' }}</MButton>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.profile { display: flex; gap: 12px; align-items: center; }
</style>
