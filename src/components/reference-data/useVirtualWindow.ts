import { computed, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, watch } from 'vue';
import type { MDataKey, MVirtualAlign } from './types';

export const positive = (value: number | undefined, fallback: number) => value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
export function dataKey<Item>(item: Item, index: number, key?: string | ((item: Item, index: number) => MDataKey)): MDataKey {
  const value = typeof key === 'function' ? key(item, index) : item && typeof item === 'object' ? (item as Record<string, unknown>)[key ?? 'id'] : undefined;
  return typeof value === 'string' || typeof value === 'number' ? value : index;
}
export function useVirtualWindow(options: { count: () => number; itemHeight: () => number | undefined; height: () => number | undefined; overscan: () => number | undefined; viewport: () => HTMLElement | undefined }) {
  const top = ref(0), measuredHeight = ref(0), pinned = ref<number>();
  const rowHeight = computed(() => Math.max(24, positive(options.itemHeight(), 44)));
  const height = computed(() => Math.max(44, positive(options.height(), 320)));
  const count = computed(() => Math.max(0, Math.floor(options.count())));
  const buffer = computed(() => Math.max(0, Math.min(30, Math.floor(options.overscan() !== undefined && Number.isFinite(options.overscan()) ? options.overscan()! : 4))));
  const start = computed(() => Math.max(0, Math.min(count.value - 1, Math.floor(top.value / rowHeight.value) - buffer.value)));
  const end = computed(() => Math.min(count.value, Math.ceil((top.value + (measuredHeight.value || height.value)) / rowHeight.value) + buffer.value));
  const indices = computed(() => {
    const result: number[] = []; for (let i = start.value; i < end.value; i++) result.push(i);
    if (pinned.value !== undefined && pinned.value >= 0 && pinned.value < count.value && !result.includes(pinned.value)) result.push(pinned.value);
    return result.sort((a, b) => a - b);
  });
  let resize: ResizeObserver | undefined, alive = false, previouslyFocused: Element | null = null;
  function update() { const viewport = options.viewport(); if (viewport) { top.value = viewport.scrollTop; measuredHeight.value = viewport.clientHeight; } }
  function scrollTo(scroll: ScrollToOptions) { options.viewport()?.scrollTo({ ...scroll, behavior: 'instant' }); update(); }
  function scrollToIndex(index: number, align: MVirtualAlign = 'auto') {
    if (!count.value || !Number.isFinite(index)) return;
    const viewport = options.viewport(); if (!viewport) return;
    const target = Math.max(0, Math.min(count.value - 1, Math.floor(index))) * rowHeight.value;
    const available = viewport.clientHeight, current = viewport.scrollTop;
    const value = align === 'start' ? target : align === 'center' ? target - (available - rowHeight.value) / 2 : align === 'end' ? target - available + rowHeight.value : target < current ? target : target + rowHeight.value > current + available ? target - available + rowHeight.value : current;
    scrollTo({ top: Math.max(0, value) });
  }
  function focusin(event: FocusEvent) {
    const element = event.target as HTMLElement | null, row = element?.closest<HTMLElement>('[data-virtual-index]');
    pinned.value = row && options.viewport()?.contains(row) ? Number(row.dataset.virtualIndex) : undefined;
  }
  function focusout(event: FocusEvent) {
    const viewport = options.viewport(), target = event.relatedTarget;
    if (!viewport || !target || !(target instanceof Node) || !viewport.contains(target)) pinned.value = undefined;
  }
  onMounted(() => { alive = true; update(); });
  watch(options.viewport, element => {
    resize?.disconnect(); if (typeof ResizeObserver === 'function' && element) { resize = new ResizeObserver(update); resize.observe(element); } update();
  }, { flush: 'post', immediate: true });
  watch([count, rowHeight, height], () => { void nextTick(() => { if (alive) update(); }); });
  onBeforeUpdate(() => { const element = options.viewport(), active = element?.ownerDocument.activeElement; previouslyFocused = element && active && element.contains(active) ? active : null; });
  onUpdated(() => {
    const element = options.viewport(), old = previouslyFocused; previouslyFocused = null;
    if (old && !old.isConnected && element && element.ownerDocument.activeElement === element.ownerDocument.body) element.focus({ preventScroll: true });
  });
  onBeforeUnmount(() => { alive = false; resize?.disconnect(); pinned.value = undefined; previouslyFocused = null; });
  return { rowHeight, height, indices, start, end, totalHeight: computed(() => count.value * rowHeight.value), scrollToIndex, scrollTo, update, focusin, focusout };
}
