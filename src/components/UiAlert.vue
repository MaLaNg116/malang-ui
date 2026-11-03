<script setup lang="ts">
import { useId } from 'vue';
import type { UiAlertProps } from './types';

withDefaults(defineProps<UiAlertProps>(), { tone: 'info', announce: false });
const identity = useId();
const titleId = `ui-alert-${identity}-title`;
const descriptionId = `ui-alert-${identity}-description`;
</script>

<template>
  <section
    class="ui-alert"
    :class="`ui-alert--${tone}`"
    :role="announce ? (tone === 'error' ? 'alert' : 'status') : 'note'"
    :aria-live="announce ? (tone === 'error' ? 'assertive' : 'polite') : undefined"
    :aria-atomic="announce ? true : undefined"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descriptionId : undefined"
  >
    <span class="ui-alert__seal" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path v-if="tone === 'success'" d="m6 12 4 4 8-8" />
        <path v-else-if="tone === 'error'" d="m7 7 10 10m0-10L7 17" />
        <path v-else-if="tone === 'warning'" d="m12 5 8 14H4L12 5Zm0 5v4m0 2v.5" />
        <path v-else-if="tone === 'neutral'" d="M6 12h12" />
        <path v-else d="M12 10v7m0-11v.5" />
      </svg>
    </span>
    <div class="ui-alert__content">
      <h3 :id="titleId" class="ui-alert__title">{{ title }}</h3>
      <p v-if="description" :id="descriptionId" class="ui-alert__description">{{ description }}</p>
      <div v-if="$slots.default" class="ui-alert__extra"><slot /></div>
    </div>
  </section>
</template>

<style scoped>
.ui-alert {
  --ui-alert-tone: var(--ui-color-secondary-accent);
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: start;
  gap: var(--ui-space-3);
  box-sizing: border-box;
  min-width: 0;
  padding: var(--ui-field-gap);
  border: 1px solid var(--ui-color-rule);
  border-inline-start: 2px solid var(--ui-alert-tone);
  background: var(--ui-color-surface);
  color: var(--ui-color-text);
  font: var(--ui-font-weight-body) var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family);
  overflow-wrap: anywhere;
}
.ui-alert::after { content: ''; position: absolute; inset-inline-end: 5px; bottom: 5px; width: 6px; height: 6px; border-inline-end: 1px solid var(--ui-alert-tone); border-bottom: 1px solid var(--ui-alert-tone); opacity: .65; pointer-events: none; }
.ui-alert--neutral { --ui-alert-tone: var(--ui-color-text-secondary); }
.ui-alert--success { --ui-alert-tone: var(--ui-color-success); }
.ui-alert--warning { --ui-alert-tone: var(--ui-color-warning, var(--ui-color-text)); }
.ui-alert--error { --ui-alert-tone: var(--ui-color-danger); }
.ui-alert__seal { display: grid; place-items: center; width: 26px; height: 28px; border: 1px solid currentColor; color: var(--ui-alert-tone); }
.ui-alert__seal svg { width: 22px; height: 22px; stroke: currentColor; stroke-width: 1.6; stroke-linecap: square; stroke-linejoin: miter; }
.ui-alert__content { min-width: 0; }
.ui-alert__title { margin: 0; font: var(--ui-font-weight-emphasis) var(--ui-font-size-heading)/1.5 var(--ui-font-family-display); }
.ui-alert__description { margin: var(--ui-space-2) 0 0; color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-body); line-height: 1.8; }
.ui-alert__extra { margin-top: var(--ui-space-3); font-size: var(--ui-font-size-caption); }
.ui-alert__extra:empty { display: none; }
@media (forced-colors: active) { .ui-alert, .ui-alert::after, .ui-alert__seal { border-color: CanvasText; } }
</style>
