<script setup lang="ts">
import type { MTimelineItem, MTimelineProps, MTimelineStatus } from './types';
import MEmpty from './MEmpty.vue';
withDefaults(defineProps<MTimelineProps>(), { headingTag: 'h3' });
defineSlots<Record<string, ((props: { item: MTimelineItem }) => unknown) | undefined>>();
const statuses: Record<MTimelineStatus, string> = { neutral: '记录', pending: '等待', active: '进行中', success: '已完成', error: '异常' };
</script>

<template>
  <section class="ui-timeline" :aria-label="label">
    <MEmpty v-if="!items.length" title="暂无记录" description="新的进展会按顺序记录在这里。" />
    <ol v-else class="ui-timeline__list">
      <li v-for="(item, index) in items" :key="item.value" class="ui-timeline__item" :data-status="item.status || 'neutral'">
        <span class="ui-timeline__node" aria-hidden="true"><svg v-if="item.status === 'success'" viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" stroke-width="1.5" /></svg><svg v-else-if="item.status === 'error'" viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.5" /></svg><span v-else class="ui-timeline__dot"></span></span>
        <article class="ui-timeline__entry">
          <header class="ui-timeline__heading"><component :is="headingTag" class="ui-timeline__title">{{ item.title }}</component><time v-if="item.time" class="ui-timeline__time" :datetime="item.datetime">{{ item.time }}</time></header>
          <span class="ui-timeline__state">{{ statuses[item.status || 'neutral'] }}</span>
          <p v-if="item.description" class="ui-timeline__description">{{ item.description }}</p>
          <div v-if="$slots[item.value] || $slots.default" class="ui-timeline__content"><slot :name="item.value" :item="item"><slot :item="item" /></slot></div>
          <span class="ui-timeline__index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
        </article>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.ui-timeline { min-width: 0; color: var(--ui-color-text); font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-timeline__list { list-style: none; margin: 0; padding: 0; }
.ui-timeline__item { --ui-timeline-color: var(--ui-color-metal); position: relative; display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 20px; padding-bottom: 24px; }
.ui-timeline__item::before { content: ''; position: absolute; left: 11px; top: 24px; bottom: 0; border-left: 1px solid var(--ui-color-rule); }
.ui-timeline__item:last-child { padding-bottom: 0; } .ui-timeline__item:last-child::before { display: none; }
.ui-timeline__item[data-status='active'] { --ui-timeline-color: var(--ui-color-info); }
.ui-timeline__item[data-status='success'] { --ui-timeline-color: var(--ui-color-success); }
.ui-timeline__item[data-status='error'] { --ui-timeline-color: var(--ui-color-danger); }
.ui-timeline__node { box-sizing: border-box; display: grid; place-items: center; width: 24px; height: 24px; margin-top: 1px; border: 1px solid var(--ui-timeline-color); background: var(--ui-color-canvas); color: var(--ui-timeline-color); }
.ui-timeline__dot { width: 5px; height: 5px; background: currentColor; transform: rotate(45deg); }
.ui-timeline__item[data-status='pending'] .ui-timeline__dot { background: transparent; border: 1px solid currentColor; }
.ui-timeline__item[data-status='active'] .ui-timeline__node { box-shadow: inset 3px 0 var(--ui-timeline-color); animation: ui-timeline-seat var(--ui-motion-duration-layout) var(--ui-motion-ease-emphasized); }
.ui-timeline__entry { position: relative; min-width: 0; padding: 0 22px 18px 0; border-bottom: 1px solid var(--ui-color-rule); }
.ui-timeline__item:last-child .ui-timeline__entry { border-bottom: 0; }
.ui-timeline__heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 20px; }
.ui-timeline__title { margin: 0; min-width: 0; overflow-wrap: anywhere; font: var(--ui-font-weight-emphasis) var(--ui-font-size-heading)/1.5 var(--ui-font-family-display); }
.ui-timeline__time { min-width: 0; overflow-wrap: anywhere; color: var(--ui-color-text-secondary); font: 10px/1.8 var(--ui-font-family-mono); font-variant-numeric: tabular-nums; }
.ui-timeline__state { display: inline-block; margin-top: 6px; color: var(--ui-timeline-color); font-size: 11px; }
.ui-timeline__description { margin: 8px 0 0; color: var(--ui-color-text-secondary); line-height: 1.8; overflow-wrap: anywhere; }
.ui-timeline__content { margin-top: 14px; overflow-wrap: anywhere; }
.ui-timeline__index { position: absolute; right: 0; bottom: 18px; color: var(--ui-color-metal); font: 9px/1 var(--ui-font-family-mono); opacity: .6; pointer-events: none; }
@keyframes ui-timeline-seat { from { opacity: .4; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
:global([data-ui-motion='reduced'] .ui-timeline__item[data-status='active'] .ui-timeline__node) { animation: none; }
@media (prefers-reduced-motion: reduce) { .ui-timeline__item[data-status='active'] .ui-timeline__node { animation: none; } }
@media (max-width: 480px) { .ui-timeline__item { gap: 14px; } }
@media (forced-colors: active) { .ui-timeline__node { color: CanvasText; border-color: CanvasText; } .ui-timeline__dot { forced-color-adjust: none; background: CanvasText; } .ui-timeline__state { color: CanvasText; } }
</style>
