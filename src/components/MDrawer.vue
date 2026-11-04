<script setup lang="ts">
import { useAttrs } from 'vue';
import MDialog from './MDialog.vue';
import type { MDrawerProps } from './types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MDrawerProps>(), {
  side: 'right', size: 'md', closeOnEscape: true, closeOnBackdrop: false, closeLabel: '关闭抽屉',
});
const emit = defineEmits<{ 'update:modelValue': [open: boolean] }>();
const attrs = useAttrs();
defineSlots<{ default?: () => unknown; footer?: (props: { close: () => void }) => unknown }>();
</script>

<template>
  <MDialog
    v-bind="attrs"
    :model-value="props.modelValue"
    :title="title"
    :description="description"
    :close-on-escape="closeOnEscape"
    :close-on-backdrop="closeOnBackdrop"
    :close-label="closeLabel"
    class="ui-drawer"
    :data-side="side"
    :data-size="size"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
    <template v-if="$slots.footer" #footer="{ close }"><slot name="footer" :close="close" /></template>
  </MDialog>
</template>

<style scoped>
.ui-drawer.ui-dialog {
  --ui-drawer-width: 560px;
  --ui-drawer-enter-x: 32px;
  --ui-drawer-enter-y: 0px;
  position: fixed;
  inset: 0 0 0 auto;
  width: min(var(--ui-drawer-width), calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  height: 100vh;
  height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
  margin: 0;
  border-block: 0;
  border-inline-end: 0;
  box-shadow: -20px 0 70px color-mix(in srgb, var(--ui-color-ink) 14%, transparent);
}
.ui-drawer.ui-dialog[data-size='sm'] { --ui-drawer-width: 400px; }
.ui-drawer.ui-dialog[data-size='lg'] { --ui-drawer-width: 760px; }
.ui-drawer.ui-dialog[data-side='left'] { --ui-drawer-enter-x: -32px; inset: 0 auto 0 0; border-inline-start: 0; border-inline-end: var(--ui-border-width) solid var(--ui-color-border); box-shadow: 20px 0 70px color-mix(in srgb, var(--ui-color-ink) 14%, transparent); }
.ui-drawer.ui-dialog[data-side='bottom'] { --ui-drawer-enter-x: 0px; --ui-drawer-enter-y: 32px; inset: auto 12px 12px; width: min(960px, calc(100vw - 24px)); max-width: calc(100vw - 24px); height: auto; max-height: min(var(--ui-drawer-width), calc(100dvh - 24px)); margin-inline: auto; border: var(--ui-border-width) solid var(--ui-color-border); box-shadow: 0 -20px 70px color-mix(in srgb, var(--ui-color-ink) 14%, transparent); }
.ui-drawer.ui-dialog[open] { animation: ui-drawer-enter var(--ui-motion-duration-layout) var(--ui-motion-ease-emphasized); }
/* The rail is painted separately so a mechanical edge never clips text or controls. */
.ui-drawer::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 5px; pointer-events: none; z-index: 1; border-inline-start: 2px solid var(--ui-color-secondary-accent); background: repeating-linear-gradient(180deg, transparent 0 25px, color-mix(in srgb, var(--ui-color-metal) 65%, transparent) 25px 26px, transparent 26px 31px); }
.ui-drawer[data-side='left']::before { inset: 0 0 0 auto; border-inline-start: 0; border-inline-end: 2px solid var(--ui-color-secondary-accent); }
.ui-drawer[data-side='bottom']::before { inset: 0 0 auto; width: auto; height: 5px; border-inline-start: 0; border-top: 2px solid var(--ui-color-secondary-accent); background: repeating-linear-gradient(90deg, transparent 0 25px, color-mix(in srgb, var(--ui-color-metal) 65%, transparent) 25px 26px, transparent 26px 31px); }
.ui-drawer :deep(.ui-dialog__header) { padding: 30px 28px 24px; background: linear-gradient(var(--ui-color-accent), var(--ui-color-accent)) 28px 0 / 72px 3px no-repeat, linear-gradient(var(--ui-color-metal), var(--ui-color-metal)) right 28px top 10px / 28px 1px no-repeat; }
.ui-drawer :deep(.ui-dialog__title) { font-size: clamp(26px, 4vw, 32px); line-height: 1.35; }
.ui-drawer :deep(.ui-dialog__body) { flex: 1 1 auto; padding: 28px; }
.ui-drawer :deep(.ui-dialog__footer) { padding: 20px 28px; background: linear-gradient(var(--ui-color-accent), var(--ui-color-accent)) right bottom / 44px 2px no-repeat, var(--ui-color-surface-raised); }
@keyframes ui-drawer-enter { from { opacity: 0; transform: translate(var(--ui-drawer-enter-x), var(--ui-drawer-enter-y)); } to { opacity: 1; transform: translate(0, 0); } }
:global([data-ui-motion='reduced'] .ui-drawer.ui-dialog[open]) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-drawer.ui-dialog[open] { animation: none; } }
@media (forced-colors: active) { .ui-drawer.ui-dialog { border: 1px solid CanvasText; box-shadow: none; } .ui-drawer::before { display: none; } }
@media (max-width: 480px) { .ui-drawer :deep(.ui-dialog__header) { padding: 24px 20px 20px; background-position: 20px 0, right 20px top 9px; } .ui-drawer :deep(.ui-dialog__body) { padding: 20px; } .ui-drawer :deep(.ui-dialog__footer) { padding: 16px 20px; } }
@media (max-height: 480px) { .ui-drawer :deep(.ui-dialog__header) { padding-block: 16px; } .ui-drawer :deep(.ui-dialog__description) { line-height: 1.5; } .ui-drawer :deep(.ui-dialog__footer) { padding-block: 12px; } }
</style>
