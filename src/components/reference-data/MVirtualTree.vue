<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import type { MTreeNode } from '../types';
import type { MVirtualTreeProps } from './types';
import MScrollbar from './MScrollbar.vue';
import { useVirtualWindow } from './useVirtualWindow';
import { useMConfig } from '../../composables/useConfig';
import './reference-data.css';
const props = withDefaults(defineProps<MVirtualTreeProps>(), { height: 320, itemHeight: 44, overscan: 4, disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: string]; 'update:expandedValues': [values: string[]] }>();
defineSlots<{ item?: (props: { item: MTreeNode; level: number; expanded: boolean; selected: boolean }) => unknown }>();
type Entry = { item: MTreeNode; level: number; parent?: string; position: number; size: number; ancestors: string[] };
const { t } = useMConfig(), scrollbar = ref<InstanceType<typeof MScrollbar>>(), active = ref<string>(), identity = `ui-virtual-tree-${useId()}`;
const expanded = computed(() => new Set(props.expandedValues));
const flat = computed(() => {
  const all: Entry[] = [], stack = [...props.items].map((item, index) => ({ item, level: 1, position: index + 1, size: props.items.length, ancestors: [] as string[] })).reverse() as Entry[], seen = new Set<string>();
  while (stack.length) { const entry = stack.pop()!; if (seen.has(entry.item.value)) continue; seen.add(entry.item.value); all.push(entry); const children = entry.item.children ?? []; for (let i = children.length - 1; i >= 0; i--) stack.push({ item: children[i]!, level: entry.level + 1, parent: entry.item.value, position: i + 1, size: children.length, ancestors: [...entry.ancestors, entry.item.value] }); }
  return all;
});
const visible = computed(() => flat.value.filter(entry => entry.ancestors.every(value => expanded.value.has(value))));
const activeIndex = computed(() => Math.max(0, visible.value.findIndex(entry => entry.item.value === active.value)));
const windowed = useVirtualWindow({ count: () => visible.value.length, itemHeight: () => Math.max(44, props.itemHeight), height: () => props.height, overscan: () => props.overscan, viewport: () => scrollbar.value?.viewport });
const rendered = computed(() => windowed.indices.value.map(index => ({ ...visible.value[index]!, index })));
const activeId = computed(() => rendered.value.some(entry => entry.item.value === active.value) ? `${identity}-${activeIndex.value}` : undefined);
function focus(index: number) { const entry = visible.value[Math.max(0, Math.min(visible.value.length - 1, index))]; if (entry) { active.value = entry.item.value; windowed.scrollToIndex(index); } }
function toggle(entry: Entry) { if (props.disabled || entry.item.disabled || !entry.item.children?.length) return; const values = new Set(expanded.value); if (values.has(entry.item.value)) values.delete(entry.item.value); else values.add(entry.item.value); emit('update:expandedValues', [...values]); }
function select(entry: Entry) { active.value = entry.item.value; scrollbar.value?.viewport?.focus({ preventScroll: true }); if (!props.disabled && !entry.item.disabled) emit('update:modelValue', entry.item.value); }
let search = '', timer: ReturnType<typeof setTimeout> | undefined;
function keydown(event: KeyboardEvent) {
  if (event.target !== scrollbar.value?.viewport || event.altKey || event.ctrlKey || event.metaKey || event.isComposing || event.keyCode === 229 || props.disabled) return;
  const index = activeIndex.value, entry = visible.value[index]; if (!entry) return;
  if (event.key === 'ArrowDown') focus(index + 1); else if (event.key === 'ArrowUp') focus(index - 1); else if (event.key === 'Home') focus(0); else if (event.key === 'End') focus(visible.value.length - 1);
  else if (event.key === 'ArrowRight') { if (!expanded.value.has(entry.item.value)) toggle(entry); else if (entry.item.children?.length) focus(index + 1); }
  else if (event.key === 'ArrowLeft') { if (expanded.value.has(entry.item.value) && entry.item.children?.length) toggle(entry); else if (entry.parent) focus(visible.value.findIndex(item => item.item.value === entry.parent)); }
  else if (event.key === 'Enter' || event.key === ' ') select(entry);
  else if (event.key.length === 1) { search += event.key.toLocaleLowerCase(); if (timer) clearTimeout(timer); timer = setTimeout(() => { search = ''; timer = undefined; }, 700); const ordered = [...visible.value.slice(index + 1), ...visible.value.slice(0, index + 1)]; const match = ordered.find(item => item.item.label.toLocaleLowerCase().startsWith(search)); if (match) focus(visible.value.indexOf(match)); } else return;
  event.preventDefault();
}
watch(visible, entries => {
  if (entries.some(entry => entry.item.value === active.value)) return;
  const prior = flat.value.find(entry => entry.item.value === active.value), ancestor = [...prior?.ancestors ?? []].reverse().find(value => entries.some(entry => entry.item.value === value));
  active.value = ancestor ?? entries.find(entry => entry.item.value === props.modelValue)?.item.value ?? entries[0]?.item.value;
  void nextTick(() => windowed.scrollToIndex(activeIndex.value));
}, { immediate: true });
watch(() => props.modelValue, value => { if (visible.value.some(entry => entry.item.value === value)) active.value = value ?? undefined; });
onBeforeUnmount(() => { if (timer) clearTimeout(timer); });
defineExpose({ scrollToIndex: windowed.scrollToIndex, scrollTo: windowed.scrollTo, viewport: computed(() => scrollbar.value?.viewport) });
</script>
<template>
  <MScrollbar ref="scrollbar" class="ui-data ui-virtual-tree" :height="windowed.height.value" :label="label" role="tree" tabindex="0" :aria-disabled="disabled || undefined" :aria-activedescendant="activeId" @scroll="windowed.update" @keydown="keydown">
    <p v-if="!visible.length" class="ui-data__empty">{{ t('empty', '暂无目录项目') }}</p>
    <div v-else role="none" class="ui-virtual__canvas" :style="{ height: windowed.totalHeight.value + 'px' }"><div v-for="entry in rendered" :id="`${identity}-${entry.index}`" :key="entry.item.value" class="ui-virtual__row" role="treeitem" :aria-label="entry.item.label" :aria-level="entry.level" :aria-posinset="entry.position" :aria-setsize="entry.size" :aria-expanded="entry.item.children?.length ? expanded.has(entry.item.value) : undefined" :aria-selected="entry.item.value === modelValue" :aria-disabled="disabled || entry.item.disabled || undefined" :data-active="entry.item.value === active || undefined" :data-selected="entry.item.value === modelValue || undefined" :data-virtual-index="entry.index" :style="{ height: windowed.rowHeight.value + 'px', top: entry.index * windowed.rowHeight.value + 'px', paddingInlineStart: 12 + (entry.level - 1) * 20 + 'px' }" @click="select(entry)"><span class="ui-virtual-tree__hinge" aria-hidden="true" @click.stop="active = entry.item.value; toggle(entry); scrollbar?.viewport?.focus({preventScroll:true})">{{entry.item.children?.length ? expanded.has(entry.item.value) ? '−' : '+' : '·'}}</span><span class="ui-virtual__copy"><slot name="item" :item="entry.item" :level="entry.level" :expanded="expanded.has(entry.item.value)" :selected="entry.item.value === modelValue">{{entry.item.label}}</slot></span><span v-if="entry.item.value === modelValue" aria-hidden="true" class="ui-virtual-tree__seal">定</span></div></div>
  </MScrollbar>
</template>
<style scoped>
.ui-virtual-tree__hinge { display: grid; place-items: center; align-self: stretch; flex: none; width: 44px; margin-block: -8px; color: var(--ui-color-secondary-accent); font: 20px/1 var(--ui-font-family-mono); cursor: pointer; }.ui-virtual-tree [aria-disabled=true] { opacity: .5; }.ui-virtual-tree__seal { color: var(--ui-color-accent); font-family: var(--ui-font-family-display); }
</style>
