<script setup lang="ts">
import { ref } from 'vue';
import { MInfiniteScroll } from 'malang-ui';

const count = ref(10);
const total = 30;
function append() {
  count.value = Math.min(total, count.value + 10);
}
</script>

<template>
  <div class="example">
    <MInfiniteScroll :height="220" :finished="count === total" label="档案页清单" @load="append">
      <ol class="volumes">
        <li v-for="page in count" :key="page">山水拓本 · 第 {{ page }} 页</li>
      </ol>
      <template #finished>全卷 {{ total }} 页已载入。</template>
    </MInfiniteScroll>
    <p>已展示 {{ count }} / {{ total }} 页。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.volumes { margin: 0; padding: 0 12px 0 2em; }
.volumes li { padding-block: 8px; border-bottom: 1px solid var(--ui-color-border); }
</style>
