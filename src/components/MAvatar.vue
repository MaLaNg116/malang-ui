<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { MAvatarProps } from './types';
const props = withDefaults(defineProps<MAvatarProps>(), { size: 'md', tone: 'ink' });
const loaded = ref(false); const failed = ref(false);
watch(() => props.src, () => { loaded.value = false; failed.value = false; });
const initials = computed(() => {
  const source = (props.name || props.alt).trim();
  if (!source) return 'M';
  const segments = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(source)].map(part => part.segment) : Array.from(source);
  return segments.slice(0, 2).join('').toLocaleUpperCase();
});
function imageLoaded(event: Event) { if ((event.target as HTMLImageElement).isConnected) loaded.value = true; }
function imageFailed(event: Event) { if ((event.target as HTMLImageElement).isConnected) { failed.value = true; loaded.value = false; } }
</script>

<template>
  <span class="ui-avatar" :data-size="size" :data-tone="tone" :role="alt ? 'img' : undefined" :aria-label="alt || undefined" :aria-hidden="alt ? undefined : true">
    <span v-show="!loaded" class="ui-avatar__initials" aria-hidden="true">{{ initials }}</span>
    <img v-if="src && !failed" :key="src" class="ui-avatar__image" :class="{ 'ui-avatar__image--loaded': loaded }" :src="src" alt="" aria-hidden="true" decoding="async" @load="imageLoaded" @error="imageFailed" />
    <span class="ui-avatar__cut" aria-hidden="true"></span>
  </span>
</template>

<style scoped>
.ui-avatar { --ui-avatar-size: 44px; --ui-avatar-color: var(--ui-color-metal); box-sizing: border-box; position: relative; display: inline-grid; place-items: center; width: var(--ui-avatar-size); height: var(--ui-avatar-size); flex: none; vertical-align: middle; isolation: isolate; color: var(--ui-color-text); font: 500 17px/1 var(--ui-font-family-display); }
.ui-avatar[data-size='sm'] { --ui-avatar-size: 30px; font-size: 12px; } .ui-avatar[data-size='lg'] { --ui-avatar-size: 64px; font-size: 24px; }
.ui-avatar[data-tone='seal'] { --ui-avatar-color: var(--ui-color-accent); color: var(--ui-color-accent); }
.ui-avatar[data-tone='jade'] { --ui-avatar-color: var(--ui-color-secondary-accent); color: var(--ui-color-secondary-accent); }
.ui-avatar::before, .ui-avatar::after { content: ''; position: absolute; z-index: -1; pointer-events: none; clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px); }
.ui-avatar::before { inset: 0; background: var(--ui-avatar-color); }
.ui-avatar::after { inset: 1px; background: color-mix(in srgb, var(--ui-avatar-color) 9%, var(--ui-color-surface)); }
.ui-avatar__initials { box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden; white-space: nowrap; padding: 4px; }
.ui-avatar[data-size='sm'] .ui-avatar__initials { padding-inline: 2px; }
.ui-avatar__image { box-sizing: border-box; position: absolute; inset: 3px; width: calc(100% - 6px); height: calc(100% - 6px); object-fit: cover; opacity: 0; clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px); }
.ui-avatar__image--loaded { opacity: 1; }
.ui-avatar__cut { position: absolute; top: 1px; right: 3px; width: 8px; height: 2px; background: var(--ui-avatar-color); pointer-events: none; }
@media (forced-colors: active) { .ui-avatar { border: 1px solid CanvasText; color: CanvasText; } .ui-avatar::before, .ui-avatar::after, .ui-avatar__cut { display: none; } }
</style>
