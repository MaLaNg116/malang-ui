<script setup lang="ts" generic="Item">
import { computed, ref } from 'vue';
import MVirtualList from './MVirtualList.vue';
import type { MDataKey, MListyProps, MVirtualAlign } from './types';
const props = withDefaults(defineProps<MListyProps<Item>>(), { selectable: true, numbered: true });
const emit = defineEmits<{ 'update:modelValue': [value: MDataKey] }>();
defineSlots<{ item?: (props: { item: Item; index: number; selected: boolean }) => unknown; header?: () => unknown; footer?: () => unknown; empty?: () => unknown }>();
const list = ref<{ scrollToIndex: (index: number, align?: MVirtualAlign) => void; scrollTo: (options: ScrollToOptions) => void; viewport?: HTMLElement }>();
defineExpose({ scrollToIndex: (index: number, align?: MVirtualAlign) => list.value?.scrollToIndex(index, align), scrollTo: (options: ScrollToOptions) => list.value?.scrollTo(options), viewport: computed(() => list.value?.viewport) });
</script>
<template>
  <MVirtualList v-bind="props" ref="list" class="ui-listy" @update:model-value="emit('update:modelValue', $event)">
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <template #item="{ item, index, selected }"><span v-if="numbered" class="ui-virtual__number" aria-hidden="true">{{ index + 1 }}</span><span class="ui-virtual__copy"><slot name="item" :item="item" :index="index" :selected="selected">{{ item }}</slot></span><span v-if="selectable" class="ui-listy__seal" aria-hidden="true">{{ selected ? '定' : '·' }}</span></template>
    <template v-if="$slots.empty" #empty><slot name="empty" /></template><template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </MVirtualList>
</template>
<style scoped>
.ui-listy { border-block: 1px solid var(--ui-color-rule); }.ui-listy__seal { min-width: 1.5em; color: var(--ui-color-accent); font-family: var(--ui-font-family-display); }
</style>
