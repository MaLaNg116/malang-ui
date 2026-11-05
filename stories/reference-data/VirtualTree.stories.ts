import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MVirtualTree from '../../src/components/reference-data/MVirtualTree.vue';
import MButton from '../../src/components/MButton.vue';
import { records } from './fixtures';
const meta = { title: '数据组件/VirtualTree 虚拟树', tags: ['autodocs'] } satisfies Meta;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => defineComponent({ components: { MVirtualTree, MButton }, setup() { const items = [{value:'root',label:'山川卷宗',children:records.map(item=>({value:item.id,label:item.name,disabled:item.id==='record-1'}))}], selected = ref<string|null>(null), expanded = ref<string[]>(['root']); return {items,selected,expanded}; }, template: `<main class="kit-stack" style="max-width:640px"><h1>支脉开合，万叶成林。</h1><MButton @click="expanded = expanded.length ? [] : ['root']">展开或收拢根目录</MButton><MVirtualTree v-model="selected" v-model:expanded-values="expanded" :items="items" label="万叶目录" :height="264" /><output data-tree-selected>目录选中：{{selected ?? '无'}}</output><input aria-label="目录外的草稿" value="仍可编辑" /></main>` }) };
export const Empty: Story = { render: () => defineComponent({ components: { MVirtualTree }, setup: () => ({ selected: ref<string|null>(null), expanded: ref<string[]>([]) }), template: `<MVirtualTree v-model="selected" v-model:expanded-values="expanded" :items="[]" label="空的目录" />` }) };
