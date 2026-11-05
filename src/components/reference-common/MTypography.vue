<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { useMConfig } from '../../composables/useConfig';
import type { MTypographyProps } from './textTypes';
import MIcon from './MIcon.vue';
const props = withDefaults(defineProps<MTypographyProps>(), { as: 'p', type: 'default' });
const emit = defineEmits<{ 'update:modelValue': [value: string]; copy: [value: string]; error: [error: unknown] }>();
const { t } = useMConfig();
const host = ref<HTMLElement>(), text = ref<HTMLElement>(), editor = ref<HTMLTextAreaElement>(), editButton = ref<HTMLButtonElement>(), editActions = ref<HTMLElement>();
const editing = ref(false), draft = ref(''), expanded = ref(false), copied = ref(false), copyError = ref(false);
const lines = computed(() => typeof props.ellipsis === 'number' && Number.isFinite(props.ellipsis) ? Math.max(1, Math.floor(props.ellipsis)) : 1);
let timer: ReturnType<typeof setTimeout> | undefined, alive = true, editVersion = 0;
function content() { return props.modelValue ?? text.value?.textContent ?? ''; }
async function copy() {
  const value = content(); copyError.value = false;
  try {
    const clipboard = text.value?.ownerDocument.defaultView?.navigator.clipboard;
    if (!clipboard) throw new Error('Clipboard API unavailable');
    await clipboard.writeText(value); if (!alive) return;
    copied.value = true; emit('copy', value); clearTimeout(timer); timer = setTimeout(() => { copied.value = false; }, 2000);
  } catch (error) { if (alive) { copyError.value = true; emit('error', error); } }
}
async function edit() {
  if (editing.value) return;
  const current = ++editVersion, trigger = editButton.value, document = host.value?.ownerDocument, owned = document?.activeElement === trigger;
  draft.value = content(); editing.value = true; await nextTick();
  const active = document?.activeElement;
  if (alive && current === editVersion && owned && (!active || active === document?.body || active === document?.documentElement || active === trigger)) editor.value?.focus();
}
async function finish(save: boolean) {
  if (!editing.value) return;
  const current = ++editVersion, document = host.value?.ownerDocument, previousEditor = editor.value, actions = editActions.value;
  const active = document?.activeElement, owned = !!active && (active === previousEditor || !!actions?.contains(active));
  if (save) emit('update:modelValue', draft.value); editing.value = false; await nextTick();
  const now = document?.activeElement;
  if (alive && current === editVersion && owned && (!now || now === document?.body || now === document?.documentElement || now === previousEditor || actions?.contains(now))) editButton.value?.focus();
}
function key(event: KeyboardEvent) { if (event.isComposing || event.keyCode === 229) return; if (event.key === 'Escape') { event.preventDefault(); void finish(false); } else if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void finish(true); } }
onBeforeUnmount(() => { alive = false; editVersion++; clearTimeout(timer); });
</script>
<template>
  <component :is="as" ref="host" class="ui-typography" :data-type="type" :class="{ 'ui-typography--strong': strong, 'ui-typography--italic': italic, 'ui-typography--underline': underline, 'ui-typography--deleted': deleted, 'ui-typography--code': code, 'ui-typography--mark': mark }">
    <template v-if="editing"><textarea ref="editor" v-model="draft" class="ui-typography__editor" :aria-label="label ?? t('edit', '编辑文字')" @keydown="key" /><span ref="editActions" class="ui-typography__actions"><button type="button" @click="finish(true)">{{ t('save', '保存') }}</button><button type="button" @click="finish(false)">{{ t('cancel', '取消') }}</button></span></template>
    <template v-else><span ref="text" class="ui-typography__text" :class="{ 'ui-typography__text--ellipsis': ellipsis && !expanded }" :style="{ WebkitLineClamp: lines }"><slot>{{ modelValue }}</slot></span><button v-if="ellipsis && expandable" class="ui-typography__action" type="button" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? t('collapse', '收起') : t('expand', '展开') }}</button><button v-if="copyable" class="ui-typography__action" type="button" :aria-label="copied ? t('copied', '已复制') : t('copy', '复制')" @click="copy"><MIcon :name="copied ? 'check' : 'copy'" /></button><button v-if="editable" ref="editButton" class="ui-typography__action" type="button" :aria-label="t('edit', '编辑')" @click="edit"><MIcon name="edit" /></button></template>
    <span v-if="copyError" role="status" class="ui-typography__error">{{ t('copy.failed', '复制失败，请手动选择文字复制') }}</span>
  </component>
</template>
<style scoped>
.ui-typography { margin: 0; color: var(--ui-color-text); font: inherit; overflow-wrap: anywhere; }.ui-typography[data-type='secondary'] { color: var(--ui-color-text-secondary); }.ui-typography[data-type='success'] { color: var(--ui-color-success); }.ui-typography[data-type='warning'] { color: var(--ui-color-warning); }.ui-typography[data-type='danger'] { color: var(--ui-color-danger); }
h1.ui-typography, h2.ui-typography, h3.ui-typography, h4.ui-typography { font-family: var(--ui-font-family-display); line-height: 1.35; }h1.ui-typography { font-size: 36px; }h2.ui-typography { font-size: 28px; }h3.ui-typography { font-size: 22px; }h4.ui-typography { font-size: 18px; }
.ui-typography--strong { font-weight: 600; }.ui-typography--italic { font-style: italic; }.ui-typography--underline .ui-typography__text { text-decoration: underline; text-underline-offset: 3px; }.ui-typography--deleted .ui-typography__text { text-decoration: line-through; }.ui-typography--code { padding: 2px 5px; font-family: var(--ui-font-family-mono); background: var(--ui-color-surface-muted); }.ui-typography--mark { background: var(--ui-color-metal-soft); }
.ui-typography__text--ellipsis { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }.ui-typography__action, .ui-typography__actions button { border: 0; padding: 4px 6px; background: transparent; color: var(--ui-color-info); font: inherit; cursor: pointer; }.ui-typography__action:hover, .ui-typography__actions button:hover { background: var(--ui-color-secondary-soft); }.ui-typography__action:focus-visible, .ui-typography__actions button:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: 1px; }
.ui-typography__editor { box-sizing: border-box; display: block; width: 100%; min-height: 70px; padding: 8px; border: 1px solid var(--ui-color-border); background: var(--ui-color-surface); color: var(--ui-color-text); font: inherit; }.ui-typography__editor:focus-visible { outline: 2px solid var(--ui-color-focus); }.ui-typography__error { display: block; color: var(--ui-color-danger); font-size: 12px; }
</style>
