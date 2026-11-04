<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watchEffect } from 'vue';
import { useReducedMotion } from '../composables/useReducedMotion';
import type { MBackTopProps } from './types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MBackTopProps>(), { visibilityHeight: 400, label: '返回顶部', behavior: 'smooth' });
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const attrs = useAttrs();
const host = ref<HTMLElement>();
const mounted = ref(false), aboveThreshold = ref(false), focused = ref(false);
const reducedMotion = useReducedMotion();
let browser: Window | null = null;
let scrollTarget: HTMLElement | Window | null = null;
const shown = computed(() => aboveThreshold.value || focused.value);
const threshold = computed(() => Number.isFinite(props.visibilityHeight) && props.visibilityHeight >= 0 ? props.visibilityHeight : 400);

function position(target: HTMLElement | Window) { return target === browser ? (target as Window).scrollY : (target as HTMLElement).scrollTop; }
const stopTargetWatch = watchEffect(onCleanup => {
  if (!mounted.value || !browser) return;
  // An explicitly unresolved getter stays inactive instead of taking over the page.
  const target = props.target === undefined ? browser : typeof props.target === 'function' ? props.target() : props.target;
  const visibilityHeight = threshold.value;
  scrollTarget = target ?? null;
  const read = () => { aboveThreshold.value = Boolean(target && position(target) >= visibilityHeight); };
  read();
  target?.addEventListener('scroll', read, { passive: true });
  if (target) browser.addEventListener('resize', read, { passive: true });
  const ownerWindow = browser;
  onCleanup(() => {
    target?.removeEventListener('scroll', read);
    if (target) ownerWindow.removeEventListener('resize', read);
    if (scrollTarget === target) scrollTarget = null;
  });
});

function backToTop(event: MouseEvent) {
  const reduce = reducedMotion.value || Boolean(host.value?.closest('[data-ui-motion="reduced"]'));
  // instant also overrides scroll-behavior:smooth authored on the scroll container.
  scrollTarget?.scrollTo({ top: 0, behavior: reduce ? 'instant' : props.behavior });
  emit('click', event);
}
onMounted(() => { browser = host.value?.ownerDocument.defaultView ?? null; mounted.value = true; });
onBeforeUnmount(() => { stopTargetWatch(); scrollTarget = null; browser = null; });
</script>

<template>
  <span ref="host" class="ui-backtop-host">
    <button v-if="shown" v-bind="attrs" class="ui-backtop" type="button" :aria-label="label" @focus="focused = true" @blur="focused = false" @click="backToTop">
      <span class="ui-backtop__glyph" aria-hidden="true"><slot><svg width="22" height="22" viewBox="0 0 24 24" fill="none" focusable="false"><path d="m6 10 6-5 6 5M12 5v14M6 19h12M3 3h4m10 0h4" /></svg></slot></span>
    </button>
  </span>
</template>

<style scoped>
.ui-backtop-host { display: contents; }
.ui-backtop {
  position: fixed; right: max(20px, env(safe-area-inset-right)); bottom: max(20px, env(safe-area-inset-bottom)); z-index: 20;
  box-sizing: border-box; isolation: isolate; display: inline-grid; place-items: center; flex: none;
  width: 44px; height: 44px; min-width: 44px; min-height: 44px; margin: 0; padding: 0;
  border: 1px solid transparent; border-radius: 0; background: transparent; color: var(--ui-color-secondary-accent);
  font: var(--ui-font-size-caption)/1 var(--ui-font-family); cursor: pointer;
  transition: color var(--ui-motion-duration-transition) var(--ui-motion-ease-standard);
}
.ui-backtop::before, .ui-backtop::after { content: ''; position: absolute; pointer-events: none; clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px)); }
.ui-backtop::before { inset: -1px; z-index: -2; background: var(--ui-color-border); }
.ui-backtop::after { inset: 0; z-index: -1; background: var(--ui-color-surface-raised); }
.ui-backtop:hover { color: var(--ui-color-accent); }
.ui-backtop:hover::before { background: var(--ui-color-accent); }
.ui-backtop:focus-visible { outline: var(--ui-focus-width) solid var(--ui-color-focus); outline-offset: var(--ui-focus-offset); }
.ui-backtop__glyph { display: inline-grid; place-items: center; min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
.ui-backtop__glyph svg { display: block; stroke: currentColor; stroke-width: 1.25; stroke-linecap: square; stroke-linejoin: miter; }
:global([data-ui-motion='reduced'] .ui-backtop) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-backtop { transition: none; } }
@media (forced-colors: active) { .ui-backtop { color: ButtonText; } .ui-backtop::before { background: ButtonText; } .ui-backtop::after { background: ButtonFace; } .ui-backtop:focus-visible { outline-color: Highlight; } }
</style>
