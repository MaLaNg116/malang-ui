<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, useAttrs, useId, watch } from 'vue';
import type { StyleValue } from 'vue';
import type { MScrollbarProps } from './types';
import { useMConfig } from '../../composables/useConfig';

defineOptions({ inheritAttrs: false });
const props = defineProps<MScrollbarProps>();
const { t, config } = useMConfig();
const scrollLabel = computed(() => props.label ?? t('scroll', '滚动区域'));
const axisLabel = (axis: 'x' | 'y') => `${scrollLabel.value} ${t(axis === 'x' ? 'scroll.horizontal' : 'scroll.vertical', config.value.locale?.startsWith('en') ? axis === 'x' ? 'Horizontal scroll' : 'Vertical scroll' : axis === 'x' ? '横向滚动' : '纵向滚动')}`;
const emit = defineEmits<{ scroll: [event: Event] }>();
const attrs = useAttrs(), viewport = ref<HTMLElement>(), content = ref<HTMLElement>();
const root = ref<HTMLElement>(); let focusedThumb: Element | null = null;
const identity = `ui-scrollbar-${useId()}`;
const enhanced = ref(false), dragAxis = ref<'x' | 'y'>();
const metrics = ref({ width: 0, height: 0, scrollWidth: 0, scrollHeight: 0, left: 0, top: 0, rtl: false });
let resize: ResizeObserver | undefined, mutation: MutationObserver | undefined, direction: MutationObserver | undefined;
let fonts: FontFaceSet | undefined;
const observedChildren = new Set<Element>();
let view: Window | null | undefined, frame: number | undefined, alive = false;
let drag: { axis: 'x' | 'y'; start: number; scroll: number; pointer: number; element: HTMLElement } | undefined;
const maxX = computed(() => Math.max(0, metrics.value.scrollWidth - metrics.value.width));
const maxY = computed(() => Math.max(0, metrics.value.scrollHeight - metrics.value.height));
const railX = computed(() => Math.max(0, metrics.value.width - 8));
const railY = computed(() => Math.max(0, metrics.value.height - 8));
const sizeX = computed(() => Math.min(railX.value, Math.max(24, railX.value * metrics.value.width / Math.max(1, metrics.value.scrollWidth))));
const sizeY = computed(() => Math.min(railY.value, Math.max(24, railY.value * metrics.value.height / Math.max(1, metrics.value.scrollHeight))));
const offsetX = computed(() => maxX.value ? metrics.value.left / maxX.value * (railX.value - sizeX.value) : 0);
const offsetY = computed(() => maxY.value ? metrics.value.top / maxY.value * (railY.value - sizeY.value) : 0);
function dimension(value: string | number | undefined) { return typeof value === 'number' ? `${Number.isFinite(value) ? Math.max(0, value) : 0}px` : value; }
const frameStyle = computed(() => ({ height: dimension(props.height), maxHeight: dimension(props.maxHeight) }));
function viewportAttrs() { const { class: _class, style: _style, ...rest } = attrs; return rest; }
function update() {
  const element = viewport.value; if (!alive || !element) return;
  const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
  const rtl = element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
  const next = { width: element.clientWidth, height: element.clientHeight, scrollWidth: element.scrollWidth, scrollHeight: element.scrollHeight, left: Math.max(0, Math.min(maximum, rtl ? maximum + element.scrollLeft : element.scrollLeft)), top: element.scrollTop, rtl };
  if (drag && (drag.axis === 'x' ? next.scrollWidth <= next.width : next.scrollHeight <= next.height)) endDrag();
  if ((Object.keys(next) as (keyof typeof next)[]).some(key => next[key] !== metrics.value[key])) metrics.value = next;
}
function schedule() { if (alive && frame === undefined && view) frame = view.requestAnimationFrame(() => { frame = undefined; update(); }); }
function observeChildren() {
  if (!resize || !content.value) return;
  const children = new Set(content.value.children);
  for (const child of observedChildren) if (!children.has(child)) { resize.unobserve(child); observedChildren.delete(child); }
  for (const child of children) if (!observedChildren.has(child)) { resize.observe(child); observedChildren.add(child); }
}
function onScroll(event: Event) { update(); emit('scroll', event); }
function scrollTo(options: ScrollToOptions) {
  const element = viewport.value; if (!element) return;
  const reduced = element.closest('[data-ui-motion="reduced"]') || element.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollTo({ ...options, behavior: reduced ? 'instant' : options.behavior ?? 'instant' }); update();
}
function setAxis(axis: 'x' | 'y', value: number) {
  const element = viewport.value, rtl = element && element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
  scrollTo(axis === 'x' ? { left: rtl ? value - maxX.value : value } : { top: value });
}
function keydown(axis: 'x' | 'y', event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
  update();
  const current = axis === 'x' ? metrics.value.left : metrics.value.top, maximum = axis === 'x' ? maxX.value : maxY.value;
  const page = axis === 'x' ? metrics.value.width : metrics.value.height;
  let value: number;
  if (event.key === 'Home') value = 0; else if (event.key === 'End') value = maximum;
  else if (event.key === 'PageDown') value = current + page; else if (event.key === 'PageUp') value = current - page;
  else if (event.key === (axis === 'x' ? 'ArrowRight' : 'ArrowDown')) value = current + 40;
  else if (event.key === (axis === 'x' ? 'ArrowLeft' : 'ArrowUp')) value = current - 40; else return;
  event.preventDefault(); setAxis(axis, Math.max(0, Math.min(maximum, value)));
}
function startDrag(axis: 'x' | 'y', event: PointerEvent) {
  if (event.button !== 0) return; event.preventDefault(); update();
  const element = event.currentTarget as HTMLElement;
  element.focus({ preventScroll: true }); element.setPointerCapture(event.pointerId);
  drag = { axis, start: axis === 'x' ? event.clientX : event.clientY, scroll: axis === 'x' ? metrics.value.left : metrics.value.top, pointer: event.pointerId, element }; dragAxis.value = axis;
}
function move(event: PointerEvent) {
  if (!drag || drag.pointer !== event.pointerId) return;
  const axis = drag.axis, travel = axis === 'x' ? railX.value - sizeX.value : railY.value - sizeY.value;
  const maximum = axis === 'x' ? maxX.value : maxY.value;
  setAxis(axis, Math.max(0, Math.min(maximum, drag.scroll + ((axis === 'x' ? event.clientX : event.clientY) - drag.start) * maximum / Math.max(1, travel))));
}
function endDrag() {
  const old = drag; drag = undefined; dragAxis.value = undefined;
  if (old?.element.hasPointerCapture(old.pointer)) old.element.releasePointerCapture(old.pointer);
}
function track(axis: 'x' | 'y', event: PointerEvent) {
  if (event.button !== 0 || event.target !== event.currentTarget) return; event.preventDefault(); update();
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const travel = axis === 'x' ? railX.value - sizeX.value : railY.value - sizeY.value;
  const position = (axis === 'x' ? event.clientX - rect.left - sizeX.value / 2 : event.clientY - rect.top - sizeY.value / 2);
  setAxis(axis, Math.max(0, Math.min(1, position / Math.max(1, travel))) * (axis === 'x' ? maxX.value : maxY.value));
}
onMounted(() => {
  alive = true; view = viewport.value?.ownerDocument.defaultView; enhanced.value = true;
  if (typeof ResizeObserver === 'function') { resize = new ResizeObserver(schedule); if (viewport.value) resize.observe(viewport.value); if (content.value) resize.observe(content.value); observeChildren(); }
  if (typeof MutationObserver === 'function' && content.value) {
    mutation = new MutationObserver(records => {
      if (records.some(record => record.type === 'childList' && record.target === content.value)) observeChildren();
      // Only slot changes can invalidate the extent.
      if (records.some(record => record.type !== 'attributes' || record.target !== content.value)) schedule();
    });
    mutation.observe(content.value, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class','style','width','height','hidden','dir','src','srcset','sizes','open'] });
  }
  if (typeof MutationObserver === 'function') { direction = new MutationObserver(schedule); let ancestor = viewport.value; while (ancestor) { direction.observe(ancestor, { attributes: true, attributeFilter: ['dir', 'class', 'style'] }); ancestor = ancestor.parentElement ?? undefined; } }
  content.value?.addEventListener('load', schedule, true);
  content.value?.addEventListener('loadedmetadata', schedule, true);
  fonts = viewport.value?.ownerDocument.fonts;
  fonts?.addEventListener('loadingdone', schedule);
  fonts?.addEventListener('loadingerror', schedule);
  void fonts?.ready.then(schedule);
  view?.addEventListener('resize', schedule); update();
});
watch(() => [props.height, props.maxHeight], () => { void nextTick(schedule); });
onBeforeUpdate(() => { const active = root.value?.ownerDocument.activeElement; focusedThumb = active?.classList.contains('ui-scrollbar__thumb') && root.value?.contains(active) ? active : null; });
onUpdated(() => { const previous = focusedThumb; focusedThumb = null; const element = viewport.value; if (previous && !previous.isConnected && element && element.ownerDocument.activeElement === element.ownerDocument.body) element.focus({ preventScroll: true }); });
onBeforeUnmount(() => { alive = false; endDrag(); resize?.disconnect(); observedChildren.clear(); mutation?.disconnect(); direction?.disconnect(); content.value?.removeEventListener('load', schedule, true); content.value?.removeEventListener('loadedmetadata', schedule, true); fonts?.removeEventListener('loadingdone', schedule); fonts?.removeEventListener('loadingerror', schedule); view?.removeEventListener('resize', schedule); if (frame !== undefined) view?.cancelAnimationFrame(frame); });
defineExpose({ viewport, scrollTo, update });
</script>

<template>
  <div
    ref="root"
    class="ui-scrollbar"
    :class="attrs.class"
    :style="[frameStyle, attrs.style as StyleValue]"
    :data-enhanced="enhanced || undefined"
    :data-dragging="dragAxis"
    :data-scroll-x="maxX > 0 || undefined"
    :data-scroll-y="maxY > 0 || undefined"
    :data-rtl="metrics.rtl || undefined"
  >
    <div v-bind="viewportAttrs()" :id="attrs.id as string || identity" ref="viewport" class="ui-scrollbar__viewport" :class="viewportClass" :role="(attrs.role as string) || 'region'" :aria-label="scrollLabel" :tabindex="attrs.tabindex !== undefined ? Number(attrs.tabindex) : maxX > 0 || maxY > 0 ? 0 : -1" @scroll="onScroll"><div ref="content" class="ui-scrollbar__content"><slot /></div></div>
    <div v-if="enhanced && maxY > 0" class="ui-scrollbar__rail ui-scrollbar__rail--y" @pointerdown="track('y', $event)"><div class="ui-scrollbar__thumb ui-scrollbar__thumb--y" role="scrollbar" tabindex="0" aria-orientation="vertical" :aria-label="axisLabel('y')" :aria-controls="attrs.id as string || identity" :aria-valuemin="0" :aria-valuemax="Math.round(maxY)" :aria-valuenow="Math.round(metrics.top)" :style="{ height: sizeY + 'px', transform: `translateY(${offsetY}px)` }" @keydown="keydown('y', $event)" @pointerdown.stop="startDrag('y', $event)" @pointermove="move" @pointerup="endDrag" @pointercancel="endDrag" @lostpointercapture="endDrag" /></div>
    <div v-if="enhanced && maxX > 0" class="ui-scrollbar__rail ui-scrollbar__rail--x" @pointerdown="track('x', $event)"><div class="ui-scrollbar__thumb ui-scrollbar__thumb--x" role="scrollbar" tabindex="0" aria-orientation="horizontal" :aria-label="axisLabel('x')" :aria-controls="attrs.id as string || identity" :aria-valuemin="0" :aria-valuemax="Math.round(maxX)" :aria-valuenow="Math.round(metrics.left)" :style="{ width: sizeX + 'px', transform: `translateX(${offsetX}px)` }" @keydown="keydown('x', $event)" @pointerdown.stop="startDrag('x', $event)" @pointermove="move" @pointerup="endDrag" @pointercancel="endDrag" @lostpointercapture="endDrag" /></div>
  </div>
</template>

<style scoped>
.ui-scrollbar {
  --ui-scrollbar-gutter: 14px;
  --ui-scrollbar-gutter-left: 0px;
  --ui-scrollbar-gutter-right: 0px;
  --ui-scrollbar-gutter-bottom: 0px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
}
.ui-scrollbar[data-scroll-x] { --ui-scrollbar-gutter-bottom: var(--ui-scrollbar-gutter); }
.ui-scrollbar[data-scroll-y] { --ui-scrollbar-gutter-right: var(--ui-scrollbar-gutter); }
.ui-scrollbar[data-rtl][data-scroll-y] {
  --ui-scrollbar-gutter-left: var(--ui-scrollbar-gutter);
  --ui-scrollbar-gutter-right: 0px;
}
.ui-scrollbar__viewport {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  margin: 0 var(--ui-scrollbar-gutter-right) var(--ui-scrollbar-gutter-bottom) var(--ui-scrollbar-gutter-left);
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--ui-scrollbar-thumb, var(--ui-color-metal)) transparent;
}
.ui-scrollbar__content { box-sizing: border-box; display: flow-root; min-width: 100%; }
.ui-scrollbar[data-enhanced] > .ui-scrollbar__viewport { scrollbar-width: none; }
.ui-scrollbar[data-enhanced] > .ui-scrollbar__viewport::-webkit-scrollbar { width: 0; height: 0; }
.ui-scrollbar__viewport:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -2px; }
.ui-scrollbar__rail { position: absolute; z-index: 4; opacity: 1; border-radius: 0; background: color-mix(in srgb, var(--ui-scrollbar-thumb, var(--ui-color-metal)) 8%, transparent); transition: opacity var(--ui-motion-duration-feedback); touch-action: none; }
.ui-scrollbar__rail--y { top: 4px; right: 2px; bottom: calc(var(--ui-scrollbar-gutter-bottom) + 4px); width: 10px; }
.ui-scrollbar__rail--x { left: calc(var(--ui-scrollbar-gutter-left) + 4px); right: calc(var(--ui-scrollbar-gutter-right) + 4px); bottom: 2px; height: 10px; }
.ui-scrollbar[data-rtl] > .ui-scrollbar__rail--y { right: auto; left: 2px; }
.ui-scrollbar__thumb { box-sizing: border-box; position: absolute; top: 0; left: 0; border: 1px solid var(--ui-scrollbar-thumb, var(--ui-color-metal)); background: var(--ui-scrollbar-thumb, var(--ui-color-metal)); cursor: grab; touch-action: none; }
.ui-scrollbar__thumb--y { width: 4px; left: 3px; }
.ui-scrollbar__thumb--x { height: 4px; top: 3px; }
.ui-scrollbar:hover > .ui-scrollbar__rail, .ui-scrollbar:focus-within > .ui-scrollbar__rail, .ui-scrollbar[data-dragging] > .ui-scrollbar__rail { opacity: 1; }
.ui-scrollbar__thumb:hover, .ui-scrollbar__thumb:focus-visible, .ui-scrollbar[data-dragging] .ui-scrollbar__thumb { background: var(--ui-scrollbar-active, var(--ui-color-info)); border-color: var(--ui-scrollbar-active, var(--ui-color-info)); }
.ui-scrollbar__thumb:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: 2px; }
.ui-scrollbar[data-dragging] { user-select: none; }.ui-scrollbar[data-dragging] .ui-scrollbar__thumb { cursor: grabbing; }
:global([data-ui-motion='reduced'] .ui-scrollbar__rail) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-scrollbar__rail { transition: none; } }
@media (pointer: coarse) {
  .ui-scrollbar { --ui-scrollbar-gutter: 16px; }
  .ui-scrollbar__rail--y { width: 16px; right: 0; }
  .ui-scrollbar[data-rtl] > .ui-scrollbar__rail--y { left: 0; }
  .ui-scrollbar__rail--x { height: 16px; bottom: 0; }
  .ui-scrollbar__thumb--y { width: 6px; left: 5px; }
  .ui-scrollbar__thumb--x { height: 6px; top: 5px; }
}
@media (forced-colors: active) {
  .ui-scrollbar { --ui-scrollbar-gutter: 0px; }
  .ui-scrollbar[data-enhanced] > .ui-scrollbar__viewport { scrollbar-width: auto; }
  .ui-scrollbar[data-enhanced] > .ui-scrollbar__viewport::-webkit-scrollbar { width: auto; height: auto; }
  .ui-scrollbar__rail { display: none; }
}
</style>
