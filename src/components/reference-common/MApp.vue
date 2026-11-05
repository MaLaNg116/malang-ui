<script setup lang="ts">
import { onBeforeUnmount, provide, ref, shallowReactive } from 'vue';
import MToast from '../MToast.vue';
import MToastViewport from '../MToastViewport.vue';
import MMessageBox from './MMessageBox.vue';
import { mAppKey, type MAppContext, type MFeedbackHandle, type MFeedbackOptions, type MMessageBoxOptions, type MMessageBoxResult } from '../../composables/useApp';
import { useMConfig } from '../../composables/useConfig';
const { t } = useMConfig();
type Entry = MFeedbackOptions & { id: string; generation: symbol; channel: 'message' | 'notification' };
const entries = ref<Entry[]>([]);
const boxes = shallowReactive<{ id: string; options: MMessageBoxOptions; resolve: (result: MMessageBoxResult) => void }[]>([]);
let counter = 0, alive = true;
function remove(id: string, generation: symbol) { entries.value = entries.value.filter(entry => entry.id !== id || entry.generation !== generation); }
function add(channel: Entry['channel'], options: string | MFeedbackOptions): MFeedbackHandle {
  const item = typeof options === 'string' ? { content: options } : options;
  const id = `${channel}:${item.key === undefined ? `auto:${++counter}` : `key:${item.key}`}`;
  const existing = entries.value.find(entry => entry.id === id);
  const generation = existing?.generation ?? Symbol(id);
  if (alive) { if (existing) Object.assign(existing, item); else entries.value.push({ ...item, channel, id, generation }); }
  return { close: () => remove(id, generation), update: changes => { const target = entries.value.find(entry => entry.id === id && entry.generation === generation); if (target && alive) Object.assign(target, changes); } };
}
function messageBox(options: MMessageBoxOptions) {
  return new Promise<MMessageBoxResult>(resolve => { if (!alive) resolve({ action: 'close', value: options.inputValue ?? '' }); else boxes.push({ id: `box:${++counter}`, options, resolve }); });
}
function resolveBox(id: string, result: MMessageBoxResult) { const index = boxes.findIndex(box => box.id === id); if (index >= 0) boxes.splice(index, 1)[0]!.resolve(result); }
function destroyAll() { entries.value = []; for (const box of boxes.splice(0)) box.resolve({ action: 'close', value: box.options.inputValue ?? '' }); }
const app: MAppContext = { message: options => add('message', options), notification: options => add('notification', options), messageBox, alert: (message, title = t('notice', '提示')) => messageBox({ message, title, kind: 'alert' }), confirm: (message, title = t('confirm', '确认')) => messageBox({ message, title, kind: 'confirm' }), prompt: (message, title = t('input', '请输入')) => messageBox({ message, title, kind: 'prompt' }), destroyAll };
provide(mAppKey, app); defineExpose(app);
onBeforeUnmount(() => { alive = false; destroyAll(); });
</script>
<template>
  <div class="ui-app"><slot :app="app" />
    <MToastViewport v-if="entries.some(entry => entry.channel === 'message')" placement="top-center" :label="t('messages', '全局提示')" style="--ui-toast-top-offset:8px;padding:0"><MToast v-for="entry in entries.filter(item => item.channel === 'message')" :key="entry.generation" :model-value="true" :title="entry.content" :variant="entry.type ?? 'info'" :duration="entry.duration ?? 3000" :closable="entry.closable ?? false" :close-label="t('close', '关闭')" presentation="message" @update:model-value="remove(entry.id, entry.generation)" /></MToastViewport>
    <MToastViewport v-if="entries.some(entry => entry.channel === 'notification')" placement="top-end" :label="t('notifications', '通知')"><MToast v-for="entry in entries.filter(item => item.channel === 'notification')" :key="entry.generation" :model-value="true" :title="entry.title ?? entry.content" :description="entry.title ? entry.content : undefined" :variant="entry.type ?? 'info'" :duration="entry.duration ?? 5000" :closable="entry.closable ?? true" :close-label="t('close', '关闭')" @update:model-value="remove(entry.id, entry.generation)" /></MToastViewport>
    <MMessageBox v-if="boxes[0]" :key="boxes[0].id" v-bind="boxes[0].options" :model-value="true" @result="resolveBox(boxes[0]!.id, $event)" />
  </div>
</template>
<style scoped>.ui-app { min-width: 0; color: var(--ui-color-text); font-family: var(--ui-font-family); }</style>
