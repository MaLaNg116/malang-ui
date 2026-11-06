<script setup lang="ts">
import { ref } from 'vue';
import { MInputTag } from 'malang-ui';

const tags = ref<string[]>(['水墨', '原创']);
</script>

<template>
  <div class="example">
    <MInputTag v-model="tags" label="作品标签" :max="5" />
    <p>已有 {{ tags.length }} / 5 个标签</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
