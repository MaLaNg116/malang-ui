import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MTable from '../../src/components/MTable.vue';
import MButton from '../../src/components/MButton.vue';
import { columns, records } from './fixtures';
const meta = { title: '数据组件/Table 表格增强', tags: ['autodocs'] } satisfies Meta;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => defineComponent({ components: { MTable, MButton }, setup() { const selected=ref<(string|number)[]>([]), expanded=ref<(string|number)[]>([]);return {columns,records:records.slice(0,12),selected,expanded}; }, template: `<main class="kit-stack" style="max-width:960px"><h1>筛印择卷，逐页展开。</h1><MTable :columns="columns" :rows="records" caption="可交互卷宗" selectable expandable :page-size="4" v-model:selected-keys="selected" v-model:expanded-keys="expanded"><template #cell-name="{row}"><strong>{{row.name}}</strong></template><template #expanded="{row}"><p>卷宗详情：{{row.name}} · {{row.group}} · 编号{{row.id}}</p></template></MTable><output data-static-selection>选择：{{selected.join(',')}}</output></main>` }) };
export const DeclinedOwner: Story = { render: () => defineComponent({ components: { MTable }, setup:()=>({columns,records:records.slice(0,6), requests:ref(0)}), template: `<main><MTable :columns="columns" :rows="records" caption="受控卷宗" :sort="null" :filters="{}" :selected-keys="[]" :expanded-keys="[]" :page="1" :page-size="2" selectable expandable @update:sort="requests++" @update:filters="requests++" @update:selected-keys="requests++" @update:expanded-keys="requests++" @update:page="requests++"/><output data-table-requests>请求：{{requests}}</output></main>` }) };
