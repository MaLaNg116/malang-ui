<script setup lang="ts">
import { computed } from 'vue';
import type { MSkeletonProps } from './types';

const props = withDefaults(defineProps<MSkeletonProps>(), { lines: 3 });
const count = computed(() => Math.min(12, Math.max(1, Math.floor(Number.isFinite(props.lines) ? props.lines : 3))));
</script>

<template>
  <div class="ui-skeleton" aria-hidden="true">
    <span v-for="line in count" :key="line" class="ui-skeleton__line" :style="{ '--ui-skeleton-phase': line % 4 }" />
  </div>
</template>

<style scoped>
.ui-skeleton {
  --ui-skeleton-ground: color-mix(in srgb, var(--ui-color-surface-muted, var(--ui-color-wash)) 78%, var(--ui-color-surface));
  --ui-skeleton-pixel: color-mix(in srgb, var(--ui-color-metal) 45%, transparent);
  --ui-skeleton-echo: color-mix(in srgb, var(--ui-color-secondary-accent) 32%, transparent);
  display: grid; gap: var(--ui-space-3); min-width: 0; width: 100%;
}
.ui-skeleton__line {
  box-sizing: border-box; isolation: isolate; position: relative; display: block;
  width: 100%; height: var(--ui-skeleton-line-height, var(--ui-font-size-body)); overflow: hidden;
  background: var(--ui-skeleton-ground);
  clip-path: polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px));
}
.ui-skeleton__line:nth-child(3n + 2) { width: 86%; }
.ui-skeleton__line:last-child:not(:first-child) { width: 68%; }
.ui-skeleton__line::before, .ui-skeleton__line::after { content: ''; position: absolute; inset: 0; pointer-events: none; }
.ui-skeleton__line::before {
  /* Fixed SVG noise is code-only, deterministic and larger than the media tile. */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1024' height='512'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.84' numOctaves='3' seed='17' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Cpath d='M0 0h1024v512H0z' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 1024px 512px; background-repeat: no-repeat; background-position: calc(var(--ui-skeleton-phase) * -37px) calc(var(--ui-skeleton-phase) * -19px);
  opacity: .16; animation: ui-skeleton-grain 6400ms linear infinite; animation-delay: calc(var(--ui-skeleton-phase) * -410ms);
}
.ui-skeleton__line::after {
  background: linear-gradient(var(--ui-skeleton-pixel), var(--ui-skeleton-pixel)) 13% 22% / 18px 1px no-repeat,
    linear-gradient(var(--ui-skeleton-echo), var(--ui-skeleton-echo)) 64% 48% / 9px 1px no-repeat,
    linear-gradient(var(--ui-skeleton-pixel), var(--ui-skeleton-pixel)) 84% 78% / 22px 1px no-repeat,
    linear-gradient(var(--ui-skeleton-echo), var(--ui-skeleton-echo)) 37% 67% / 12px 1px no-repeat;
  opacity: .1;
  animation: ui-skeleton-fragments 6800ms cubic-bezier(.45, 0, .55, 1) infinite; animation-delay: calc(var(--ui-skeleton-phase) * -630ms);
}
@keyframes ui-skeleton-grain {
  0%, 100% { background-position: calc(var(--ui-skeleton-phase) * -37px) calc(var(--ui-skeleton-phase) * -19px); }
  31% { background-position: calc(var(--ui-skeleton-phase) * -37px + 3px) calc(var(--ui-skeleton-phase) * -19px - 1px); }
  61% { background-position: calc(var(--ui-skeleton-phase) * -37px - 2px) calc(var(--ui-skeleton-phase) * -19px + 2px); }
  83% { background-position: calc(var(--ui-skeleton-phase) * -37px + 1px) calc(var(--ui-skeleton-phase) * -19px - 2px); }
}
/* Sparse horizontal echoes emerge gently above the unchanged snow texture. */
@keyframes ui-skeleton-fragments {
  0%, 100% { opacity: .1; transform: translateX(0); }
  22% { opacity: .22; transform: translateX(1px); }
  47% { opacity: .09; transform: translateX(0); }
  73% { opacity: .2; transform: translateX(-1px); }
  90% { opacity: .12; transform: translateX(0); }
}
:global([data-ui-motion='reduced'] .ui-skeleton__line::before), :global([data-ui-motion='reduced'] .ui-skeleton__line::after) { animation: none; transform: none; }
:global([data-ui-motion='reduced'] .ui-skeleton__line::after) { opacity: .14; }
@media (prefers-reduced-motion: reduce) { .ui-skeleton__line::before, .ui-skeleton__line::after { animation: none; transform: none; } .ui-skeleton__line::after { opacity: .14; } }
@media (forced-colors: active) {
  .ui-skeleton__line { forced-color-adjust: none; border: 1px solid GrayText; background: Canvas; }
  .ui-skeleton__line::before { forced-color-adjust: none; opacity: .1; animation: none; }
  .ui-skeleton__line::after { forced-color-adjust: none; background: linear-gradient(GrayText, GrayText) 13% 22% / 18px 2px no-repeat, linear-gradient(GrayText, GrayText) 84% 78% / 26px 2px no-repeat; opacity: .25; animation: none; transform: none; clip-path: none; }
}
</style>
