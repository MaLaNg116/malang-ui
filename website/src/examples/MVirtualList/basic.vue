<script setup lang="ts">
import { computed, ref } from 'vue';
import { MVirtualList } from 'malang-ui';

const items = Array.from({ length: 1200 }, (_, index) => ({
  id: index + 1,
  title: '档案页 ' + String(index + 1).padStart(4, '0'),
}));
const selected = ref<string | number | null>(null);
const current = computed(() => items.find(item => item.id === selected.value)?.title);
</script>

<template>
  <div class="example">
    <MVirtualList
      v-model="selected"
      :items="items"
      :height="220"
      item-key="id"
      label="档案页"
      selectable
    >
      <template #item="{ item }">{{ item.title }}</template>
    </MVirtualList>
    <p>共 {{ items.length }} 页。当前页：{{ current || '尚未选择' }}。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
</style>
