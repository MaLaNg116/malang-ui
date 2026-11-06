<script setup lang="ts">
import { computed, ref } from 'vue';
import { MListy } from 'malang-ui';

const items = Array.from({ length: 80 }, (_, index) => '校对稿 ' + String(index + 1).padStart(2, '0'));
const selected = ref<string | number | null>(null);
const current = computed(() => typeof selected.value === 'number' ? items[selected.value] : undefined);
</script>

<template>
  <div class="example">
    <MListy v-model="selected" :items="items" :height="200" label="校对稿清单" />
    <p>当前校对稿：{{ current || '尚未选择' }}。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
