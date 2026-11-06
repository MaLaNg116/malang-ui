<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MTag } from 'malang-ui';

const defaults = ['纸本', '纹样', '待校对'];
const tags = ref([...defaults]);
</script>

<template>
  <div class="example">
    <div class="tags">
      <MTag
        v-for="tag in tags"
        :key="tag"
        :close-label="'移除' + tag"
        closable
        @close="tags = tags.filter(value => value !== tag)"
      >{{ tag }}</MTag>
      <p v-if="!tags.length">没有标签。</p>
    </div>
    <MButton variant="secondary" :disabled="tags.length === defaults.length" @click="tags = [...defaults]">恢复标签</MButton>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
</style>
