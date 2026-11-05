import { createVNode, nextTick, render, type AppContext, type Directive } from 'vue';
import MLoading from './MLoading.vue';

export interface MLoadingOptions { target?: HTMLElement; text?: string; fullscreen?: boolean; cancelable?: boolean; onCancel?: () => void; appContext?: AppContext }
export interface MLoadingHandle { close(): void; setText(text?: string): void }
interface LoadingLayer { mount: HTMLElement; draw(active: boolean): void }
interface LoadingHost { count: number; position: string; busy: string | null; children: Map<HTMLElement, boolean>; observer?: MutationObserver; focus?: HTMLElement; mounts: LoadingLayer[] }
const hosts = new WeakMap<HTMLElement, LoadingHost>();
const ssrBusyMarker = 'data-ui-loading-ssr-busy';
/** Mounts only inside the requested target and restores the attributes it owns. */
export function createMLoading(options: MLoadingOptions = {}): MLoadingHandle {
  const doc = options.target?.ownerDocument ?? (typeof document !== 'undefined' ? document : undefined);
  if (!doc) return { close() {}, setText() {} };
  const target = options.target ?? doc.body;
  const fullscreen = options.fullscreen ?? !options.target;
  const active = doc.activeElement as HTMLElement | null;
  const previousFocus = active && active !== doc.body && typeof active.focus === 'function' ? active : undefined;
  const ownedFocus = !!active && target.contains(active);
  const state: LoadingHost = hosts.get(target) ?? { count: 0, position: target.style.position, busy: target.getAttribute('aria-busy'), children: new Map(), focus: previousFocus, mounts: [] };
  if (state.count++ === 0) {
    if (doc.defaultView?.getComputedStyle(target).position === 'static') target.style.position = 'relative'; target.setAttribute('aria-busy', 'true'); hosts.set(target, state);
    const lock = () => { for (const child of Array.from(target.children)) { if (!doc.defaultView || !(child instanceof doc.defaultView.HTMLElement) || child.classList.contains('ui-loading-service')) continue; if (!state.children.has(child)) state.children.set(child, child.inert); child.inert = true; } };
    lock();
    if (doc.defaultView?.MutationObserver) { state.observer = new doc.defaultView.MutationObserver(lock); state.observer.observe(target, { childList: true }); }
  }
  const mount = doc.createElement('div'); mount.className = 'ui-loading-service'; mount.style.cssText = 'position:absolute;inset:0;z-index:20;'; target.append(mount);
  let alive = true, text = options.text;
  const layer: LoadingLayer = { mount, draw: visible => {
    const node = createVNode(MLoading, { modelValue: visible, text, fullscreen, cancelable: options.cancelable, onCancel: () => { if (alive && state.mounts.at(-1) === layer) options.onCancel?.(); }, style: 'height:100%;min-height:56px' });
    if (options.appContext) node.appContext = options.appContext; render(node, mount);
  } };
  function syncLayers() {
    const top = state.mounts.at(-1);
    for (const entry of state.mounts) {
      const visible = entry === top;
      entry.mount.inert = !visible;
      // A native modal escapes its ancestor's inertness. Suspend its own
      // dialog as well, before Vue closes it, when a later local layer wins.
      for (const dialog of entry.mount.querySelectorAll('dialog')) dialog.inert = !visible;
      entry.draw(visible);
    }
  }
  function focusLayer(entry: LoadingLayer | undefined) {
    if (!entry || !entry.mount.isConnected || entry !== state.mounts.at(-1)) return;
    const surface = entry.mount.querySelector<HTMLElement>('dialog[open]') ?? entry.mount.querySelector<HTMLElement>('.ui-loading__mask');
    surface?.focus({ preventScroll: true });
  }
  state.mounts.push(layer); syncLayers();
  if (ownedFocus) void nextTick(() => { if (alive && (doc.activeElement === doc.body || state.mounts.some(entry => entry.mount.contains(doc.activeElement)))) focusLayer(layer); });
  return {
    close() {
      if (!alive) return; const restore = mount.contains(doc.activeElement) || doc.activeElement === doc.body; alive = false; render(null, mount); mount.remove();
      state.mounts = state.mounts.filter(item => item !== layer);
      if (--state.count === 0) {
        state.observer?.disconnect(); for (const [child, wasInert] of state.children) { if (child.inert) child.inert = wasInert; }
        if (target.style.position === 'relative') target.style.position = state.position;
        if (target.getAttribute('aria-busy') === 'true') { if (state.busy === null) target.removeAttribute('aria-busy'); else target.setAttribute('aria-busy', state.busy); } hosts.delete(target);
        if (restore && state.focus?.isConnected && !state.focus.closest('[inert]')) state.focus.focus({ preventScroll: true });
      } else {
        syncLayers();
        if (restore) void nextTick(() => { if (doc.activeElement === doc.body || state.mounts.some(entry => entry.mount.contains(doc.activeElement))) focusLayer(state.mounts.at(-1)); });
      }
    },
    setText(value) { if (alive) { text = value; layer.draw(state.mounts.at(-1) === layer); } },
  };
}
const handles = new WeakMap<HTMLElement, MLoadingHandle>();
function restoreSSRBusy(element: HTMLElement, props: Record<string, unknown> | null) {
  if (!element.hasAttribute(ssrBusyMarker)) return;
  element.removeAttribute(ssrBusyMarker);
  if (element.getAttribute('aria-busy') !== 'true') return;
  const original = props?.['aria-busy'];
  if (original === undefined || original === null) element.removeAttribute('aria-busy'); else element.setAttribute('aria-busy', String(original));
}
export const vMLoading: Directive<HTMLElement, boolean | { loading: boolean; text?: string }> = {
  created(element, _binding, vnode) { restoreSSRBusy(element, vnode.props); },
  mounted(element, binding, vnode) {
    restoreSSRBusy(element, vnode.props);
    if (typeof binding.value === 'boolean' ? binding.value : binding.value.loading) handles.set(element, createMLoading({ target: element, text: typeof binding.value === 'object' ? binding.value.text : undefined, appContext: binding.instance?.$?.appContext }));
  },
  updated(element, binding) {
    const active = typeof binding.value === 'boolean' ? binding.value : binding.value.loading, text = typeof binding.value === 'object' ? binding.value.text : undefined;
    if (!active) { handles.get(element)?.close(); handles.delete(element); }
    else if (handles.has(element)) handles.get(element)!.setText(text);
    else handles.set(element, createMLoading({ target: element, text, appContext: binding.instance?.$?.appContext }));
  },
  beforeUnmount(element) { handles.get(element)?.close(); handles.delete(element); },
  getSSRProps(binding) { return (typeof binding.value === 'boolean' ? binding.value : binding.value.loading) ? { 'aria-busy': 'true', [ssrBusyMarker]: '' } : {}; },
};
