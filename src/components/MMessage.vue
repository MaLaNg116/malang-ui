<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { MMessageProps } from './types';
import MToast from './MToast.vue';
import MToastViewport from './MToastViewport.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<MMessageProps>(), {
  type: 'info',
  duration: 3000,
  closable: false,
  closeLabel: '关闭提示',
  offset: 8,
  label: '全局提示',
});
const emit = defineEmits<{ 'update:modelValue': [open: boolean] }>();
const attrs = useAttrs();
const placementStyle = computed(() => ({
  '--ui-toast-top-offset': `min(${Number.isFinite(props.offset) ? Math.max(0, props.offset) : 8}px, max(0px, calc(100dvh - max(12px, env(safe-area-inset-bottom)) - 64px)))`,
  padding: '0',
}));
</script>

<template>
  <MToastViewport placement="top-center" :label="label" :style="placementStyle">
    <MToast
      v-bind="attrs"
      :model-value="modelValue"
      :title="content"
      :variant="type"
      :duration="duration"
      :closable="closable"
      :close-label="closeLabel"
      presentation="message"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </MToastViewport>
</template>
