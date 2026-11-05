<script setup lang="ts" generic="Item">
import { useMConfig } from '../../composables/useConfig';
import MSpinner from '../MSpinner.vue';
import { dataKey } from './useVirtualWindow';
import type { MListProps } from './types';
import './reference-data.css';
withDefaults(defineProps<MListProps<Item>>(), { loading: false });
const { t } = useMConfig();
defineSlots<{ header?: () => unknown; footer?: () => unknown; empty?: () => unknown; loading?: () => unknown; item?: (props: { item: Item; index: number }) => unknown }>();
</script>
<template>
  <section class="ui-data ui-list" :aria-label="label" :aria-busy="loading || undefined">
    <header v-if="$slots.header" class="ui-data__heading"><slot name="header" /></header>
    <div v-if="loading" class="ui-data__state"><slot name="loading"><MSpinner :label="t('loading', '加载中')" /></slot></div>
    <ul v-else-if="items.length" class="ui-list__items"><li v-for="(item, index) in items" :key="dataKey(item, index, itemKey)" class="ui-list__item"><slot name="item" :item="item" :index="index">{{ item }}</slot></li></ul>
    <div v-else class="ui-data__empty"><slot name="empty">{{ emptyText ?? t('empty', '暂无内容') }}</slot></div>
    <footer v-if="$slots.footer" class="ui-data__footer"><slot name="footer" /></footer>
  </section>
</template>
<style scoped>
.ui-list { border-block: 1px solid var(--ui-color-rule); }.ui-list__items { margin: 0; padding: 0; list-style: none; }.ui-list__item { padding: 12px 16px; overflow-wrap: anywhere; }.ui-list__item + .ui-list__item { border-top: 1px solid var(--ui-color-rule); }
</style>
