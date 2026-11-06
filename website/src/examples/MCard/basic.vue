<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MCard } from 'malang-ui';

const reviewed = ref(false);
</script>

<template>
  <div class="example">
    <MCard title="青竹纹样" description="纸本素材 · 第 03 卷">
      <p>校对纹样名称与材质后，标记这份档案。</p>
      <template #footer>
        <MButton variant="secondary" @click="reviewed = !reviewed">
          {{ reviewed ? '恢复待校对' : '标记已校对' }}
        </MButton>
        <span role="status">{{ reviewed ? '已校对' : '待校对' }}</span>
      </template>
    </MCard>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.example [role="status"] { margin-inline-start: 12px; }
</style>
