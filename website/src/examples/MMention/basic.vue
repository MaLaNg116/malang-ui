<script setup lang="ts">
import { ref } from 'vue';
import { MMention } from 'malang-ui';

const note = ref('');
const people = [
  { value: '林墨', label: '林墨' },
  { value: '苏澄', label: '苏澄' },
  { value: '许川', label: '许川' },
];
</script>

<template>
  <div class="example">
    <MMention v-model="note" label="协作备注" :options="people" :rows="3" />
    <p>输入 @林 试试。{{ note ? '当前备注：' + note : '' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
