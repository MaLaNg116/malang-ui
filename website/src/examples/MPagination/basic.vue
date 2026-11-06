<script setup lang="ts">
import { computed, ref } from 'vue';
import { MPagination } from 'malang-ui';

const page = ref(1);
const pageSize = 4;
const records = Array.from({ length: 17 }, (_, index) => '目录记录 ' + (index + 1));
const visible = computed(() => records.slice((page.value - 1) * pageSize, page.value * pageSize));
</script>

<template>
  <div>
    <ul><li v-for="record in visible" :key="record">{{ record }}</li></ul>
    <MPagination v-model="page" :total="records.length" :page-size="pageSize" label="记录分页" />
  </div>
</template>
