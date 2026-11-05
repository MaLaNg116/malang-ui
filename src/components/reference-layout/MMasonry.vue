<script setup lang="ts" generic="Item extends object">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { MMasonryProps } from './types';
import type { VNodeChild } from 'vue';
import { bounded, browserOf, length, responsive, useViewport } from './_shared';
const props = withDefaults(defineProps<MMasonryProps<Item>>(), { columns: () => ({ xs: 1, sm: 2, md: 3, lg: 4 }), gap: 16, label: '瀑布流内容' });
defineSlots<{ item?: (props: { item: Item; index: number }) => VNodeChild }>();
const host = ref<HTMLElement>(), width = useViewport(host), ready = ref(false), itemWidth = ref(0), height = ref(0), positions = ref<{ x: number; y: number }[]>([]);
const columns = computed(() => Math.floor(bounded(responsive(props.columns, width.value, 1), 1, 12, 1)));
let elements: (HTMLElement | null)[] = [], observer: ResizeObserver | undefined, frame = 0, alive = true;
const key = (item: Item, index: number) => typeof props.itemKey === 'function' ? props.itemKey(item, index) : props.itemKey ? String((item as Record<string, unknown>)[props.itemKey] ?? index) : index;
function schedule() { const browser = browserOf(host.value); if (!alive || !browser || frame) return; frame = browser.requestAnimationFrame(() => { frame = 0; void arrange(); }); }
async function arrange() {
  if (!host.value || !alive) return; const gap = parseFloat(getComputedStyle(host.value).columnGap) || 0;
  const count = columns.value; itemWidth.value = Math.max(0, (host.value.clientWidth - gap * (count - 1)) / count); await nextTick(); if (!alive) return;
  const bottoms = Array(count).fill(0) as number[], next: { x: number; y: number }[] = [];
  const rtl = getComputedStyle(host.value).direction === 'rtl';
  for (let index = 0; index < props.items.length; index++) { const column = bottoms.indexOf(Math.min(...bottoms)), y = bottoms[column]!; next.push({ x: (rtl ? count - 1 - column : column) * (itemWidth.value + gap), y }); bottoms[column] = y + (elements[index]?.getBoundingClientRect().height ?? 0) + gap; }
  positions.value = next; height.value = Math.max(0, ...bottoms.map(value => value - gap)); ready.value = true;
}
function observe() { observer?.disconnect(); if (host.value) observer?.observe(host.value); for (const element of elements) if (element) observer?.observe(element); schedule(); }
watch(() => [props.items, props.gap, columns.value], () => { void nextTick(observe); }, { deep: true, flush: 'post' });
onMounted(() => { const browser = browserOf(host.value); if (browser) observer = new browser.ResizeObserver(schedule); observe(); void host.value?.ownerDocument.fonts?.ready.then(schedule); });
onBeforeUnmount(() => { alive = false; observer?.disconnect(); if (frame) browserOf(host.value)?.cancelAnimationFrame(frame); elements = []; });
</script>
<template><div ref="host" class="ui-masonry" role="list" :aria-label="label" :data-arranged="ready || undefined" :style="{ columnGap: length(gap), height: ready && items.length ? `${height}px` : undefined }"><div v-for="(item, index) in items" :key="key(item,index)" :ref="element => { elements[index] = element as HTMLElement | null; }" class="ui-masonry__item" role="listitem" :style="{ position: ready ? 'absolute' : 'relative', width: itemWidth ? `${itemWidth}px` : '100%', left: ready ? `${positions[index]?.x ?? 0}px` : undefined, top: ready ? `${positions[index]?.y ?? 0}px` : undefined }"><slot name="item" :item="item" :index="index">{{ item }}</slot></div><p v-if="!items.length" class="ui-masonry__empty">暂无内容。</p></div></template>
<style scoped>.ui-masonry{position:relative;min-width:0;width:100%}.ui-masonry__item{box-sizing:border-box;min-width:0;overflow-wrap:anywhere}.ui-masonry__empty{margin:0;color:var(--ui-color-text-secondary)}</style>
