<script lang="ts">
import { computed, defineComponent, h, mergeProps, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, useId } from 'vue';
import type { PropType, VNode } from 'vue';
import type { MTreeNode, MTreeProps } from './types';
import { navigationHierarchy } from './navigationHierarchy';
import type { HierarchyEntry } from './navigationHierarchy';

type Entry = HierarchyEntry<MTreeNode>;
export default defineComponent({
  name: 'MTree', inheritAttrs: false,
  props: {
    modelValue: { type: [String, null] as PropType<string | null>, required: true },
    items: { type: Array as PropType<MTreeProps['items']>, required: true },
    expandedValues: { type: Array as PropType<MTreeProps['expandedValues']>, required: true },
    label: { type: String, required: true }, id: String, disabled: { type: Boolean, default: false },
  },
  emits: { 'update:modelValue': (_value: string) => true, 'update:expandedValues': (_values: string[]) => true },
  setup(props, { attrs, emit }) {
    const root = ref<HTMLElement>(); const focused = ref<string>();
    const identity = `ui-tree-${useId()}`;
    const rootId = computed(() => props.id || identity);
    const hierarchy = computed(() => navigationHierarchy(props.items));
    const expanded = computed(() => new Set(props.expandedValues.filter(value => hierarchy.value.all.some(entry => entry.item.value === value && entry.children.length))));
    const visible = computed(() => hierarchy.value.all.filter(entry => entry.ancestors.every(value => expanded.value.has(value))));
    const controls = new Map<string, HTMLElement>(); const ids = new Map<string, number>(); let nextId = 0;
    const nodeId = (value: string) => { if (!ids.has(value)) ids.set(value, nextId++); return `${rootId.value}-node-${ids.get(value)}`; };
    const unavailable = (entry: Entry) => props.disabled || Boolean(entry.item.disabled);
    let previous: Entry[] = [];
    let pending: { value?: string; ancestors: string[]; index: number } | undefined;
    let search = '', searchTimer: ReturnType<typeof setTimeout> | undefined;
    function resetSearch() { search = ''; if (searchTimer !== undefined) clearTimeout(searchTimer); searchTimer = undefined; }
    function entryTarget() {
      const selected = hierarchy.value.all.find(entry => entry.item.value === props.modelValue);
      return visible.value.find(entry => entry.item.value === selected?.item.value)?.item.value
        ?? [...selected?.ancestors ?? []].reverse().find(value => visible.value.some(entry => entry.item.value === value))
        ?? visible.value[0]?.item.value;
    }
    const tabValue = computed(() => visible.value.some(entry => entry.item.value === focused.value) ? focused.value : entryTarget());
    function focus(value: string | undefined) {
      focused.value = value;
      const element = value ? controls.get(value) : root.value;
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }
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
        const activeControl = visible.value.some(entry => controls.get(entry.item.value) === active);
        if (!activeControl && (!active || active === document.body || active === document.documentElement || element.contains(active))) {
          const ancestor = [...saved.ancestors].reverse().find(value => visible.value.some(entry => entry.item.value === value));
          const retained = visible.value.find(entry => entry.item.value === saved.value)?.item.value;
          focus(retained ?? ancestor ?? visible.value[Math.min(Math.max(0, saved.index), visible.value.length - 1)]?.item.value);
        }
      }
      if (!visible.value.some(entry => entry.item.value === focused.value)) focused.value = entryTarget();
      previous = [...visible.value];
    }
    function toggle(entry: Entry) {
      if (unavailable(entry) || !entry.children.length) return;
      const next = new Set(expanded.value);
      if (next.has(entry.item.value)) next.delete(entry.item.value); else next.add(entry.item.value);
      emit('update:expandedValues', [...next]);
    }
    function select(entry: Entry) { if (!unavailable(entry) && entry.item.value !== props.modelValue) emit('update:modelValue', entry.item.value); }
    function keydown(entry: Entry, event: KeyboardEvent) {
      if (event.target !== event.currentTarget || event.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const index = visible.value.findIndex(candidate => candidate.item.value === entry.item.value);
      let target: string | undefined;
      if (event.key === 'ArrowDown') target = visible.value[Math.min(index + 1, visible.value.length - 1)]?.item.value;
      else if (event.key === 'ArrowUp') target = visible.value[Math.max(index - 1, 0)]?.item.value;
      else if (event.key === 'Home') target = visible.value[0]?.item.value;
      else if (event.key === 'End') target = visible.value.at(-1)?.item.value;
      else if (event.key === 'ArrowRight') {
        if (entry.children.length && !expanded.value.has(entry.item.value)) toggle(entry);
        else target = entry.children[0]?.item.value;
      } else if (event.key === 'ArrowLeft') {
        if (entry.children.length && expanded.value.has(entry.item.value)) toggle(entry);
        else target = entry.ancestors.at(-1);
      } else if (event.key === 'Enter' || event.key === ' ') select(entry);
      else if (event.key.length === 1) {
        const character = event.key.normalize('NFKC').toLocaleLowerCase();
        search += character;
        if (searchTimer !== undefined) clearTimeout(searchTimer);
        searchTimer = setTimeout(resetSearch, 700);
        const repeated = [...search].every(letter => letter === character), needle = repeated ? character : search;
        const start = repeated ? index + 1 : Math.max(0, index);
        const ordered = [...visible.value.slice(start), ...visible.value.slice(0, start)];
        target = ordered.find(candidate => candidate.item.label.trim().normalize('NFKC').toLocaleLowerCase().startsWith(needle))?.item.value;
        event.preventDefault(); if (target) focus(target); return;
      } else return;
      event.preventDefault(); resetSearch(); if (target) focus(target);
    }
    function renderNodes(entries: Entry[], nested = false): VNode {
      return h('ul', { role: nested ? 'group' : 'none', class: nested ? 'ui-tree__group' : 'ui-tree__list' }, entries.map(entry => {
        const item = entry.item, branch = entry.children.length > 0, open = expanded.value.has(item.value), disabled = unavailable(entry);
        return h('li', {
          key: item.value, id: nodeId(item.value), role: 'treeitem', class: 'ui-tree__item',
          ref: (element: unknown) => { if (element) controls.set(item.value, element as HTMLElement); else controls.delete(item.value); },
          tabindex: tabValue.value === item.value ? 0 : -1, 'aria-label': item.label, 'aria-selected': props.modelValue === item.value,
          'aria-expanded': branch ? open : undefined, 'aria-disabled': disabled || undefined,
          onFocus: (event: FocusEvent) => { if (event.target === event.currentTarget) focused.value = item.value; },
          onKeydown: (event: KeyboardEvent) => keydown(entry, event),
        }, [
          h('div', { class: 'ui-tree__row', onClick: (event: MouseEvent) => { event.stopPropagation(); focus(item.value); select(entry); } }, [
            h('span', { class: ['ui-tree__hinge', { 'ui-tree__hinge--leaf': !branch }], 'aria-hidden': 'true', onClick: (event: MouseEvent) => { if (branch) { event.stopPropagation(); focus(item.value); toggle(entry); } } }, branch ? '›' : '·'),
            h('span', { class: 'ui-tree__mark', 'aria-hidden': 'true' }), h('span', { class: 'ui-tree__label' }, item.label),
            h('span', { class: 'ui-tree__impression', 'aria-hidden': 'true' }, props.modelValue === item.value ? '定' : ''),
          ]),
          branch ? h('div', { hidden: !open }, [renderNodes(entry.children, true)]) : null,
        ]);
      }));
    }
    onMounted(repair); onBeforeUpdate(remember); onUpdated(repair);
    onBeforeUnmount(() => { resetSearch(); controls.clear(); ids.clear(); pending = undefined; });
    return () => h('div', mergeProps(attrs, { ref: root, id: rootId.value, role: 'tree', class: 'ui-tree', 'aria-label': props.label, 'aria-disabled': props.disabled || undefined, tabindex: visible.value.length ? undefined : 0,
      onFocusout: (event: FocusEvent) => { if (!event.relatedTarget || !root.value?.contains(event.relatedTarget as Node)) { resetSearch(); focused.value = entryTarget(); } },
    }), hierarchy.value.roots.length ? [renderNodes(hierarchy.value.roots)] : [h('p', { class: 'ui-tree__empty' }, '暂无目录项目')]);
  },
});
</script>

<style scoped>
.ui-tree { min-width: 0; color: var(--ui-color-text); font: var(--ui-font-size-body)/var(--ui-line-height-body) var(--ui-font-family); }
.ui-tree *, .ui-tree *::before, .ui-tree *::after { box-sizing: border-box; }
.ui-tree__list, .ui-tree__group { margin: 0; padding: 0; list-style: none; }
.ui-tree__group { margin-inline-start: 20px; padding-inline-start: 10px; border-inline-start: 1px solid var(--ui-color-secondary-accent); }
.ui-tree__item { min-width: 0; outline: none; }
.ui-tree__item > div[hidden] { display: none; }
.ui-tree__row { position: relative; display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 8px 10px 8px 0; border: 1px solid transparent; cursor: pointer; transition: background-color var(--ui-motion-duration-feedback); }
.ui-tree__label { min-width: 0; flex: 1; overflow-wrap: anywhere; }
.ui-tree__hinge { align-self: stretch; display: flex; align-items: center; justify-content: center; width: 30px; flex: none; color: var(--ui-color-secondary-accent); font: 22px/1 var(--ui-font-family-mono); transition: transform var(--ui-motion-duration-transition) var(--ui-motion-ease-emphasized); }
.ui-tree__hinge--leaf { color: var(--ui-color-metal); }
.ui-tree__item[aria-expanded='true'] > .ui-tree__row .ui-tree__hinge { transform: rotate(90deg); }
.ui-tree__mark { width: 8px; height: 13px; flex: none; border: 1px solid var(--ui-color-metal); border-block-width: 2px; transform: skewY(-15deg); }
.ui-tree__impression { min-width: 17px; flex: none; color: var(--ui-color-accent); font: 13px/1 var(--ui-font-family-display); }
.ui-tree__item[aria-selected='true'] > .ui-tree__row { background: var(--ui-color-accent-soft); }
.ui-tree__item[aria-selected='true'] > .ui-tree__row::before { content: ''; position: absolute; inset-inline-start: -1px; top: 8px; bottom: 8px; width: 2px; background: linear-gradient(var(--ui-color-accent) 0 40%, transparent 40% 60%, var(--ui-color-accent) 60%); }
.ui-tree__item[aria-selected='true'] > .ui-tree__row .ui-tree__mark { border-color: var(--ui-color-accent); background: var(--ui-color-accent); }
.ui-tree__item:focus-visible > .ui-tree__row, .ui-tree:focus-visible { outline: 2px solid var(--ui-color-focus); outline-offset: -2px; }
.ui-tree__item:not([aria-disabled='true']) > .ui-tree__row:hover { background: var(--ui-color-surface-raised); }
.ui-tree__item[aria-disabled='true'] > .ui-tree__row { opacity: .45; cursor: not-allowed; }
.ui-tree__empty { margin: 0; padding: 24px 14px; border-block: 1px solid var(--ui-color-rule); color: var(--ui-color-text-secondary); overflow-wrap: anywhere; }
:global([data-ui-motion='reduced'] .ui-tree__row), :global([data-ui-motion='reduced'] .ui-tree__hinge) { transition: none; }
@media (prefers-reduced-motion: reduce) { .ui-tree__row, .ui-tree__hinge { transition: none; } }
@media (pointer: coarse) { .ui-tree__row { min-height: 44px; } .ui-tree__hinge { width: 36px; } }
@media (max-width: 480px) { .ui-tree__group { margin-inline-start: 14px; padding-inline-start: 6px; } .ui-tree__row { gap: 8px; padding-inline-end: 6px; } }
@media (forced-colors: active) { .ui-tree__group { border-color: CanvasText; } .ui-tree__item[aria-selected='true'] > .ui-tree__row { border-color: Highlight; } .ui-tree__item[aria-selected='true'] > .ui-tree__row::before { forced-color-adjust: none; background: Highlight; } .ui-tree__item[aria-disabled='true'] > .ui-tree__row { color: GrayText; opacity: 1; } .ui-tree__item:focus-visible > .ui-tree__row, .ui-tree:focus-visible { outline-color: Highlight; } }
</style>
