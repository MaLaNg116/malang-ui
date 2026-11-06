<script setup lang="ts">
import { ref } from 'vue';
import { MFloatButton, MIcon } from 'malang-ui';

const unread = ref(3);
</script>

<template>
  <div class="float-demo">
    <p role="status">{{ unread ? '有 ' + unread + ' 条批注待查看' : '当前批注均已查看' }}</p>
    <MFloatButton label="查看批注" description="读取本页批注" :badge="unread || undefined" style="position: absolute; inset-inline-end: 16px; bottom: 16px; z-index: 1" @click="unread = 0">
      <MIcon name="file" />
    </MFloatButton>
  </div>
</template>

<style scoped>
.float-demo { position: relative; min-height: 132px; padding: 12px 72px 12px 14px; background: var(--ui-color-surface-muted); }
</style>
