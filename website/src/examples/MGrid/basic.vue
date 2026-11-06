<script setup lang="ts">
import { computed, ref } from 'vue';
import { MButton, MGrid, MGridItem } from 'malang-ui';

const compact = ref(false);
const columns = computed(() => compact.value ? { xs: 2, sm: 3 } : { xs: 1, sm: 2 });
const items = ['纸样', '墨色', '装订', '落款'];
</script>

<template>
  <div class="grid-demo">
    <div><MButton variant="secondary" @click="compact = !compact">{{ compact ? '恢复疏朗排列' : '使用紧凑排列' }}</MButton></div>
    <MGrid :columns="columns" :gap="10">
      <MGridItem v-for="item in items" :key="item"><div class="tile">{{ item }}</div></MGridItem>
    </MGrid>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 12px; }
.tile { padding: 14px; background: var(--ui-color-surface-muted); border-inline-start: 2px solid var(--ui-color-secondary-accent); overflow-wrap: anywhere; }
</style>
