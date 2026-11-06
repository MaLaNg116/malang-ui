<script setup lang="ts">
import { ref } from 'vue';
import { MTextarea } from 'malang-ui';

const note = ref('保留几处留白，让墨线有呼吸。');
</script>

<template>
  <div class="example">
    <MTextarea v-model="note" label="修订备注" :rows="3" :maxlength="120" />
    <p>已填写 {{ note.length }} / 120 字</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
