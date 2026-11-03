import { defineComponent, ref } from 'vue';
import type { DefineComponent } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UiTable from '../../src/components/UiTable.vue';
import UiButton from '../../src/components/UiButton.vue';
import UiBadge from '../../src/components/UiBadge.vue';
import type { UiTableProps } from '../../src/components/types';

// Storybook's Component type is concrete; the public SFC remains generic.
const StoryTable = UiTable as unknown as DefineComponent<UiTableProps>;

const columns = [{ key: 'name', label: '项目名称' }, { key: 'owner', label: '负责人' }, { key: 'status', label: '状态' }, { key: 'action', label: '操作', align: 'end' as const }];
const rows = [{ id: 1, name: '观山设计档案', owner: '设计组', status: '进行中' }, { id: 2, name: '墨线动效研究', owner: '交互组', status: '待开始' }, { id: 3, name: '组件工作台', owner: '研发组', status: '已完成' }];
const meta = {
  title: '基础组件/Table 表格', component: StoryTable, tags: ['autodocs'],
  args: { caption: '项目档案', columns, rows, loading: false, rowKey: 'id' },
  parameters: { docs: { description: { component: '原生表格语义与可滚动区域，使用稳定唯一 rowKey。cell-列key 插槽得到 row、column、value、index，支持具名业务行类型。加载与空状态可替换。基础版本不提供表格网格键盘模式、虚拟滚动或内置排序。' } } },
  render: args => defineComponent({ components: { UiTable: StoryTable, UiButton, UiBadge }, setup: () => ({ args, result: ref('选择一条项目记录。') }), template: `<div class="kit-stack" style="max-width:1040px"><UiTable v-bind="args"><template #cell-status="{ value }"><UiBadge :tone="value === '已完成' ? 'success' : 'info'">{{ value }}</UiBadge></template><template #cell-action="{ row }"><UiButton size="sm" variant="ghost" :aria-label="'查看' + row.name" @click="result = '已查看：' + row.name">查看</UiButton></template></UiTable><p role="status" class="kit-muted">{{ result }}</p></div>` }),
} satisfies Meta<typeof StoryTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { rows: [] } };
export const Loading: Story = { args: { loading: true } };
export const NoColumns: Story = { args: { columns: [] } };
export const LongCells: Story = { args: { rows: [{ id: 1, name: 'ProjectWithLongUnbrokenCharacters'.repeat(4), owner: '跨团队协作组', status: '进行中' }] } };
