<script setup lang="ts">
import { ref } from 'vue';
import { MCarousel, type MCarouselItem } from 'malang-ui';

const index = ref(0);
const items: MCarouselItem[] = [
  { key: 'paper', label: '宣纸拓本' },
  { key: 'silk', label: '绢素纹样' },
  { key: 'wood', label: '木构图册' },
];
const notes: Record<string, string> = {
  paper: '纸纹清晰，适合保留山水笔触。',
  silk: '细经密纬，适合观察重复纹样。',
  wood: '以线稿记录榫卯与檐口构造。',
};
</script>

<template>
  <div class="example">
    <MCarousel v-model="index" :items="items" label="材质档案" loop>
      <template #default="{ item }">
        <div class="slide">
          <strong>{{ item.label }}</strong>
          <p>{{ notes[item.key] }}</p>
        </div>
      </template>
    </MCarousel>
    <p>第 {{ index + 1 }} 张，共 {{ items.length }} 张。</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.slide { display: grid; align-content: center; gap: 8px; min-height: 100px; padding: 16px; background: var(--ui-color-surface-muted); }
.slide strong { color: var(--ui-color-secondary-accent); }
</style>
