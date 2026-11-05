<script setup lang="ts">
import {computed,nextTick,ref,watch,TransitionGroup} from 'vue';import MPopover from '../MPopover.vue';import MValueBridge from './MValueBridge.vue';import {treeEntries,descendants,moveInList} from './tree';import type{MTreeEntry}from'./tree';import type{MTreeSelectProps}from'./types';import{useReferenceConfig}from'./locale';
import { useMTransition } from '../../composables/useMTransition';
const props=withDefaults(defineProps<MTreeSelectProps>(),{multiple:false,checkStrictly:false,filterable:true});const emit=defineEmits<{ 'update:modelValue':[value:string|string[]|null] }>();const{t}=useReferenceConfig();const open=ref(false),query=ref(''),expanded=ref<string[]>([]);const all=computed(()=>treeEntries(props.options));const values=computed(()=>Array.isArray(props.modelValue)?props.modelValue:typeof props.modelValue==='string'?[props.modelValue]:[]);const display=computed(()=>values.value.map(value=>all.value.find(item=>item.node.value===value)?.node.label||value).join('、'));
// A supplied parent represents its available leaves in linked multiple mode.
// Projection is read-only; the owner receives normalized leaf keys only after an interaction.
const projected=computed(()=>new Set(values.value.flatMap(value=>{const item=all.value.find(entry=>entry.node.value===value);return props.multiple&&!props.checkStrictly&&item&&!item.disabled?descendants(item,all.value).map(leaf=>leaf.node.value):[value];})));
const visible=computed(()=>all.value.filter(item=>query.value?item.labels.join(' / ').toLocaleLowerCase().includes(query.value.toLocaleLowerCase()):item.path.slice(0,-1).every(value=>expanded.value.includes(value))));
const root = ref<HTMLElement>(), search = ref<HTMLInputElement>();
const { transition: nodeTransition, moveClass: nodeMoveClass } = useMTransition({
  preset: 'reveal', group: true,
  disabled: () => !!query.value || visible.value.length > 60,
  focusTarget: () => search.value ?? root.value?.querySelector<HTMLButtonElement>('button') ?? null,
});
function toggle(value:string){expanded.value=expanded.value.includes(value)?expanded.value.filter(item=>item!==value):[...expanded.value,value];}
function selected(item:MTreeEntry){const targets=props.checkStrictly?[item]:descendants(item,all.value);return !!targets.length&&targets.every(target=>projected.value.has(target.node.value));}
function partial(item:MTreeEntry){return !props.checkStrictly&&!selected(item)&&descendants(item,all.value).some(target=>projected.value.has(target.node.value));}
function change(event:Event,item:MTreeEntry){const control=event.currentTarget as HTMLInputElement;choose(item);void nextTick(()=>{if(control.isConnected){control.checked=selected(item);control.indeterminate=partial(item);}});}
function searchKey(event:KeyboardEvent){if(event.isComposing)return;if(event.key==='ArrowDown'){event.preventDefault();(event.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>('[data-ri-list] button:not(:disabled),[data-ri-list] input:not(:disabled)')?.focus();}else if(event.key==='Enter'){event.preventDefault();const available=visible.value.filter(item=>!item.disabled);if(query.value&&available.length===1)choose(available[0]!);}}
function choose(item:MTreeEntry){if(props.disabled||props.readonly||item.disabled)return;if(!props.multiple){emit('update:modelValue',item.node.value);open.value=false;return;}const targets=props.checkStrictly?[item]:descendants(item,all.value);const keys=new Set(targets.map(target=>target.node.value));const next=[...projected.value].filter(value=>!keys.has(value));if(!selected(item))next.push(...keys);emit('update:modelValue',next);}
function key(event:KeyboardEvent,item:MTreeEntry){if(event.key==='ArrowRight'&&item.node.children?.length){event.preventDefault();if(!expanded.value.includes(item.node.value))toggle(item.node.value);}else if(event.key==='ArrowLeft'){event.preventDefault();if(expanded.value.includes(item.node.value))toggle(item.node.value);}else moveInList(event);}
const error=computed(()=>values.value.some(value=>!all.value.some(item=>item.node.value===value&&!item.disabled&&(!props.multiple||props.checkStrictly||descendants(item,all.value).length)))?t('tree.invalid','已选节点无效或已禁用。'):'');watch(()=>[props.disabled,props.readonly],()=>{if(props.disabled||props.readonly)open.value=false;});
</script>
<template>
  <div ref="root" class="ui-ri">
    <span class="ui-ri__label">{{ label }}</span>
    <div class="ui-ri__row">
      <MPopover v-model="open" :label="label" :trigger-label="label" :aria-description="display" :disabled="disabled || readonly">
        <template #trigger>{{ display || t('tree.placeholder', '选择节点') }}</template>
        <div class="ui-ri">
          <input v-if="filterable" ref="search" v-model="query" class="ui-ri__control" @keydown="searchKey" :aria-label="t('search', '搜索') + label">
          <TransitionGroup v-bind="nodeTransition" :move-class="nodeMoveClass" tag="ul" class="ui-ri__list ui-transition-group" data-ri-list>
            <li v-for="item in visible" :key="item.node.value" :style="{ paddingInlineStart: (item.path.length - 1) * 14 + 'px' }" class="ui-ri__row ui-tree-select__node">
              <button v-if="item.node.children?.length" type="button" class="ui-ri__button" :aria-label="(expanded.includes(item.node.value) ? t('tree.collapse', '折叠') : t('tree.expand', '展开')) + item.node.label" :aria-expanded="expanded.includes(item.node.value)" :disabled="item.disabled" @click="toggle(item.node.value)">{{ expanded.includes(item.node.value) ? '−' : '+' }}</button>
              <label v-if="multiple" class="ui-ri__row"><input type="checkbox" :checked="selected(item)" :indeterminate="partial(item)" @keydown="key($event, item)" :disabled="item.disabled" :aria-label="item.labels.join(' / ')" @change="change($event, item)">{{ item.node.label }}</label>
              <button v-else type="button" class="ui-ri__button" :disabled="item.disabled" :aria-pressed="values.includes(item.node.value)" @keydown="key($event, item)" @click="choose(item)">{{ item.node.label }}</button>
            </li>
          </TransitionGroup>
          <p v-if="!visible.length">{{ t('empty', '暂无数据') }}</p>
        </div>
      </MPopover>
      <button type="button" class="ui-ri__button" :disabled="disabled || readonly || !values.length" @click="emit('update:modelValue', multiple ? [] : null)">{{ t('clear', '清空') }}</button>
    </div>
    <MValueBridge v-bind="props" :values="values" :error="error"/>
  </div>
</template>
<style scoped>
.ui-tree-select__node { position: relative; }
.ui-tree-select__node[data-ui-transition-phase='enter'] { background: linear-gradient(90deg, var(--ui-color-accent-soft), transparent 72%); }
.ui-tree-select__node[data-ui-transition-phase='enter']::before { content: ''; position: absolute; inset-inline-start: 0; top: 8px; bottom: 8px; width: 2px; background: var(--ui-color-accent); pointer-events: none; }
@media (forced-colors: active) { .ui-tree-select__node[data-ui-transition-phase='enter'] { background: transparent; } }
</style>
