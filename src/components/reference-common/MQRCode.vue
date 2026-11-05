<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import MButton from '../MButton.vue';
import MSpinner from '../MSpinner.vue';
import { useMConfig } from '../../composables/useConfig';
import { useMTransition } from '../../composables/useMTransition';
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
const host = ref<HTMLElement>(), well = ref<HTMLElement>(), canvas = ref<HTMLCanvasElement>();
const drawError = ref('');
const measuredSize = ref<number>();
const pixelRatio = ref(1);
const dimension = computed(() => Number.isFinite(props.size) ? Math.max(80, Math.min(2048, props.size)) : 200);
const quiet = computed(() => Number.isFinite(props.quietZone) ? Math.max(4, Math.min(32, Math.floor(props.quietZone))) : 4);
const hasIcon = computed(() => !!props.icon && (!Number.isFinite(props.iconSize) || props.iconSize! > 0));
const correction = computed(() => hasIcon.value ? 'H' : props.errorLevel);
const result = computed(() => {
  try {
    if (qrContrast(props.color, props.bgColor) < 4.5) throw new Error('二维码前景与背景对比度不足');
    return { matrix: encodeQRCode(props.value, correction.value), error: '' };
  } catch (error) { return { matrix: undefined, error: error instanceof Error ? error.message : String(error) }; }
});
const extent = computed(() => (result.value.matrix?.size ?? 21) + quiet.value * 2);
const availableSize = computed(() => measuredSize.value ?? dimension.value - (props.bordered ? 30 : 0));
const modulePixels = computed(() => Math.floor(availableSize.value * pixelRatio.value / extent.value));
const snappedSize = computed(() => modulePixels.value > 0 ? `${extent.value * modulePixels.value / pixelRatio.value}px` : undefined);
const ink = computed(() => availableSize.value >= 100 && modulePixels.value >= 3);
const path = computed(() => result.value.matrix ? qrPath(result.value.matrix, quiet.value, ink.value) : '');
const rendering = computed(() => ink.value ? 'geometricPrecision' : 'crispEdges');
const logoSize = computed(() => props.icon && result.value.matrix ? Math.max(0, Math.min(Number.isFinite(props.iconSize) ? props.iconSize! / dimension.value * extent.value : 5, result.value.matrix.size * .16)) : 0);
const logoStart = computed(() => (extent.value - logoSize.value) / 2);
const errorText = computed(() => result.value.error || drawError.value);
const viewState = computed(() => errorText.value ? 'error' : props.status);
const { transition } = useMTransition({ preset: 'stamp' });
const stateText = computed(() => errorText.value || (
  viewState.value === 'loading' ? t('loading', '加载中')
  : viewState.value === 'expired' ? t('qr.expired', '二维码已过期')
  : t('qr.scanned', '已扫描')
));
const qrVersion = computed(() => {
  const modules = result.value.matrix?.size;
  return modules ? (modules - 17) / 4 : undefined;
});
let alive = false, version = 0;
const pendingImages = new Set<HTMLImageElement>();
let owner: (Window & typeof globalThis) | null | undefined;
let resizeObserver: ResizeObserver | undefined;
let resolution: MediaQueryList | undefined;

function readPixelRatio() {
  const ratio = owner?.devicePixelRatio || 1;
  if (resolution && ratio === pixelRatio.value) return;
  pixelRatio.value = ratio;
  resolution?.removeEventListener('change', readPixelRatio);
  resolution = owner?.matchMedia?.(`(resolution: ${ratio}dppx)`);
  resolution?.addEventListener('change', readPixelRatio);
}
function measure(width: number, height: number) {
  if (width > 0 && height > 0) measuredSize.value = Math.min(width, height);
}
function readLayout() {
  readPixelRatio();
  const rect = well.value?.getBoundingClientRect();
  if (rect) measure(rect.width, rect.height);
}

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
  if (!result.value.matrix) throw new Error(result.value.error);
  const side = extent.value, foreground = props.color, background = props.bgColor;
  const codePath = path.value;
  const icon = props.icon, logo = logoSize.value, start = logoStart.value;
  const image = icon && logo ? await loadImage(icon) : undefined;
  target.width = target.height = side * scale;
  const context = target.getContext('2d'); if (!context) throw new Error('浏览器不支持画布');
  context.fillStyle = background; context.fillRect(0, 0, target.width, target.height);
  context.save();
  context.scale(scale, scale);
  context.fillStyle = foreground;
  context.fill(new Path2D(codePath));
  context.restore();
  if (image && logo) {
    context.fillStyle = background; context.fillRect((start - .5) * scale, (start - .5) * scale, (logo + 1) * scale, (logo + 1) * scale);
    context.drawImage(image, start * scale, start * scale, logo * scale, logo * scale);
  }
}
function clearCanvas() {
  const target = canvas.value;
  if (target) target.getContext('2d')?.clearRect(0, 0, target.width, target.height);
}
async function redraw() {
  const current = ++version; drawError.value = '';
  if (result.value.error) {
    clearCanvas();
    emit('error', new Error(result.value.error));
    return;
  }
  if (!alive || props.type !== 'canvas') return;
  await nextTick();
  const target = canvas.value;
  if (!target || !alive || current !== version) return;
  const buffer = target.ownerDocument.createElement('canvas');
  try {
    await paint(buffer, Math.max(1, modulePixels.value));
    if (!alive || current !== version) return;
    target.width = buffer.width; target.height = buffer.height; target.getContext('2d')?.drawImage(buffer, 0, 0);
  } catch (error) {
    if (alive && current === version) {
      clearCanvas();
      drawError.value = error instanceof Error ? error.message : String(error);
      emit('error', new Error(drawError.value));
    }
  }
}
async function toDataURL(format: 'svg' | 'png' = 'svg'): Promise<string> {
  const doc = host.value?.ownerDocument;
  if (!doc || !result.value.matrix) throw new Error(result.value.error || '二维码尚未挂载');
  if (format === 'png') { const target = doc.createElement('canvas'); await paint(target); return target.toDataURL('image/png'); }
  const outputSize = dimension.value;
  const integerScale = Math.floor(outputSize / extent.value);
  const scale = integerScale || outputSize / extent.value;
  const inset = integerScale ? Math.floor((outputSize - extent.value * scale) / 2) : 0;
  const node = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  node.setAttribute('viewBox', `0 0 ${outputSize} ${outputSize}`);
  node.setAttribute('width', String(outputSize));
  node.setAttribute('height', String(outputSize));
  const rect = doc.createElementNS(node.namespaceURI, 'rect'); rect.setAttribute('width', '100%'); rect.setAttribute('height', '100%'); rect.setAttribute('fill', props.bgColor); node.append(rect);
  const code = doc.createElementNS(node.namespaceURI, 'g');
  code.setAttribute('transform', `translate(${inset} ${inset}) scale(${scale})`);
  node.append(code);
  const modules = doc.createElementNS(node.namespaceURI, 'path'); modules.setAttribute('d', path.value); modules.setAttribute('fill', props.color); modules.setAttribute('shape-rendering', rendering.value); code.append(modules);
  if (props.icon && logoSize.value) {
    const start = logoStart.value, size = logoSize.value, background = props.bgColor;
    const image = await loadImage(props.icon), buffer = doc.createElement('canvas'); buffer.width = buffer.height = 128;
    buffer.getContext('2d')?.drawImage(image, 0, 0, 128, 128);
    const pad = doc.createElementNS(node.namespaceURI, 'rect'); for (const [key, value] of Object.entries({ x: start - .5, y: start - .5, width: size + 1, height: size + 1, fill: background })) pad.setAttribute(key, String(value)); code.append(pad);
    const logo = doc.createElementNS(node.namespaceURI, 'image'); for (const [key, value] of Object.entries({ x: start, y: start, width: size, height: size, href: buffer.toDataURL('image/png') })) logo.setAttribute(key, String(value)); code.append(logo);
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(node))}`;
}
async function download(filename = 'qrcode', format: 'svg' | 'png' = 'png') {
  const url = await toDataURL(format); if (!alive || !host.value) return;
  const anchor = host.value.ownerDocument.createElement('a'); anchor.href = url; anchor.download = `${filename.replace(/\.(svg|png)$/i, '')}.${format}`; anchor.click();
}
watch(() => [result.value, props.type, props.icon, props.iconSize, dimension.value, quiet.value, ink.value, modulePixels.value], () => { void redraw(); });
onMounted(() => {
  alive = true;
  owner = well.value?.ownerDocument.defaultView;
  readLayout();
  owner?.addEventListener('resize', readLayout);
  if (owner?.ResizeObserver && well.value) {
    resizeObserver = new owner.ResizeObserver(([entry]) => {
      if (entry) measure(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(well.value);
  }
  void redraw();
});
onBeforeUnmount(() => {
  alive = false;
  version++;
  resizeObserver?.disconnect();
  owner?.removeEventListener('resize', readLayout);
  resolution?.removeEventListener('change', readPixelRatio);
  for (const image of pendingImages) {
    image.onerror?.(new Event('error'));
    image.onload = image.onerror = null;
    image.src = '';
  }
  pendingImages.clear();
});
defineExpose({ toDataURL, download });
</script>

<template>
  <div
    ref="host"
    class="ui-qrcode"
    :class="{ 'ui-qrcode--bordered': bordered }"
    :style="{ width: `min(${dimension}px, 100%)`, containIntrinsicInlineSize: dimension + 'px' }"
    :data-status="viewState"
    :data-qr-version="qrVersion"
    :data-qr-level="qrVersion ? correction : undefined"
  >
    <div v-if="bordered" class="ui-qrcode__frame" aria-hidden="true">
      <span class="ui-qrcode__serial">ML / 码印</span>
      <span class="ui-qrcode__hint">{{ viewState === 'active' ? t('qr.scanHint', 'SCAN / 轻扫识别') : t('qr.inactiveHint', '扫码暂停') }}</span>
      <span class="ui-qrcode__scale" />
      <span class="ui-qrcode__seal" />
    </div>
    <div ref="well" class="ui-qrcode__well" :style="{ backgroundColor: bgColor }">
      <div class="ui-qrcode__code" :aria-hidden="viewState !== 'active'" :style="{ inlineSize: snappedSize, blockSize: snappedSize }">
        <svg v-if="type === 'svg'" :viewBox="`0 0 ${extent} ${extent}`" role="img" :aria-label="label ?? '二维码'" class="ui-qrcode__image">
          <rect width="100%" height="100%" :fill="bgColor" />
          <path :d="path" :fill="color" :shape-rendering="rendering" />
          <template v-if="icon && logoSize">
            <rect :x="logoStart - .5" :y="logoStart - .5" :width="logoSize + 1" :height="logoSize + 1" :fill="bgColor" />
            <image :href="icon" :x="logoStart" :y="logoStart" :width="logoSize" :height="logoSize" />
          </template>
        </svg>
        <canvas v-else ref="canvas" class="ui-qrcode__image" role="img" :aria-label="label ?? '二维码'" />
      </div>
      <div class="ui-qrcode__mask" :hidden="viewState === 'active'" :inert="viewState === 'active'">
        <Transition v-bind="transition" mode="out-in">
          <div v-if="viewState !== 'active'" :key="viewState" class="ui-qrcode__state-content" :data-state="viewState">
            <MSpinner v-if="viewState === 'loading'" class="ui-qrcode__state-spinner" :label="stateText" />
            <svg v-else class="ui-qrcode__state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false">
              <path d="M2 8V4l2-2h4m8 0h4l2 2v4m0 8v4l-2 2h-4m-8 0H4l-2-2v-4" />
              <path v-if="viewState === 'scanned'" d="m6 12 4 4 8-8" />
              <path v-else-if="viewState === 'expired'" d="M12 6v7h5" />
              <path v-else d="m7 7 10 10m0-10L7 17" />
            </svg>
            <p class="ui-qrcode__state-text" :role="viewState === 'loading' ? undefined : 'status'" :aria-hidden="viewState === 'loading' || undefined">{{ stateText }}</p>
            <MButton v-if="status === 'expired'" class="ui-qrcode__refresh" size="sm" variant="secondary" @click="emit('refresh')">{{ refreshLabel ?? t('refresh', '刷新') }}</MButton>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-qrcode {
  box-sizing: border-box;
  position: relative;
  container-type: inline-size;
  min-inline-size: 0;
  max-inline-size: 100%;
  aspect-ratio: 1;
  color: var(--ui-color-text);
  font: 14px/1.5 var(--ui-font-family);
}
.ui-qrcode--bordered {
  border: 1px solid var(--ui-color-rule);
  background:
    linear-gradient(132deg, var(--ui-color-surface-raised) 0 22%, transparent 22%),
    linear-gradient(318deg, var(--ui-color-metal-soft), var(--ui-color-surface) 72%);
  box-shadow: 0 3px 0 -1px var(--ui-color-surface-muted), var(--ui-shadow-panel);
}
.ui-qrcode__frame { position: absolute; inset: 0; pointer-events: none; }
.ui-qrcode__frame::before {
  content: '';
  position: absolute;
  inset: 2px;
  --ui-qrcode-corner: clamp(6px, 6cqi, 14px);
  background:
    linear-gradient(var(--ui-color-accent), var(--ui-color-accent)) left top / var(--ui-qrcode-corner) 2px no-repeat,
    linear-gradient(var(--ui-color-accent), var(--ui-color-accent)) left top / 2px var(--ui-qrcode-corner) no-repeat,
    linear-gradient(var(--ui-color-metal), var(--ui-color-metal)) right top / var(--ui-qrcode-corner) 1px no-repeat,
    linear-gradient(var(--ui-color-metal), var(--ui-color-metal)) right top / 1px var(--ui-qrcode-corner) no-repeat,
    linear-gradient(var(--ui-color-metal), var(--ui-color-metal)) left bottom / var(--ui-qrcode-corner) 1px no-repeat,
    linear-gradient(var(--ui-color-metal), var(--ui-color-metal)) left bottom / 1px var(--ui-qrcode-corner) no-repeat,
    linear-gradient(var(--ui-color-metal), var(--ui-color-metal)) right bottom / var(--ui-qrcode-corner) 1px no-repeat,
    linear-gradient(var(--ui-color-metal), var(--ui-color-metal)) right bottom / 1px var(--ui-qrcode-corner) no-repeat;
}
.ui-qrcode__serial,
.ui-qrcode__hint {
  position: absolute;
  inset-inline-start: 18px;
  max-inline-size: calc(100% - 36px);
  overflow: hidden;
  white-space: nowrap;
  font: 600 8px/1 var(--ui-font-family-mono);
  letter-spacing: .12em;
}
.ui-qrcode__serial { inset-block-start: 3px; color: var(--ui-color-text-secondary); }
.ui-qrcode__hint { inset-block-end: 2px; color: var(--ui-color-text-secondary); }
.ui-qrcode__scale {
  position: absolute;
  inset-block-start: calc(50% - 18px);
  inset-inline-start: 4px;
  inline-size: 4px;
  block-size: 36px;
  background:
    linear-gradient(var(--ui-color-secondary-accent), var(--ui-color-secondary-accent)) center / 4px 2px no-repeat,
    repeating-linear-gradient(to bottom, var(--ui-color-metal) 0 1px, transparent 1px 5px) left / 2px 100% no-repeat;
}
.ui-qrcode__seal {
  position: absolute;
  inset-inline-end: 2px;
  inset-block-end: 2px;
  inline-size: clamp(4px, 4.5cqi, 10px);
  aspect-ratio: 1;
  background: var(--ui-color-seal);
  clip-path: polygon(0 0, 78% 0, 100% 22%, 100% 100%, 0 100%);
}
.ui-qrcode__seal::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--ui-color-on-accent);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Cpath fill='none' stroke='black' d='M3 3h3v4H3v4h3M8 3h3v6H8v2M3 5h3'/%3E%3C/svg%3E") center / 100% 100% no-repeat;
}
.ui-qrcode__well { position: absolute; inset: 0; display: grid; place-items: center; }
.ui-qrcode--bordered .ui-qrcode__well {
  inset: clamp(4px, 7cqi, 14px);
  box-shadow: 0 0 0 1px var(--ui-color-metal);
}
.ui-qrcode__code,
.ui-qrcode__image { display: block; inline-size: 100%; block-size: 100%; }
.ui-qrcode__code { max-inline-size: 100%; max-block-size: 100%; }
.ui-qrcode__image { image-rendering: pixelated; }
.ui-qrcode__mask {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: color-mix(in srgb, var(--ui-color-surface) 84%, transparent);
}
.ui-qrcode__mask[hidden] { display: none; }
.ui-qrcode__state-content {
  --ui-qrcode-state-color: var(--ui-color-info);
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: safe center;
  align-items: center;
  gap: clamp(2px, 4cqi, 8px);
  padding: clamp(2px, 5cqi, 12px);
  overflow: auto;
  text-align: center;
}
.ui-qrcode__state-content[data-state='expired'] { --ui-qrcode-state-color: var(--ui-color-warning); }
.ui-qrcode__state-content[data-state='scanned'] { --ui-qrcode-state-color: var(--ui-color-success); }
.ui-qrcode__state-content[data-state='error'] { --ui-qrcode-state-color: var(--ui-color-danger); }
.ui-qrcode__state-spinner {
  --ui-spinner-color: var(--ui-qrcode-state-color);
  background: var(--ui-color-surface);
  box-shadow: 0 0 0 4px var(--ui-color-surface);
}
.ui-qrcode__state-icon {
  flex: none;
  inline-size: 30px;
  block-size: 30px;
  padding: 3px;
  color: var(--ui-qrcode-state-color);
  background: color-mix(in srgb, currentColor 8%, var(--ui-color-surface));
}
.ui-qrcode__state-text {
  box-sizing: border-box;
  flex: none;
  max-inline-size: 100%;
  margin: 0;
  padding-inline: 3px;
  background: var(--ui-color-surface);
  color: var(--ui-qrcode-state-color);
  font-size: clamp(10px, 6.5cqi, 14px);
  font-weight: var(--ui-font-weight-emphasis);
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.ui-qrcode__refresh { flex: none; }
@container (max-width: 136px) {
  .ui-qrcode__serial, .ui-qrcode__hint, .ui-qrcode__scale { display: none; }
  .ui-qrcode__seal { inset-inline-end: 1px; inset-block-end: 1px; }
}
@container (max-width: 104px) {
  .ui-qrcode__state-icon { display: none; }
  .ui-qrcode__state-content { padding: 2px; }
  .ui-qrcode__state-text { padding-inline: 0; }
  .ui-qrcode__refresh { min-block-size: 26px; padding-inline: 6px; font-size: 10px; }
  @media (pointer: coarse) {
    .ui-qrcode__refresh { min-block-size: 44px; }
  }
}
@media (forced-colors: active) {
  .ui-qrcode--bordered { border-color: CanvasText; background: Canvas; }
  .ui-qrcode__frame { display: none; }
  .ui-qrcode__code { forced-color-adjust: none; }
  .ui-qrcode__mask {
    forced-color-adjust: none;
    background: color-mix(in srgb, Canvas 84%, transparent);
  }
  .ui-qrcode__state-spinner, .ui-qrcode__state-icon, .ui-qrcode__state-text { background: Canvas; }
  .ui-qrcode__state-icon, .ui-qrcode__state-text { color: CanvasText; }
}
</style>
