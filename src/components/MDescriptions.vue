<script setup lang="ts">
import { useId } from 'vue';
import type { MDescriptionItem, MDescriptionsProps } from './types';
const props = withDefaults(defineProps<MDescriptionsProps>(), { columns: 2, headingTag: 'h3' });
defineSlots<Record<string, ((props: { item: MDescriptionItem }) => unknown) | undefined>>();
const labelId = `ui-descriptions-${useId()}`;
function span(item: MDescriptionItem) { return Math.max(1, Math.min(props.columns, item.span || 1)); }
</script>

<template>
  <section class="ui-descriptions" :aria-labelledby="labelId">
    <component :is="headingTag" :id="labelId" class="ui-descriptions__heading">{{ label }}</component>
    <dl v-if="items.length" class="ui-descriptions__list" :style="{ '--ui-description-columns': columns }">
      <div v-for="item in items" :key="item.key" class="ui-descriptions__item" :style="{ '--ui-description-span': span(item) }"><dt>{{ item.label }}</dt><dd><slot :name="item.key" :item="item">{{ item.value === undefined || item.value === '' ? '—' : item.value }}</slot></dd></div>
    </dl>
    <p v-else class="ui-descriptions__empty">暂无资料。</p>
  </section>
</template>

<style scoped>
.ui-descriptions { min-width: 0; color: var(--ui-color-text); font: var(--ui-font-size-body)/1.7 var(--ui-font-family); }
.ui-descriptions__heading { margin: 0 0 20px; font: var(--ui-font-weight-emphasis) var(--ui-font-size-heading)/1.5 var(--ui-font-family-display); overflow-wrap: anywhere; }
.ui-descriptions__list { display: grid; grid-template-columns: repeat(var(--ui-description-columns), minmax(0, 1fr)); gap: 0 28px; margin: 0; padding: 0; }
.ui-descriptions__item { min-width: 0; position: relative; display: grid; align-content: start; grid-column: span var(--ui-description-span); gap: 8px; padding: 16px 0; border-bottom: 1px solid var(--ui-color-rule); }
.ui-descriptions__item::after { content: ''; position: absolute; right: 0; bottom: -1px; width: 7px; height: 1px; background: var(--ui-color-metal); }
.ui-descriptions dt { color: var(--ui-color-text-secondary); font-size: 11px; overflow-wrap: anywhere; }
.ui-descriptions dd { min-width: 0; margin: 0; overflow-wrap: anywhere; }
.ui-descriptions__empty { margin: 0; padding-block: 16px; border-block: 1px solid var(--ui-color-rule); color: var(--ui-color-text-secondary); font-size: 12px; }
@media (max-width: 600px) { .ui-descriptions__list { grid-template-columns: minmax(0, 1fr); } .ui-descriptions__item { grid-column: 1 / -1; } }
</style>
