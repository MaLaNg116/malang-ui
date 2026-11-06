<script setup lang="ts">
import { computed, ref } from 'vue';
import { MCheckbox, MList, MTag } from 'malang-ui';

const pendingOnly = ref(false);
const records = [
  { id: 1, title: '校对山水拓本', done: true },
  { id: 2, title: '整理青竹纹样', done: false },
  { id: 3, title: '登记飞檐图册', done: false },
];
const visible = computed(() => pendingOnly.value ? records.filter(record => !record.done) : records);
</script>

<template>
  <div class="example">
    <MCheckbox v-model="pendingOnly" label="只看待办" />
    <MList :items="visible" item-key="id" label="归档任务">
      <template #item="{ item }">
        <div class="task">
          <span>{{ item.title }}</span>
          <MTag :tone="item.done ? 'success' : 'neutral'">{{ item.done ? '已完成' : '待处理' }}</MTag>
        </div>
      </template>
    </MList>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.task { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
</style>
