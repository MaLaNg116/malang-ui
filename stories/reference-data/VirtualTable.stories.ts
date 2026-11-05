import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MVirtualTable from '../../src/components/reference-data/MVirtualTable.vue';
import MButton from '../../src/components/MButton.vue';
import { columns, records } from './fixtures';
const meta = { title: '数据组件/VirtualTable 虚拟表格', tags: ['autodocs'] } satisfies Meta;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => defineComponent({ components: { MVirtualTable, MButton }, setup() { const table = ref<{scrollToIndex:(index:number)=>void}>(), selected = ref<(string|number)[]>([]); return { table, records, columns, selected }; }, template: `<main class="kit-stack" style="max-width:900px"><h1>万行同序，按需见卷。</h1><MButton @click="table?.scrollToIndex(9999)">定位末行</MButton><MVirtualTable ref="table" v-model:selected-keys="selected" :columns="columns" :rows="records" caption="万行卷宗" selectable :height="360"><template #cell-name="{row,index}"><strong>{{row.name}}</strong> · 行{{index+1}}</template></MVirtualTable><output data-table-selected>选择：{{selected.join(',')}}</output></main>` }) };
export const Empty: Story = { render: () => defineComponent({ components: { MVirtualTable }, setup: () => ({ columns }), template: `<MVirtualTable :columns="columns" :rows="[]" caption="空的虚拟表格" />` }) };
