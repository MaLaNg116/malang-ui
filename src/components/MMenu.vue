<script lang="ts">
import { computed, defineComponent, h, mergeProps, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, useId } from 'vue';
import type { PropType, VNode } from 'vue';
import type { MMenuProps, MMenuItem } from './types';
import { navigationHierarchy } from './navigationHierarchy';
import type { HierarchyEntry } from './navigationHierarchy';

type Entry = HierarchyEntry<MMenuItem>;
export default defineComponent({
  name: 'MMenu', inheritAttrs: false,
  props: {
    modelValue: { type: [String, null] as PropType<string | null>, required: true },
    items: { type: Array as PropType<MMenuProps['items']>, required: true },
    expandedValues: { type: Array as PropType<MMenuProps['expandedValues']>, required: true },
    label: { type: String, required: true }, id: String, disabled: { type: Boolean, default: false },
  },
  emits: { 'update:modelValue': (_value: string) => true, 'update:expandedValues': (_values: string[]) => true, select: (_value: string, _event: MouseEvent) => true },
  setup(props, { attrs, emit }) {
    const root = ref<HTMLElement>();
    const identity = `ui-menu-${useId()}`;
    const rootId = computed(() => props.id || identity);
    const hierarchy = computed(() => navigationHierarchy(props.items));
    const expanded = computed(() => new Set(props.expandedValues.filter(value => hierarchy.value.all.some(entry => entry.item.value === value && entry.children.length))));
    const visible = computed(() => hierarchy.value.all.filter(entry => entry.ancestors.every(value => expanded.value.has(value))));
    const controls = new Map<string, HTMLElement>();
    const ids = new Map<string, number>(); let nextId = 0;
    const id = (value: string) => { if (!ids.has(value)) ids.set(value, nextId++); return `${rootId.value}-group-${ids.get(value)}`; };
    const unavailable = (entry: Entry) => props.disabled || Boolean(entry.item.disabled);
    let previous: Entry[] = [];
    let pending: { value?: string; ancestors: string[]; index: number } | undefined;
    function remember() {
      const active = root.value?.ownerDocument.activeElement;
      if (!active || !root.value?.contains(active)) { pending = undefined; return; }
      const value = [...controls].find(([, element]) => element === active)?.[0];
      const index = previous.findIndex(entry => entry.item.value === value);
      pending = { value, ancestors: previous[index]?.ancestors ?? [], index };
    }
    function repair() {
      const saved = pending; pending = undefined;
      const element = root.value, document = element?.ownerDocument;
      if (saved && element && document) {
        const active = document.activeElement;
        const eligible = visible.value.filter(entry => !unavailable(entry));
        const retained = eligible.find(entry => entry.item.value === saved.value);
        const activeControl = eligible.some(entry => controls.get(entry.item.value) === active);
        if (!activeControl && (!active || active === document.body || active === document.documentElement || element.contains(active))) {
          const ancestor = [...saved.ancestors].reverse().find(value => eligible.some(entry => entry.item.value === value));
          const target = retained?.item.value ?? ancestor ?? eligible[Math.min(Math.max(0, saved.index), eligible.length - 1)]?.item.value;
          (target ? controls.get(target) : element)?.focus({ preventScroll: true });
        }
      }
      previous = [...visible.value];
    }
    function toggle(entry: Entry) {
      if (unavailable(entry) || !entry.children.length) return;
      const next = new Set(expanded.value);
      if (next.has(entry.item.value)) next.delete(entry.item.value); else next.add(entry.item.value);
      emit('update:expandedValues', [...next]);
    }
    function select(entry: Entry, event: MouseEvent) {
      if (unavailable(entry)) { event.preventDefault(); return; }
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      emit('select', entry.item.value, event);
      if (entry.item.value !== props.modelValue) emit('update:modelValue', entry.item.value);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const value = [...controls].find(([, element]) => element === event.target)?.[0];
      const entry = hierarchy.value.all.find(candidate => candidate.item.value === value);
      if (!entry) return;
      const target = [entry.item.value, ...[...entry.ancestors].reverse()].find(value => expanded.value.has(value) && !unavailable(hierarchy.value.all.find(candidate => candidate.item.value === value)!));
      if (target) { event.preventDefault(); event.stopPropagation(); toggle(hierarchy.value.all.find(candidate => candidate.item.value === target)!); }
    }
    function renderList(entries: Entry[], nested = false): VNode {
      return h('ul', { class: nested ? 'ui-menu__children' : 'ui-menu__list' }, entries.map(entry => {
        const item = entry.item, branch = entry.children.length > 0, open = expanded.value.has(item.value), disabled = unavailable(entry);
        const content = [h('span', { class: 'ui-menu__mark', 'aria-hidden': 'true' }), h('span', { class: 'ui-menu__label' }, item.label), branch ? h('span', { class: 'ui-menu__hinge', 'aria-hidden': 'true' }, '›') : h('span', { class: 'ui-menu__end', 'aria-hidden': 'true' }, '↗')];
        const common = {
          ref: (element: unknown) => { if (element) controls.set(item.value, element as HTMLElement); else controls.delete(item.value); },
          class: ['ui-menu__control', { 'ui-menu__control--current': !branch && props.modelValue === item.value }],
          'aria-label': item.label, 'aria-current': !branch && props.modelValue === item.value ? 'page' : undefined,
        };
        const control = branch
          ? h('button', { ...common, type: 'button', disabled, 'aria-expanded': open, 'aria-controls': id(item.value), onClick: () => toggle(entry) }, content)
          : item.href
            ? h('a', { ...common, href: disabled ? undefined : item.href, role: disabled ? 'link' : undefined, tabindex: disabled ? -1 : undefined, 'aria-disabled': disabled || undefined, onClick: (event: MouseEvent) => select(entry, event), onAuxclick: (event: MouseEvent) => { if (disabled) event.preventDefault(); } }, content)
            : h('button', { ...common, type: 'button', disabled, onClick: (event: MouseEvent) => select(entry, event) }, content);
        return h('li', { key: item.value, class: ['ui-menu__item', { 'ui-menu__item--open': open }] }, [control, branch ? h('div', { id: id(item.value), hidden: !open }, [renderList(entry.children, true)]) : null]);
      }));
    }
    onMounted(repair); onBeforeUpdate(remember); onUpdated(repair);
    onBeforeUnmount(() => { controls.clear(); ids.clear(); pending = undefined; });
    return () => h('nav', mergeProps(attrs, { ref: root, id: rootId.value, class: 'ui-menu', 'aria-label': props.label, 'aria-disabled': props.disabled || undefined, tabindex: -1, onKeydown: escape }), [
      h('div', { class: 'ui-menu__heading', 'aria-hidden': 'true' }, [h('span', { class: 'ui-menu__seal' }), props.label]),
      hierarchy.value.roots.length ? renderList(hierarchy.value.roots) : h('p', { class: 'ui-menu__empty' }, '暂无导航项目'),
    ]);
  },
});
</script>

<style scoped>
.ui-menu { box-sizing: border-box; min-width: 0; color: var(--ui-color-text); font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); border-block: 1px solid var(--ui-color-rule); }
.ui-menu *, .ui-menu *::before, .ui-menu *::after { box-sizing: border-box; }
.ui-menu__heading { display: flex; align-items: center; gap: 12px; padding: 18px 14px; color: var(--ui-color-text-secondary); font: 14px/1.5 var(--ui-font-family-display); letter-spacing: .08em; overflow-wrap: anywhere; }
.ui-menu__seal { flex: none; width: 7px; height: 16px; border: 1px solid var(--ui-color-accent); border-block-width: 3px; transform: skewY(-18deg); }
.ui-menu__list, .ui-menu__children { margin: 0; padding: 0; list-style: none; }
.ui-menu__list { padding-bottom: 8px; }
.ui-menu__children { margin-inline-start: 22px; padding-inline-start: 10px; border-inline-start: 1px solid var(--ui-color-rule); }
.ui-menu__item { min-width: 0; }
.ui-menu__item > div[hidden] { display: none; }
.ui-menu__control { position: relative; display: flex; align-items: center; gap: 12px; min-width: 0; width: 100%; min-height: 44px; margin: 0; padding: 12px 14px; border: 1px solid transparent; border-radius: 0; background: transparent; color: inherit; text-decoration: none; text-align: start; font: inherit; cursor: pointer; transition: background-color var(--ui-motion-duration-feedback), color var(--ui-motion-duration-feedback); }
.ui-menu__label { min-width: 0; flex: 1; overflow-wrap: anywhere; }
.ui-menu__mark { flex: none; width: 5px; height: 5px; border: 1px solid var(--ui-color-metal); transform: rotate(45deg); }
.ui-menu__hinge, .ui-menu__end { flex: none; color: var(--ui-color-metal); font: 18px/1 var(--ui-font-family-mono); }
.ui-menu__hinge { transition: transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-menu__end { font-size: 12px; opacity: 0; }
.ui-menu__item--open > .ui-menu__control .ui-menu__hinge { transform: rotate(90deg); color: var(--ui-color-secondary-accent); }
.ui-menu__control:hover:not(:disabled):not([aria-disabled='true']) { background: var(--ui-color-surface-raised); }
.ui-menu__control--current { color: var(--ui-color-accent); background: var(--ui-color-accent-soft); }
.ui-menu__control--current::before { content: ''; position: absolute; inset-inline-start: -1px; top: 9px; bottom: 9px; width: 3px; background: linear-gradient(var(--ui-color-accent) 0 42%, transparent 42% 58%, var(--ui-color-accent) 58%); }
.ui-menu__control--current .ui-menu__mark { background: var(--ui-color-accent); border-color: var(--ui-color-accent); }
.ui-menu__control--current .ui-menu__end { opacity: 1; color: var(--ui-color-accent); }
.ui-menu__control:focus-visible, .ui-menu:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -2px; }
.ui-menu__control:disabled, .ui-menu__control[aria-disabled='true'] { opacity: .45; cursor: not-allowed; }
.ui-menu__empty { margin: 0; padding: 20px 14px; color: var(--ui-color-text-secondary); }
:global([data-ui-motion='reduced'] .ui-menu__control), :global([data-ui-motion='reduced'] .ui-menu__hinge) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-menu__control, .ui-menu__hinge { transition: none; } }
@media (pointer: coarse) { .ui-menu__control { min-height: 44px; } }
@media (max-width: 480px) { .ui-menu__children { margin-inline-start: 14px; padding-inline-start: 6px; } }
@media (forced-colors: active) { .ui-menu__control--current { color: Highlight; border-color: Highlight; } .ui-menu__control--current::before { forced-color-adjust: none; background: Highlight; } .ui-menu__control:disabled, .ui-menu__control[aria-disabled='true'] { color: GrayText; opacity: 1; } .ui-menu__control:focus-visible, .ui-menu:focus-visible { outline-color: Highlight; } }
</style>
