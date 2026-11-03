<script setup lang="ts">
import type { UiBreadcrumbProps } from './types';
withDefaults(defineProps<UiBreadcrumbProps>(), { label: '面包屑导航' });
</script>

<template>
  <nav class="ui-breadcrumb" :aria-label="label">
    <ol class="ui-breadcrumb__list">
      <li v-for="(item, index) in items" :key="index" class="ui-breadcrumb__item">
        <span v-if="index" class="ui-breadcrumb__separator" aria-hidden="true">/</span>
        <a v-if="item.href && index < items.length - 1" :href="item.href" class="ui-breadcrumb__link">{{ item.label }}</a>
        <span v-else :aria-current="index === items.length - 1 ? 'page' : undefined" class="ui-breadcrumb__text">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.ui-breadcrumb { min-width: 0; color: var(--ui-color-text-secondary); font: var(--ui-font-size-caption)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-breadcrumb__list { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--ui-space-2); list-style: none; margin: 0; padding: 0; }
.ui-breadcrumb__item { display: inline-flex; align-items: baseline; gap: var(--ui-space-2); min-width: 0; max-width: 100%; }
.ui-breadcrumb__link, .ui-breadcrumb__text { min-width: 0; overflow-wrap: anywhere; }
.ui-breadcrumb__link { color: inherit; text-decoration: none; text-underline-offset: 4px; }
.ui-breadcrumb__link:hover { color: var(--ui-color-accent); text-decoration: underline; }
.ui-breadcrumb__link:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: var(--ui-focus-offset); }
.ui-breadcrumb__text[aria-current] { color: var(--ui-color-text); font-weight: var(--ui-font-weight-emphasis); }
.ui-breadcrumb__separator { flex: none; color: var(--ui-color-metal); }
</style>
