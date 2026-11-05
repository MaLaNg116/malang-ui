import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { InjectionKey, Ref } from 'vue';
import type { MLayoutResponsive, MLayoutTarget } from './types';

export const gridContext: InjectionKey<{ width: Ref<number>; columns: Ref<number> }> = Symbol('malang-grid');
export const floatGroupContext: InjectionKey<boolean> = Symbol('malang-float-group');
const breakpoints = [['xs', 0], ['sm', 576], ['md', 768], ['lg', 992], ['xl', 1200]] as const;
export function responsive<T>(value: MLayoutResponsive<T> | undefined, width: number, fallback: T): T {
  if (value === undefined) return fallback;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value as T;
  let result = fallback;
  for (const [key, minimum] of breakpoints) if (width >= minimum && key in value) result = (value as Partial<Record<string, T>>)[key]!;
  return result;
}
export const bounded = (value: number | undefined, minimum: number, maximum: number, fallback: number) => Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value!)) : fallback;
export const length = (value: number | string | undefined, fallback = 0) => typeof value === 'string' ? value : `${bounded(value, 0, 100000, fallback)}px`;
export function browserOf(element?: Element) { return element?.ownerDocument.defaultView as (Window & typeof globalThis) | null | undefined; }
export function useViewport(host: Ref<HTMLElement | undefined>) {
  const width = ref(0); let browser: ReturnType<typeof browserOf>;
  const measure = () => { width.value = browser?.innerWidth ?? 0; };
  onMounted(() => { browser = browserOf(host.value); measure(); browser?.addEventListener('resize', measure, { passive: true }); });
  onBeforeUnmount(() => browser?.removeEventListener('resize', measure)); return width;
}
export function useReduced(host: Ref<HTMLElement | undefined>) {
  const system = ref(false), local = ref(false); let media: MediaQueryList | undefined, observer: MutationObserver | undefined;
  const update = () => { system.value = media?.matches ?? false; local.value = !!host.value?.closest('[data-ui-motion="reduced"]'); };
  onMounted(() => { const browser = browserOf(host.value); media = browser?.matchMedia('(prefers-reduced-motion: reduce)'); media?.addEventListener('change', update);
    if (browser) { observer = new browser.MutationObserver(update); for (let node: HTMLElement | null = host.value ?? null; node; node = node.parentElement) observer.observe(node, { attributes: true, attributeFilter: ['data-ui-motion'] }); } update(); });
  onBeforeUnmount(() => { media?.removeEventListener('change', update); observer?.disconnect(); }); return computed(() => system.value || local.value);
}
export function resolveScroll(target: MLayoutTarget | undefined, host?: HTMLElement): HTMLElement | Window | null {
  const document = host?.ownerDocument; if (!document) return null;
  if (target === undefined) return document.defaultView;
  let result: HTMLElement | Window | null; try { result = typeof target === 'function' ? target() : typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target; } catch { result = null; }
  return result ?? null;
}
export function scrollMetrics(target: HTMLElement | Window) {
  if ('window' in target) return { top: target.scrollY, left: target.scrollX, height: target.innerHeight, origin: 0 };
  return { top: target.scrollTop, left: target.scrollLeft, height: target.clientHeight, origin: target.getBoundingClientRect().top + target.clientTop };
}
export function keyIntent(event: KeyboardEvent) { return !event.isComposing && event.keyCode !== 229 && !event.altKey && !event.ctrlKey && !event.metaKey; }
