<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, watch } from 'vue';
import type { MUploadProps, MUploadRejection } from './types';
import { countLimit, fileBytes, sameFiles, selectUploadFiles, sizeLimit, uploadModelError } from './uploadFiles';
import './nativeField.css';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MUploadProps>(), { multiple: false, disabled: false, readonly: false });
const emit = defineEmits<{ 'update:modelValue': [files: File[]]; reject: [items: MUploadRejection[]] }>();
const attrs = useAttrs();
const generatedId = `ui-upload-${useId()}`;
const id = computed(() => props.id || generatedId);
const picker = ref<HTMLInputElement>(); const fileList = ref<HTMLElement>();
const dragging = ref(false), rejected = ref<MUploadRejection[]>([]), announcement = ref(''), synchronizationError = ref('');
const modelError = computed(() => uploadModelError(props.modelValue, props));
const totalBytes = computed(() => props.modelValue.reduce((total, file) => total + file.size, 0));
const capacity = computed(() => countLimit(props));
const size = computed(() => sizeLimit(props));
const requirements = computed(() => [props.readonly && '只读，仅查看本地文件', props.accept && `类型：${props.accept}`, Number.isFinite(size.value) && `单个不超过 ${fileBytes(size.value)}`, Number.isFinite(capacity.value) && `最多 ${capacity.value} 个`].filter(Boolean).join(' · ') || '任意文件类型 · 仅管理本地文件');
const invalid = computed(() => Boolean(props.error || modelError.value || synchronizationError.value));
const rejectionMessage: Record<MUploadRejection['reason'], string> = { type: '文件类型不符合要求', size: '超过单个文件大小限制', count: '超过可选文件数量', duplicate: '同名、大小、类型和修改时间的文件已在列表中' };
const identities = new WeakMap<File, number>(); let nextIdentity = 0;
let mounted = false, dragDepth = 0, revision = 0, notice = 0;
let form: HTMLFormElement | null | undefined;
let pending: readonly File[] | undefined;
let resetTimer: ReturnType<typeof setTimeout> | undefined;
let resetGeneration = 0;

function locked() { return props.disabled || props.readonly || picker.value?.matches(':disabled') === true; }
function announce(message: string) {
  const token = ++notice;
  announcement.value = '';
  void nextTick(() => { if (mounted && token === notice) announcement.value = message; });
}
function required() { return attrs.required != null && attrs.required !== false && !props.readonly; }
function describedBy() { return [...new Set([attrs['aria-describedby'], `${id.value}-requirements`, props.hint && `${id.value}-hint`, invalid.value && `${id.value}-error`, rejected.value.length && `${id.value}-rejections`].filter(Boolean).join(' ').split(/\s+/))].filter(Boolean).join(' ') || undefined; }
function nativeAttrs() { return Object.fromEntries(Object.entries(attrs).filter(([name]) => !['type', 'value', 'readonly', 'multiple', 'accept', 'webkitdirectory', 'directory'].includes(name))); }
function fileIdentity(file: File, index: number) {
  if (!identities.has(file)) identities.set(file, ++nextIdentity);
  const occurrence = props.modelValue.slice(0, index).filter(previous => previous === file).length;
  return `${identities.get(file)}-${occurrence}`;
}
function badge(file: File) { return file.name.includes('.') ? file.name.split('.').at(-1)!.slice(0, 7).toUpperCase() || 'FILE' : 'FILE'; }
function syncValidity() {
  if (!picker.value) return;
  picker.value.setCustomValidity(locked() ? '' : synchronizationError.value || modelError.value);
}
function syncFiles() {
  const element = picker.value;
  if (!mounted || !element) return;
  if (!sameFiles(Array.from(element.files ?? []), props.modelValue)) {
    try {
      if (!props.modelValue.length) element.value = '';
      else {
        const Transfer = element.ownerDocument.defaultView?.DataTransfer;
        if (!Transfer) throw new Error('DataTransfer unavailable');
        const transfer = new Transfer();
        for (const file of props.modelValue) transfer.items.add(file);
        element.files = transfer.files;
      }
      synchronizationError.value = '';
    } catch { synchronizationError.value = '当前浏览器无法同步本地文件列表，请使用支持 FileList 的浏览器。'; }
  } else synchronizationError.value = '';
  syncValidity();
}
function resetDrag() { dragDepth = 0; dragging.value = false; }
function guardPicker(event: Event) { if (locked()) event.preventDefault(); }
function guardKey(event: KeyboardEvent) { if (locked() && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }
function request(next: File[], message: string, removed?: { file: File; index: number; button: HTMLButtonElement; focused: boolean }) {
  if (locked() || sameFiles(next, props.modelValue) || (pending && sameFiles(next, pending))) { syncFiles(); return; }
  const token = ++revision;
  pending = next;
  emit('update:modelValue', next);
  void nextTick(() => {
    if (!mounted || token !== revision) return;
    pending = undefined; syncFiles();
    const accepted = sameFiles(props.modelValue, next);
    announce(accepted ? message : '文件列表已恢复，父组件未确认这次更新。');
    if (!accepted || !removed?.focused || removed.button.isConnected) return;
    const document = removed.button.ownerDocument, active = document.activeElement;
    if (active !== removed.button && active !== document.body && active !== document.documentElement) return;
    const buttons = fileList.value?.querySelectorAll<HTMLButtonElement>('.ui-upload__remove');
    const target = buttons?.[Math.min(removed.index, buttons.length - 1)] ?? (!locked() ? picker.value : undefined);
    target?.focus({ preventScroll: true });
  });
}
function ingest(files: readonly File[], folder = false) {
  if (locked()) { syncFiles(); return; }
  const result = selectUploadFiles(props.modelValue, files, props);
  rejected.value = result.rejected;
  if (result.rejected.length) emit('reject', result.rejected);
  const summary = `${result.accepted.length ? `已选入 ${result.accepted.length} 个本地文件。` : ''}${result.rejected.length ? `${result.rejected.length} 个文件未加入。` : ''}${folder ? '不支持文件夹，请选择具体文件。' : ''}`;
  if (sameFiles(result.next, props.modelValue)) { syncFiles(); announce(summary); }
  else request(result.next, summary);
}
function choose() { ingest(Array.from(picker.value?.files ?? [])); }
function canceled() { if (mounted) { syncFiles(); announce('已取消选择，本地文件列表保持不变。'); } }
function remove(file: File, index: number, event: MouseEvent) {
  if (locked()) return;
  rejected.value = [];
  const button = event.currentTarget as HTMLButtonElement;
  request(props.modelValue.filter((_, position) => position !== index), `已移除本地文件：${file.name}。`, { file, index, button, focused: button === button.ownerDocument.activeElement });
}
function hasFiles(event: DragEvent) { return Boolean(event.dataTransfer && (Array.from(event.dataTransfer.types).includes('Files') || Array.from(event.dataTransfer.items).some(item => item.kind === 'file'))); }
function dragEnter(event: DragEvent) { if (!hasFiles(event)) return; event.preventDefault(); if (!locked()) { dragDepth++; dragging.value = true; } }
function dragOver(event: DragEvent) { if (!hasFiles(event)) return; event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = locked() ? 'none' : 'copy'; }
function dragLeave(event: DragEvent) { if (!hasFiles(event)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) dragging.value = false; }
function drop(event: DragEvent) {
  if (!hasFiles(event)) return;
  event.preventDefault(); resetDrag();
  if (locked()) { syncFiles(); return; }
  const items = Array.from(event.dataTransfer?.items ?? []).filter(item => item.kind === 'file');
  let folder = false;
  const files = items.length ? items.flatMap(item => {
    if (item.webkitGetAsEntry?.()?.isDirectory) { folder = true; return []; }
    const file = item.getAsFile(); return file ? [file] : [];
  }) : Array.from(event.dataTransfer?.files ?? []);
  ingest(files, folder);
}
function cancelReset() { resetGeneration++; if (resetTimer !== undefined) clearTimeout(resetTimer); resetTimer = undefined; }
function resetForm() {
  cancelReset(); revision++; notice++; pending = undefined; rejected.value = []; announcement.value = ''; resetDrag();
  const generation = resetGeneration;
  // Native file reset finishes after reset-event microtasks. The next task must
  // read the latest owner, so an intervening edit never restores an old list.
  resetTimer = setTimeout(() => {
    resetTimer = undefined;
    if (mounted && generation === resetGeneration) syncFiles();
  }, 0);
}
function attachForm() { const next = picker.value?.form; if (form === next) return; form?.removeEventListener('reset', resetForm); form = next; form?.addEventListener('reset', resetForm); }
onMounted(() => { mounted = true; attachForm(); syncFiles(); });
onUpdated(() => { attachForm(); syncFiles(); });
watch(() => [props.disabled, props.readonly], () => { resetDrag(); }, { flush: 'post' });
onBeforeUnmount(() => { mounted = false; revision++; notice++; pending = undefined; cancelReset(); resetDrag(); form?.removeEventListener('reset', resetForm); });
</script>

<template>
  <div class="ui-native-field ui-upload" :class="{ 'ui-upload--invalid': invalid, 'ui-upload--disabled': disabled, 'ui-upload--readonly': readonly }">
    <label class="ui-native-field__label ui-upload__label" :for="id">{{ label }}</label>
    <div class="ui-upload__receiver" :data-dragging="dragging || undefined" @dragenter="dragEnter" @dragover="dragOver" @dragleave="dragLeave" @drop="drop">
      <!-- The real input is the sole picker and Tab stop; opacity preserves native validation focus. -->
      <input v-bind="nativeAttrs()" :id="id" ref="picker" class="ui-upload__input" type="file" :accept="accept" :multiple="multiple" :disabled="disabled" :required="required()" :tabindex="readonly ? -1 : attrs.tabindex as string | number | undefined" :aria-disabled="readonly || undefined" :aria-describedby="describedBy()" :aria-invalid="invalid ? true : attrs['aria-invalid'] as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined" @click="guardPicker" @keydown="guardKey" @change="choose" @cancel="canceled">
      <div class="ui-upload__receiver-copy" aria-hidden="true">
        <span class="ui-upload__slot"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 4h12l4 4v12H4V4Z" stroke="currentColor"/><path d="M16 4v5h4M8 14h8M8 17h5" stroke="currentColor"/><path d="M9 4V2h3" stroke="currentColor" stroke-width="2"/></svg></span>
        <span class="ui-upload__receiver-text"><strong>{{ readonly ? '本地文件只读' : disabled ? '文件选择已停用' : dragging ? '松开，纳入本地清单' : '选择本地文件' }}</strong><span>{{ readonly || disabled ? '当前清单仍可查看' : '或将文件拖入收件槽' }}</span></span>
        <span class="ui-upload__mark">{{ String(modelValue.length).padStart(2, '0') }}</span>
      </div>
      <span class="ui-upload__rail" aria-hidden="true"></span>
    </div>
    <p :id="`${id}-requirements`" class="ui-upload__requirements">{{ requirements }}</p>
    <p v-if="hint" :id="`${id}-hint`" class="ui-native-field__hint">{{ hint }}</p>
    <ul v-if="modelValue.length" ref="fileList" class="ui-upload__files" :aria-label="label + '本地文件清单'">
      <li v-for="(file, index) in modelValue" :key="fileIdentity(file, index)" class="ui-upload__file">
        <span class="ui-upload__ordinal" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
        <div class="ui-upload__file-copy"><span class="ui-upload__filename">{{ file.name }}</span><span class="ui-upload__file-meta"><span class="ui-upload__type">{{ badge(file) }}</span><span>{{ fileBytes(file.size) }}</span><span>本地待处理</span></span></div>
        <button class="ui-upload__remove" type="button" :disabled="locked()" :aria-label="'移除本地文件：' + file.name" @click="remove(file, index, $event)"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      </li>
    </ul>
    <div class="ui-upload__ledger" aria-hidden="true"><span>{{ modelValue.length }} 个本地文件</span><span class="ui-upload__ticks"></span><span>{{ fileBytes(totalBytes) }}</span></div>
    <ul v-if="rejected.length" :id="`${id}-rejections`" class="ui-upload__rejections" aria-label="文件检查结果"><li v-for="(item, index) in rejected" :key="index"><span>{{ item.file.name }}</span>：{{ rejectionMessage[item.reason] }}。</li></ul>
    <p v-if="invalid" :id="`${id}-error`" class="ui-native-field__error" role="alert">{{ error || synchronizationError || modelError }}</p>
    <p class="ui-upload__sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
  </div>
</template>

<style scoped>
.ui-upload { --ui-upload-accent: var(--ui-color-accent); }
.ui-upload__label { max-width: 100%; overflow-wrap: anywhere; }
.ui-upload__receiver { box-sizing: border-box; position: relative; isolation: isolate; min-width: 0; color: var(--ui-color-text); }
.ui-upload__receiver::before, .ui-upload__receiver::after { content: ''; position: absolute; pointer-events: none; z-index: -1; clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px)); }
.ui-upload__receiver::before { inset: 0; background: var(--ui-color-metal); transition: background-color var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
.ui-upload__receiver::after { inset: 1px; background: var(--ui-color-surface); }
.ui-upload__input { box-sizing: border-box; position: absolute; inset: 0; width: 100%; height: 100%; min-width: 0; margin: 0; padding: 0; opacity: 0; cursor: pointer; }
.ui-upload__receiver-copy { box-sizing: border-box; min-width: 0; display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; align-items: center; gap: 14px; min-height: 104px; padding: 20px; pointer-events: none; }
.ui-upload__slot { display: grid; place-items: center; color: var(--ui-color-metal); }
.ui-upload__receiver-text { min-width: 0; display: grid; gap: 6px; overflow-wrap: anywhere; }
.ui-upload__receiver-text strong { font: var(--ui-font-weight-emphasis) 16px/1.6 var(--ui-font-family-display); }
.ui-upload__receiver-text > span { color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); }
.ui-upload__mark { align-self: start; color: var(--ui-color-metal); font: 10px/1.5 var(--ui-font-family-mono); }
.ui-upload__rail { position: absolute; pointer-events: none; inset: auto 10px 0; height: 2px; background: linear-gradient(90deg, var(--ui-upload-accent) 0 20%, transparent 20% 80%, var(--ui-upload-accent) 80% 100%); transform: scaleX(.45); opacity: .6; transition: transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized), opacity var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
.ui-upload__receiver:hover:has(.ui-upload__input:not(:disabled):not([aria-disabled='true'])) .ui-upload__slot { color: var(--ui-color-accent); }
.ui-upload__receiver:focus-within { outline: 2px solid var(--ui-color-focus); outline-offset: 3px; }
.ui-upload__receiver:focus-within::before, .ui-upload__receiver[data-dragging]::before { background: var(--ui-upload-accent); }
.ui-upload__receiver:focus-within .ui-upload__rail, .ui-upload__receiver[data-dragging] .ui-upload__rail { transform: scaleX(1); opacity: 1; }
.ui-upload__receiver[data-dragging]::after { background: var(--ui-color-accent-soft); }
.ui-upload__requirements { min-width: 0; margin: 0; color: var(--ui-color-text-secondary); font: 10px/1.7 var(--ui-font-family-mono); overflow-wrap: anywhere; }
.ui-upload__files { min-width: 0; display: grid; gap: 0; margin: 8px 0 0; padding: 0; list-style: none; }
.ui-upload__file { min-width: 0; display: grid; grid-template-columns: 20px minmax(0, 1fr) 44px; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--ui-color-rule); }
.ui-upload__ordinal { align-self: start; padding-top: 3px; color: var(--ui-color-metal); font: 10px/1.6 var(--ui-font-family-mono); }
.ui-upload__file-copy { min-width: 0; display: grid; gap: 8px; }
.ui-upload__filename { overflow-wrap: anywhere; font-size: var(--ui-font-size-caption); }
.ui-upload__file-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; color: var(--ui-color-text-secondary); font: 10px/1.6 var(--ui-font-family-mono); }
.ui-upload__type { padding: 0 4px; border: 1px solid var(--ui-color-rule); color: var(--ui-color-metal); }
.ui-upload__remove { box-sizing: border-box; display: grid; place-items: center; width: 44px; height: 44px; margin: 0; padding: 0; border: 1px solid transparent; border-radius: 0; background: transparent; color: var(--ui-color-text-secondary); cursor: pointer; transition: color var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard), background-color var(--ui-motion-duration-feedback) var(--ui-motion-ease-standard); }
.ui-upload__remove:hover:not(:disabled) { background: var(--ui-color-accent-soft); color: var(--ui-color-accent); }
.ui-upload__remove:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -3px; }
.ui-upload__remove:disabled { opacity: .4; cursor: not-allowed; }
.ui-upload__ledger { min-width: 0; display: flex; align-items: center; gap: 12px; padding-block: 8px; color: var(--ui-color-text-secondary); font: 10px/1.6 var(--ui-font-family-mono); }
.ui-upload__ledger > span:not(.ui-upload__ticks) { flex: none; }
.ui-upload__ticks { flex: 1; min-width: 12px; height: 4px; opacity: .55; background: repeating-linear-gradient(90deg, var(--ui-color-metal) 0 1px, transparent 1px 7px); }
.ui-upload__rejections { min-width: 0; display: grid; gap: 8px; margin: 0; padding: 12px 14px; border-left: 2px solid var(--ui-color-danger); background: var(--ui-color-surface); color: var(--ui-color-danger); list-style: none; font-size: var(--ui-font-size-caption); overflow-wrap: anywhere; }
.ui-upload__rejections span { color: var(--ui-color-text); }
.ui-upload--invalid { --ui-upload-accent: var(--ui-color-danger); }
.ui-upload--invalid .ui-upload__receiver::before { background: var(--ui-color-danger); }
.ui-upload--disabled .ui-upload__receiver { opacity: .55; } .ui-upload--disabled .ui-upload__input { cursor: not-allowed; }
.ui-upload--readonly .ui-upload__input { cursor: default; }
.ui-upload__sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
:global([data-ui-motion='reduced'] .ui-upload__receiver::before), :global([data-ui-motion='reduced'] .ui-upload__rail), :global([data-ui-motion='reduced'] .ui-upload__remove) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-upload__receiver::before, .ui-upload__rail, .ui-upload__remove { transition: none; } }
@media (max-width: 480px) { .ui-upload__receiver-copy { padding: 16px; gap: 10px; } .ui-upload__file { gap: 8px; } }
@media (forced-colors: active) { .ui-upload__receiver { border: 1px solid CanvasText; } .ui-upload__receiver::before, .ui-upload__receiver::after, .ui-upload__rail, .ui-upload__ticks { display: none; } .ui-upload__receiver:focus-within { outline-color: Highlight; } .ui-upload__remove { color: ButtonText; border-color: ButtonText; } .ui-upload__remove:focus-visible { outline-color: Highlight; } .ui-upload__file, .ui-upload__type, .ui-upload__rejections { border-color: CanvasText; } }
</style>
