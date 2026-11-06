<script setup lang="ts">
import { computed, ref } from 'vue';
import { MSelect } from 'malang-ui';

const material = ref('paper');
const options = [
  { value: 'paper', label: '宣纸' },
  { value: 'celadon', label: '青瓷' },
  { value: 'gilt', label: '绢素' },
];
const selected = computed(() => options.find(option => option.value === material.value)?.label);
</script>

<template>
  <div class="example">
    <MSelect v-model="material" label="纸面材质" :options="options" name="material" />
    <p>已选材质：{{ selected }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
