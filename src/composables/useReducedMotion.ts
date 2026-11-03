import { onMounted, onScopeDispose, readonly, ref } from 'vue';

/** Read the system motion preference after mount and release its subscription. */
export function useReducedMotion(initialValue = false) {
  const reducedMotion = ref(initialValue);
  let query: MediaQueryList | undefined;
  const update = (event: MediaQueryListEvent) => { reducedMotion.value = event.matches; };

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    query = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.value = query.matches;
    query.addEventListener('change', update);
  });

  onScopeDispose(() => query?.removeEventListener('change', update));
  return readonly(reducedMotion);
}
