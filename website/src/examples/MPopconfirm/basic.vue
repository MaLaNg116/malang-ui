<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { MButton, MPopconfirm } from 'malang-ui';

const open = ref(false);
const removed = ref(false);
const restoreButton = ref<InstanceType<typeof MButton>>();
async function removeNote() {
  removed.value = true;
  await nextTick();
  (restoreButton.value?.$el as HTMLButtonElement | undefined)?.focus();
}
</script>

<template>
  <div>
    <p role="status">{{ removed ? '临时备注已移除。' : '当前有一条临时备注。' }}</p>
    <MPopconfirm v-if="!removed" v-model="open" title="移除临时备注？" trigger-label="移除备注" description="这只影响当前演示。" danger @confirm="removeNote">
      <template #trigger>移除备注</template>
    </MPopconfirm>
    <MButton v-else ref="restoreButton" variant="secondary" @click="removed = false">恢复示例</MButton>
  </div>
</template>
