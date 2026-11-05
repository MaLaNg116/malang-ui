<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, useId, watch } from 'vue';
import type { StyleValue } from 'vue';
import type { MImageProps } from './types';
import MDialog from './MDialog.vue';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MImageProps>(), { fit: 'cover', loading: 'lazy', preview: true });
const emit = defineEmits<{ load: [event: Event]; error: [event: Event]; 'preview-change': [index: number, src: string] }>();
const attrs = useAttrs();
type ImageState = 'loading' | 'loaded' | 'error';
const image = ref<HTMLImageElement>(), original = ref<HTMLImageElement>(), stage = ref<HTMLElement>();
const zoomIn = ref<HTMLButtonElement>(), zoomOut = ref<HTMLButtonElement>();
const state = ref<ImageState>(props.src.trim() ? 'loading' : 'error'), revision = ref(0);
const open = ref(false), index = ref(0), scale = ref(1), previewRevision = ref(0), originalState = ref<ImageState>('loading');
const dialogId = `ui-image-${useId()}-preview`;
const sources = computed(() => {
  const list = props.previewSources?.filter(source => source.trim());
  return list?.length ? list : [props.src];
});
const currentSource = computed(() => sources.value[index.value] ?? '');
const previewAlt = computed(() => currentSource.value === props.src ? props.alt : `图片组第 ${index.value + 1} 张`);
const previewLabel = computed(() => `预览图片：${props.alt || '图片'}`);

function nativeAttrs() { return { decoding: 'async' as const, ...Object.fromEntries(Object.entries(attrs).filter(([name]) => name !== 'class' && name !== 'style')) }; }
function originalAttrs() { return Object.fromEntries(Object.entries(attrs).filter(([name]) => ['crossorigin', 'crossOrigin', 'referrerpolicy', 'referrerPolicy'].includes(name))); }
function frameStyle() {
  const width = Number(attrs.width), height = Number(attrs.height);
  return { width: Number.isFinite(width) && width > 0 ? `min(100%, ${width}px)` : undefined,
    aspectRatio: Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0 ? `${width} / ${height}` : undefined };
}
function rootStyles(): StyleValue { return [frameStyle(), attrs.style as StyleValue]; }
function currentImage(event: Event, expected: HTMLImageElement | undefined, source: string, request: number) {
  return event.currentTarget === expected && !!expected?.isConnected
    && expected.getAttribute('src') === source && expected.dataset.uiImageRequest === String(request);
}
function loaded(event: Event) { if (currentImage(event, image.value, props.src, revision.value)) { state.value = 'loaded'; emit('load', event); } }
function failed(event: Event) { if (currentImage(event, image.value, props.src, revision.value)) { state.value = 'error'; emit('error', event); } }
function retry() { revision.value++; state.value = props.src.trim() ? 'loading' : 'error'; }
function cachedImage() { if (image.value?.complete) state.value = image.value.naturalWidth > 0 ? 'loaded' : 'error'; }
watch(() => props.src, () => { open.value = false; retry(); }, { flush: 'sync' });
watch(() => props.preview, value => { if (!value) open.value = false; });
onMounted(cachedImage);

function retainOperationFocus(target: () => HTMLElement | undefined) {
  const modal = stage.value?.closest('dialog'), document = modal?.ownerDocument, active = document?.activeElement;
  if (!open.value || !modal || !document || !active || !modal.contains(active)) return;
  void nextTick(() => {
    if (!open.value || !modal.isConnected || active.isConnected && !active.matches(':disabled')) return;
    const current = document.activeElement;
    if (current !== active && current !== document.body && current !== document.documentElement && current !== modal) return;
    const next = target();
    (next && !next.matches(':disabled') ? next : stage.value)?.focus({ preventScroll: true });
  });
}
function resetOriginal() {
  previewRevision.value++; scale.value = 1; originalState.value = currentSource.value.trim() ? 'loading' : 'error';
  retainOperationFocus(() => stage.value);
  void nextTick(() => { if (stage.value) { stage.value.scrollLeft = 0; stage.value.scrollTop = 0; } });
}
function originalLoaded(event: Event) { if (currentImage(event, original.value, currentSource.value, previewRevision.value)) originalState.value = 'loaded'; }
function originalFailed(event: Event) { if (currentImage(event, original.value, currentSource.value, previewRevision.value)) originalState.value = 'error'; }
function showPreview() {
  if (!props.preview || state.value !== 'loaded') return;
  const initial = props.initialIndex;
  index.value = initial !== undefined && Number.isFinite(initial)
    ? Math.min(sources.value.length - 1, Math.max(0, Math.floor(initial)))
    : Math.max(0, sources.value.indexOf(props.src));
  resetOriginal(); open.value = true; emit('preview-change', index.value, currentSource.value);
}
function move(delta: number) {
  if (!open.value) return;
  const target = Math.max(0, Math.min(sources.value.length - 1, index.value + delta));
  if (target === index.value) return;
  index.value = target; resetOriginal(); emit('preview-change', index.value, currentSource.value);
}
watch(sources, (value, previous) => {
  if (!open.value) return;
  const priorSource = previous[index.value];
  const retained = value.indexOf(priorSource ?? '');
  index.value = retained >= 0 ? retained : Math.min(index.value, value.length - 1);
  if (currentSource.value !== priorSource) { resetOriginal(); emit('preview-change', index.value, currentSource.value); }
});
function keyboard(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
}
function zoom(target: number) {
  if (originalState.value !== 'loaded') return;
  const pane = stage.value;
  const x = pane ? (pane.scrollLeft + pane.clientWidth / 2) / pane.scrollWidth : .5;
  const y = pane ? (pane.scrollTop + pane.clientHeight / 2) / pane.scrollHeight : .5;
  scale.value = Math.max(1, Math.min(3, target));
  retainOperationFocus(() => scale.value >= 3 ? zoomOut.value : zoomIn.value);
  void nextTick(() => {
    if (!pane?.isConnected) return;
    pane.scrollLeft = x * pane.scrollWidth - pane.clientWidth / 2;
    pane.scrollTop = y * pane.scrollHeight - pane.clientHeight / 2;
  });
}
</script>

<template>
  <div class="ui-image" :class="attrs.class" :style="rootStyles()" :data-state="state" :aria-busy="state === 'loading' || undefined">
    <img v-if="state !== 'error'" :key="revision" v-bind="nativeAttrs()" ref="image" class="ui-image__source" :class="{ 'ui-image__source--ready': state === 'loaded' }" :src="src" :alt="alt" :loading="loading" :style="{ objectFit: fit }" :data-ui-image-request="revision" @load="loaded" @error="failed" />
    <div v-if="state === 'loading'" class="ui-image__placeholder" aria-hidden="true"><svg width="44" height="34" viewBox="0 0 44 34" fill="none"><path d="M1 12V1h13m16 0h13v11m0 10v11H30M14 33H1V22M8 25l10-11 8 8 6-5 5 8" /></svg><span>影像载入中</span></div>
    <div v-if="state === 'error'" class="ui-image__failure">
      <div class="ui-image__fallback" :role="alt ? 'img' : undefined" :aria-label="alt || undefined" :aria-hidden="alt ? undefined : true"><svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M3 11V3h8m8 0h8v8m0 8v8h-8m-8 0H3v-8m8-8 8 8m0-8-8 8" /></svg></div>
      <p class="ui-image__error-text">图片暂未载入</p><p v-if="alt" class="ui-image__error-name">{{ alt }}</p>
      <button type="button" class="ui-image__retry" @click="retry">重新载入图片</button>
    </div>
    <button v-if="preview" type="button" class="ui-image__preview" :disabled="state !== 'loaded'" :aria-label="previewLabel" aria-haspopup="dialog" :aria-expanded="open" :aria-controls="dialogId" @click="showPreview"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 7V2h5m4 0h5v5m0 4v5h-5M7 16H2v-5m5-4h4v4H7z" /></svg><span>查看原图</span></button>
    <MDialog :id="dialogId" v-model="open" class="ui-image__dialog" title="图片预览" description="左右方向键切换图片；缩放后可在图片区滚动。" close-label="关闭图片预览" @keydown="keyboard">
      <div ref="stage" class="ui-image__stage" tabindex="0" role="region" aria-label="大图浏览区域" :aria-busy="originalState === 'loading' || undefined">
        <div class="ui-image__zoom" :style="{ width: `${scale * 100}%`, height: `${scale * 100}%` }">
          <img v-if="open && originalState !== 'error'" :key="previewRevision" v-bind="originalAttrs()" ref="original" class="ui-image__original" :src="currentSource" :alt="previewAlt" decoding="async" :data-ui-image-request="previewRevision" :style="{ opacity: originalState === 'loaded' ? 1 : 0 }" @load="originalLoaded" @error="originalFailed" />
        </div>
        <p v-if="originalState === 'loading'" class="ui-image__stage-message">原图载入中</p>
        <div v-if="originalState === 'error'" class="ui-image__stage-message"><p>原图暂未载入</p><button type="button" class="ui-image__retry" @click="resetOriginal">重新载入原图</button></div>
      </div>
      <p class="ui-image__caption">{{ previewAlt || '装饰图片' }}</p>
      <template #footer>
        <div class="ui-image__toolbar" role="group" aria-label="图片预览操作">
          <div class="ui-image__navigation"><button type="button" class="ui-image__tool" aria-label="上一张图片" :disabled="index === 0" @click="move(-1)"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m10 3-5 5 5 5" /></svg></button><span class="ui-image__counter" role="status" aria-live="polite" aria-atomic="true">{{ index + 1 }} / {{ sources.length }}</span><button type="button" class="ui-image__tool" aria-label="下一张图片" :disabled="index >= sources.length - 1" @click="move(1)"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg></button></div>
          <div class="ui-image__scaling"><button ref="zoomOut" type="button" class="ui-image__tool" aria-label="缩小图片" :disabled="originalState !== 'loaded' || scale <= 1" @click="zoom(scale - .25)">−</button><button type="button" class="ui-image__reset" :disabled="originalState !== 'loaded' || scale === 1" @click="zoom(1)">还原 <span>{{ Math.round(scale * 100) }}%</span></button><button ref="zoomIn" type="button" class="ui-image__tool" aria-label="放大图片" :disabled="originalState !== 'loaded' || scale >= 3" @click="zoom(scale + .25)">+</button></div>
        </div>
      </template>
    </MDialog>
  </div>
</template>

<style scoped>
.ui-image { box-sizing: border-box; isolation: isolate; position: relative; display: block; width: 100%; max-width: 100%; min-width: 0; aspect-ratio: 16 / 10; background: var(--ui-color-surface-muted); border: 1px solid var(--ui-color-rule); color: var(--ui-color-text); font: var(--ui-font-size-body)/1.6 var(--ui-font-family); }
.ui-image::before, .ui-image::after { content: ''; position: absolute; z-index: 1; width: 10px; height: 10px; pointer-events: none; border-color: var(--ui-color-metal); border-style: solid; }
.ui-image::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }.ui-image::after { right: -1px; bottom: -1px; border-width: 0 2px 2px 0; }
.ui-image__source { display: block; width: 100%; height: 100%; opacity: 0; }.ui-image__source--ready { opacity: 1; }
.ui-image__placeholder, .ui-image__failure { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 16px; text-align: center; }
.ui-image__placeholder { color: var(--ui-color-text-secondary); font: 11px/1.6 var(--ui-font-family-mono); letter-spacing: .08em; }
.ui-image__placeholder svg, .ui-image__fallback svg { stroke: var(--ui-color-metal); stroke-width: 1; }
.ui-image__failure { padding-bottom: 64px; }.ui-image__error-text, .ui-image__error-name { margin: 0; overflow-wrap: anywhere; }.ui-image__error-text { font-size: var(--ui-font-size-caption); color: var(--ui-color-text-secondary); }.ui-image__error-name { max-width: 100%; max-height: 32%; overflow: auto; font-size: var(--ui-font-size-caption); }
.ui-image__retry, .ui-image__preview, .ui-image__tool, .ui-image__reset { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; min-width: 44px; padding: 8px 12px; border: 1px solid var(--ui-color-border); border-radius: 0; background: var(--ui-color-surface); color: var(--ui-color-text); font: inherit; cursor: pointer; }
.ui-image__retry { font-size: var(--ui-font-size-caption); }.ui-image__preview { position: absolute; z-index: 2; right: 10px; bottom: 10px; font-size: var(--ui-font-size-caption); box-shadow: var(--ui-shadow-panel); }
.ui-image__preview svg, .ui-image__tool svg { flex: none; stroke: currentColor; stroke-width: 1.3; }
.ui-image__preview:disabled { opacity: .5; }.ui-image__retry:hover, .ui-image__preview:not(:disabled):hover, .ui-image__tool:not(:disabled):hover, .ui-image__reset:not(:disabled):hover { color: var(--ui-color-text); background: var(--ui-color-surface-muted); border-color: var(--ui-color-metal); }
.ui-image__tool:disabled, .ui-image__reset:disabled { opacity: .42; cursor: not-allowed; }.ui-image__preview:disabled { cursor: not-allowed; }
.ui-image__retry:focus-visible, .ui-image__preview:focus-visible, .ui-image__tool:focus-visible, .ui-image__reset:focus-visible, .ui-image__stage:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: var(--ui-focus-offset); }
.ui-image__dialog { width: min(1120px, calc(100% - 32px)); max-width: calc(100% - 32px); }
.ui-image__dialog :deep(.ui-dialog__body) { display: flex; flex-direction: column; gap: 12px; padding: 16px; }.ui-image__dialog :deep(.ui-dialog__footer) { padding: 12px 16px; }.ui-image__dialog :deep(.ui-dialog__close) { width: 44px; height: 44px; }
.ui-image__stage { position: relative; width: 100%; height: clamp(120px, 48dvh, 560px); min-height: 0; flex: none; overflow: auto; overscroll-behavior: contain; background: var(--ui-color-canvas); border: 1px solid var(--ui-color-rule); }
.ui-image__zoom { min-width: 100%; min-height: 100%; display: grid; place-items: center; }.ui-image__original { display: block; width: 100%; height: 100%; min-height: 0; object-fit: contain; }
.ui-image__stage-message { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; margin: 0; padding: 16px; color: var(--ui-color-text-secondary); text-align: center; }
.ui-image__stage-message p { margin: 0; }.ui-image__caption { flex: none; margin: 0; overflow-wrap: anywhere; color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-caption); }
.ui-image__toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 16px; width: 100%; }.ui-image__navigation, .ui-image__scaling { display: flex; align-items: center; gap: 8px; max-width: 100%; }.ui-image__counter { min-width: 48px; text-align: center; font: 12px/1.5 var(--ui-font-family-mono); }.ui-image__tool { padding: 8px; font-size: 20px; }.ui-image__reset { flex-wrap: wrap; gap: 4px 8px; font-size: var(--ui-font-size-caption); }.ui-image__reset span { font-family: var(--ui-font-family-mono); font-variant-numeric: tabular-nums; }
@media (forced-colors: active) { .ui-image, .ui-image__stage { border-color: CanvasText; background: Canvas; }.ui-image::before, .ui-image::after { border-color: CanvasText; }.ui-image__placeholder svg, .ui-image__fallback svg { stroke: CanvasText; }.ui-image__retry, .ui-image__preview, .ui-image__tool, .ui-image__reset { border-color: ButtonText; background: ButtonFace; color: ButtonText; box-shadow: none; }.ui-image__preview:disabled, .ui-image__tool:disabled, .ui-image__reset:disabled { opacity: 1; color: GrayText; } }
</style>
