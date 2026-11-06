<script setup lang="ts">
import { ref } from 'vue';
import { MCheckbox } from 'malang-ui';

const keepSource = ref(false);
</script>

<template>
  <div class="example">
    <MCheckbox v-model="keepSource" label="一并保留原稿" />
    <p>{{ keepSource ? '归档时保留原稿和成品。' : '归档时仅保留成品。' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
