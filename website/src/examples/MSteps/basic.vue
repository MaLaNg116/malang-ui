<script setup lang="ts">
import { ref } from 'vue';
import { MSteps } from 'malang-ui';

const step = ref('review');
const items = [
  { value: 'draft', label: '登记' },
  { value: 'review', label: '核对' },
  { value: 'archive', label: '归档' },
];
</script>

<template>
  <MSteps v-model="step" :items="items" label="归档流程" interactive />
</template>
