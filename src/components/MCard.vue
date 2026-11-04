<script setup lang="ts">
import { Comment, Fragment, Text, isVNode, useId, useSlots } from 'vue';
import type { Slot } from 'vue';
import type { MCardProps } from './types';

withDefaults(defineProps<MCardProps>(), { as: 'article', headingTag: 'h3' });

const slots = useSlots();
const identity = useId();
const titleId = `ui-card-${identity}-title`;
const descriptionId = `ui-card-${identity}-description`;

function hasContent(slot: Slot | undefined): boolean {
  const meaningful = (content: unknown): boolean => {
    if (Array.isArray(content)) return content.some(meaningful);
    if (isVNode(content)) {
      if (content.type === Comment) return false;
      if (content.type === Fragment || content.type === Text) return meaningful(content.children);
      return true;
    }
    return (typeof content === 'string' || typeof content === 'number') && String(content).trim().length > 0;
  };
  return Boolean(slot && meaningful(slot()));
}
</script>

<template>
  <component
    :is="as"
    class="ui-card"
    :aria-labelledby="!$slots.header && title?.trim() ? titleId : undefined"
    :aria-describedby="!$slots.header && description?.trim() ? descriptionId : undefined"
  >
    <header v-if="$slots.header ? hasContent($slots.header) : title?.trim() || description?.trim()" class="ui-card__header">
      <slot name="header">
        <component :is="headingTag" v-if="title?.trim()" :id="titleId" class="ui-card__title">{{ title }}</component>
        <p v-if="description?.trim()" :id="descriptionId" class="ui-card__description">{{ description }}</p>
      </slot>
    </header>
    <div v-if="hasContent(slots.default)" class="ui-card__body"><slot /></div>
    <footer v-if="hasContent(slots.footer)" class="ui-card__footer"><slot name="footer" /></footer>
  </component>
</template>

<style scoped>
.ui-card {
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  border: var(--ui-border-width) solid var(--ui-color-rule);
  border-radius: 0;
  background: var(--ui-color-surface);
  color: var(--ui-color-text);
  font: var(--ui-font-weight-body) var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family);
  overflow-wrap: anywhere;
}

.ui-card::before,
.ui-card::after {
  content: '';
  position: absolute;
  box-sizing: border-box;
  width: 14px;
  height: 9px;
  border-style: solid;
  border-color: var(--ui-color-metal);
  pointer-events: none;
}

.ui-card::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
.ui-card::after { right: -1px; bottom: -1px; border-width: 0 2px 2px 0; }

.ui-card__header,
.ui-card__body,
.ui-card__footer { min-width: 0; padding: var(--ui-field-gap); }

.ui-card__header:not(:last-child) { border-bottom: 1px solid var(--ui-color-rule); background: linear-gradient(110deg, color-mix(in srgb, var(--ui-color-metal-soft, var(--ui-color-wash)) 35%, var(--ui-color-surface)), var(--ui-color-surface) 85%); }

.ui-card__title {
  margin: 0;
  color: var(--ui-color-text);
  font: var(--ui-font-weight-emphasis) var(--ui-font-size-title)/var(--ui-line-height-heading) var(--ui-font-family-display);
  overflow-wrap: anywhere;
}

.ui-card__description {
  margin: var(--ui-space-2) 0 0;
  color: var(--ui-color-text-secondary);
  font-size: var(--ui-font-size-caption);
  line-height: 1.7;
}

.ui-card__description:first-child { margin-top: 0; }

.ui-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ui-space-3);
}

.ui-card__footer:not(:first-child) { border-top: 1px solid var(--ui-color-rule); }
.ui-card__footer { background: color-mix(in srgb, var(--ui-color-secondary-soft, var(--ui-color-wash)) 18%, var(--ui-color-surface)); }
.ui-card__header + .ui-card__footer { border-top: 0; }
</style>
