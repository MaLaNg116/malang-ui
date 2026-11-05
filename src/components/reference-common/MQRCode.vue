<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import MButton from '../MButton.vue';
import MSpinner from '../MSpinner.vue';
import { useMConfig } from '../../composables/useConfig';
import { encodeQRCode, qrContrast, qrPath, type MQRCodeLevel } from './qr';

const props = withDefaults(defineProps<{
  value: string | readonly string[];
  type?: 'svg' | 'canvas'; size?: number; errorLevel?: MQRCodeLevel;
  color?: string; bgColor?: string; quietZone?: number; bordered?: boolean;
  icon?: string; iconSize?: number; status?: 'active' | 'loading' | 'expired' | 'scanned';
  label?: string; refreshLabel?: string;
}>(), { type: 'svg', size: 200, errorLevel: 'M', color: '#26332e', bgColor: '#fffdf7', quietZone: 4, bordered: true, status: 'active' });
const emit = defineEmits<{ refresh: []; error: [error: Error] }>();
const { t } = useMConfig();
const host = ref<HTMLElement>(), canvas = ref<HTMLCanvasElement>();
const drawError = ref('');
const dimension = computed(() => Number.isFinite(props.size) ? Math.max(80, Math.min(2048, props.size)) : 200);
const quiet = computed(() => Number.isFinite(props.quietZone) ? Math.max(4, Math.min(32, Math.floor(props.quietZone))) : 4);
const hasIcon = computed(() => !!props.icon && (!Number.isFinite(props.iconSize) || props.iconSize! > 0));
const result = computed(() => {
  try {
    if (qrContrast(props.color, props.bgColor) < 4.5) throw new Error('二维码前景与背景对比度不足');
    return { matrix: encodeQRCode(props.value, hasIcon.value ? 'H' : props.errorLevel), error: '' };
  } catch (error) { return { matrix: undefined, error: error instanceof Error ? error.message : String(error) }; }
});
const extent = computed(() => (result.value.matrix?.size ?? 21) + quiet.value * 2);
const path = computed(() => result.value.matrix ? qrPath(result.value.matrix, quiet.value) : '');
const logoSize = computed(() => props.icon && result.value.matrix ? Math.max(0, Math.min(Number.isFinite(props.iconSize) ? props.iconSize! / dimension.value * extent.value : 5, result.value.matrix.size * .16)) : 0);
const logoStart = computed(() => (extent.value - logoSize.value) / 2);
const errorText = computed(() => result.value.error || drawError.value);
let alive = false, version = 0;
const pendingImages = new Set<HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const view = host.value?.ownerDocument.defaultView;
  if (!view) return Promise.reject(new Error('图片导出仅在挂载后可用'));
  return new Promise((resolve, reject) => {
    const image = new view.Image(); pendingImages.add(image); image.crossOrigin = 'anonymous';
    image.onload = () => { pendingImages.delete(image); image.onload = image.onerror = null; resolve(image); };
    image.onerror = () => { pendingImages.delete(image); image.onload = image.onerror = null; reject(new Error('二维码图标无法读取，请检查地址或跨域设置')); };
    image.src = src;
  });
}
async function paint(target: HTMLCanvasElement, scale = 4) {
  const matrix = result.value.matrix;
  if (!matrix) throw new Error(result.value.error);
  const side = extent.value, margin = quiet.value, foreground = props.color, background = props.bgColor;
  const icon = props.icon, logo = logoSize.value, start = logoStart.value;
  const image = icon && logo ? await loadImage(icon) : undefined;
  target.width = target.height = side * scale;
  const context = target.getContext('2d'); if (!context) throw new Error('浏览器不支持画布');
  context.fillStyle = background; context.fillRect(0, 0, target.width, target.height);
  context.fillStyle = foreground;
  for (let y = 0; y < matrix.size; y++) for (let x = 0; x < matrix.size; x++) if (matrix.modules[y]![x]) context.fillRect((x + margin) * scale, (y + margin) * scale, scale, scale);
  if (image && logo) {
    context.fillStyle = background; context.fillRect((start - .5) * scale, (start - .5) * scale, (logo + 1) * scale, (logo + 1) * scale);
    context.drawImage(image, start * scale, start * scale, logo * scale, logo * scale);
  }
}
async function redraw() {
  const current = ++version; drawError.value = '';
  if (result.value.error) { emit('error', new Error(result.value.error)); return; }
  if (!alive || props.type !== 'canvas') return;
  await nextTick(); const target = canvas.value; if (!target) return;
  const buffer = target.ownerDocument.createElement('canvas');
  try {
    await paint(buffer, Math.max(2, Math.ceil(dimension.value * (host.value?.ownerDocument.defaultView?.devicePixelRatio ?? 1) / extent.value)));
    if (!alive || current !== version) return;
    target.width = buffer.width; target.height = buffer.height; target.getContext('2d')?.drawImage(buffer, 0, 0);
  } catch (error) { if (alive && current === version) { drawError.value = error instanceof Error ? error.message : String(error); emit('error', new Error(drawError.value)); } }
}
async function toDataURL(format: 'svg' | 'png' = 'svg'): Promise<string> {
  const doc = host.value?.ownerDocument;
  if (!doc || !result.value.matrix) throw new Error(result.value.error || '二维码尚未挂载');
  if (format === 'png') { const target = doc.createElement('canvas'); await paint(target); return target.toDataURL('image/png'); }
  const node = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); node.setAttribute('viewBox', `0 0 ${extent.value} ${extent.value}`); node.setAttribute('width', String(dimension.value)); node.setAttribute('height', String(dimension.value));
  const rect = doc.createElementNS(node.namespaceURI, 'rect'); rect.setAttribute('width', '100%'); rect.setAttribute('height', '100%'); rect.setAttribute('fill', props.bgColor); node.append(rect);
  const modules = doc.createElementNS(node.namespaceURI, 'path'); modules.setAttribute('d', path.value); modules.setAttribute('fill', props.color); modules.setAttribute('shape-rendering', 'crispEdges'); node.append(modules);
  if (props.icon && logoSize.value) {
    const start = logoStart.value, size = logoSize.value, background = props.bgColor;
    const image = await loadImage(props.icon), buffer = doc.createElement('canvas'); buffer.width = buffer.height = 128;
    buffer.getContext('2d')?.drawImage(image, 0, 0, 128, 128);
    const pad = doc.createElementNS(node.namespaceURI, 'rect'); for (const [key, value] of Object.entries({ x: start - .5, y: start - .5, width: size + 1, height: size + 1, fill: background })) pad.setAttribute(key, String(value)); node.append(pad);
    const logo = doc.createElementNS(node.namespaceURI, 'image'); for (const [key, value] of Object.entries({ x: start, y: start, width: size, height: size, href: buffer.toDataURL('image/png') })) logo.setAttribute(key, String(value)); node.append(logo);
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(node))}`;
}
async function download(filename = 'qrcode', format: 'svg' | 'png' = 'png') {
  const url = await toDataURL(format); if (!alive || !host.value) return;
  const anchor = host.value.ownerDocument.createElement('a'); anchor.href = url; anchor.download = `${filename.replace(/\.(svg|png)$/i, '')}.${format}`; anchor.click();
}
watch(() => [result.value, props.type, props.icon, props.iconSize, dimension.value, quiet.value], () => { void redraw(); });
onMounted(() => { alive = true; void redraw(); });
onBeforeUnmount(() => { alive = false; version++; for (const image of pendingImages) { image.onerror?.(new Event('error')); image.onload = image.onerror = null; image.src = ''; } pendingImages.clear(); });
defineExpose({ toDataURL, download });
</script>

<template>
  <div ref="host" class="ui-qrcode" :class="{ 'ui-qrcode--bordered': bordered }" :style="{ width: dimension + 'px' }" :data-status="errorText ? 'error' : status">
    <div class="ui-qrcode__code" :aria-hidden="status !== 'active' || !!errorText">
      <svg v-if="type === 'svg'" :viewBox="`0 0 ${extent} ${extent}`" role="img" :aria-label="label ?? '二维码'" class="ui-qrcode__image"><rect width="100%" height="100%" :fill="bgColor" /><path :d="path" :fill="color" shape-rendering="crispEdges" /><template v-if="icon && logoSize"><rect :x="logoStart - .5" :y="logoStart - .5" :width="logoSize + 1" :height="logoSize + 1" :fill="bgColor" /><image :href="icon" :x="logoStart" :y="logoStart" :width="logoSize" :height="logoSize" /></template></svg>
      <canvas v-else ref="canvas" class="ui-qrcode__image" role="img" :aria-label="label ?? '二维码'" />
    </div>
    <div v-if="status !== 'active' || errorText" class="ui-qrcode__mask"><MSpinner v-if="status === 'loading' && !errorText" :label="t('loading', '加载中')" /><p v-else role="status">{{ errorText || (status === 'expired' ? t('qr.expired', '二维码已过期') : t('qr.scanned', '已扫描')) }}</p><MButton v-if="status === 'expired'" size="sm" variant="secondary" @click="emit('refresh')">{{ refreshLabel ?? t('refresh', '刷新') }}</MButton></div>
  </div>
</template>

<style scoped>
.ui-qrcode { box-sizing: border-box; position: relative; max-width: 100%; aspect-ratio: 1; color: var(--ui-color-text); font: 14px/1.5 var(--ui-font-family); }
.ui-qrcode--bordered { padding: 6px; border: 1px solid var(--ui-color-rule); background: var(--ui-color-surface); }
.ui-qrcode--bordered::after { content: ''; position: absolute; inset: -1px; border-inline-start: 2px solid var(--ui-color-metal); pointer-events: none; }
.ui-qrcode__code, .ui-qrcode__image { display: block; width: 100%; height: 100%; }.ui-qrcode__image { image-rendering: pixelated; }
.ui-qrcode__mask { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px; padding: 12px; background: color-mix(in srgb, var(--ui-color-surface) 96%, transparent); text-align: center; overflow-wrap: anywhere; }.ui-qrcode__mask p { margin: 0; }
.ui-qrcode[data-status='error'] .ui-qrcode__mask { color: var(--ui-color-danger); }
@media (forced-colors: active) { .ui-qrcode__code { forced-color-adjust: none; }.ui-qrcode__mask { background: Canvas; color: CanvasText; } }
</style>
