<script setup lang="ts">
import { ref } from 'vue';
import { MBadge, MButton } from 'malang-ui';

const unread = ref(3);
</script>

<template>
  <div class="example">
    <div class="inbox">
      <span>归档通知</span>
      <MBadge :tone="unread ? 'info' : 'neutral'">{{ unread ? unread + ' 条未读' : '全部已读' }}</MBadge>
    </div>
    <MButton variant="secondary" :disabled="unread === 0" @click="unread = 0">标记为已读</MButton>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.inbox { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
</style>
