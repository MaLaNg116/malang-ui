<script setup lang="ts">
import { ref } from 'vue';
import { MApp, MButton, MSpace } from 'malang-ui';
import type { MAppContext } from 'malang-ui';

const confirmed = ref(false);
async function verify(app: MAppContext) {
  const result = await app.confirm('此操作只修改本地示例。', '确认卷宗状态');
  if (result.action === 'confirm') confirmed.value = true;
}
</script>

<template>
  <MApp v-slot="{ app }" class="app-demo">
    <MSpace>
      <MButton @click="app.message({ key: 'demo', content: '已收到本页操作', type: 'success', duration: 0, closable: true })">显示应用提示</MButton>
      <MButton variant="secondary" @click="verify(app)">打开确认框</MButton>
    </MSpace>
    <p role="status">{{ confirmed ? '当前卷宗已确认。' : '当前卷宗等待确认。' }}</p>
  </MApp>
</template>

<style scoped>
.app-demo { position: relative; min-height: 160px; }
.app-demo :deep(.ui-toast-viewport) { position: absolute; top: 84px; max-height: calc(100% - 88px); }
</style>
