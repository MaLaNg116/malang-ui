<script setup lang="ts">
import { ref } from 'vue';
import { MApp, MButton, MMessage } from 'malang-ui';

const open = ref(false);
</script>

<template>
  <MApp>
    <div class="message-demo">
      <MButton @click="open = true">提交本页草稿</MButton>
      <div class="message-area">
        <MMessage v-model="open" content="本页草稿已登记" type="success" :duration="0" closable label="本页操作反馈" />
      </div>
    </div>
  </MApp>
</template>

<style scoped>
.message-demo { display: grid; gap: 12px; justify-items: start; }
.message-area { position: relative; width: 100%; min-height: 84px; background: var(--ui-color-surface-muted); }
.message-area :deep(.ui-toast-viewport) { position: absolute; max-height: calc(100% - 12px); }
</style>
