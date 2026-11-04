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
  background: linear-gradient(var(--ui-skeleton-pixel), var(--ui-skeleton-pixel)) 13% 22% / 18px 2px no-repeat,
    linear-gradient(var(--ui-skeleton-echo), var(--ui-skeleton-echo)) 64% 48% / 9px 1px no-repeat,
    linear-gradient(var(--ui-skeleton-pixel), var(--ui-skeleton-pixel)) 84% 78% / 26px 2px no-repeat,
    linear-gradient(var(--ui-skeleton-echo), var(--ui-skeleton-echo)) 37% 67% / 4px 3px no-repeat;
  clip-path: inset(18% 0 73%); opacity: 0;
  animation: ui-skeleton-fragments 4700ms linear infinite; animation-delay: calc(var(--ui-skeleton-phase) * -630ms);
}
@keyframes ui-skeleton-grain {
  0%, 100% { background-position: calc(var(--ui-skeleton-phase) * -37px) calc(var(--ui-skeleton-phase) * -19px); }
  31% { background-position: calc(var(--ui-skeleton-phase) * -37px + 3px) calc(var(--ui-skeleton-phase) * -19px - 1px); }
  61% { background-position: calc(var(--ui-skeleton-phase) * -37px - 2px) calc(var(--ui-skeleton-phase) * -19px + 2px); }
  83% { background-position: calc(var(--ui-skeleton-phase) * -37px + 1px) calc(var(--ui-skeleton-phase) * -19px - 2px); }
}
/* Three small local cuts interrupt the quiet field; the whole bar never flashes. */
@keyframes ui-skeleton-fragments {
  0%, 16% { opacity: 0; transform: translateX(0); clip-path: inset(18% 0 73%); }
  17% { opacity: .52; transform: translateX(2px); clip-path: inset(18% 0 73%); }
  22% { opacity: 0; transform: translateX(0); clip-path: inset(18% 0 73%); }
  55% { opacity: 0; transform: translateX(0); clip-path: inset(44% 0 47%); }
  56% { opacity: .42; transform: translateX(-2px); clip-path: inset(44% 0 47%); }
  59% { opacity: 0; transform: translateX(0); clip-path: inset(44% 0 47%); }
  83% { opacity: 0; transform: translateX(0); clip-path: inset(74% 0 16%); }
  84% { opacity: .45; transform: translateX(1px); clip-path: inset(74% 0 16%); }
  88%, 100% { opacity: 0; transform: translateX(0); clip-path: inset(74% 0 16%); }
}
:global([data-ui-motion='reduced'] .ui-skeleton__line::before), :global([data-ui-motion='reduced'] .ui-skeleton__line::after) { animation: none; transform: none; }
:global([data-ui-motion='reduced'] .ui-skeleton__line::after) { opacity: .23; clip-path: none; }
@media (prefers-reduced-motion: reduce) { .ui-skeleton__line::before, .ui-skeleton__line::after { animation: none; transform: none; } .ui-skeleton__line::after { opacity: .23; clip-path: none; } }
@media (forced-colors: active) {
  .ui-skeleton__line { forced-color-adjust: none; border: 1px solid GrayText; background: Canvas; }
  .ui-skeleton__line::before { forced-color-adjust: none; opacity: .1; animation: none; }
  .ui-skeleton__line::after { forced-color-adjust: none; background: linear-gradient(GrayText, GrayText) 13% 22% / 18px 2px no-repeat, linear-gradient(GrayText, GrayText) 84% 78% / 26px 2px no-repeat; opacity: .25; animation: none; transform: none; clip-path: none; }
}
</style>
