import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MPagination from '../../src/components/MPagination.vue';

const meta = {
  title: '基础组件/Pagination 分页', component: MPagination, tags: ['autodocs'],
  args: { modelValue: 1, total: 86, pageSize: 10, disabled: false },
  parameters: { docs: { description: { component: '受控的页码导航，保留原生按钮键盘操作。总量或页大小变化时显示有效范围内的页码，首次兜底不改写父模型；显式选择页码才更新。零条记录时显示空说明并禁用操作。' } } },
  render: args => defineComponent({ components: { MPagination }, setup() { const page = ref(args.modelValue); watch(() => args.modelValue, value => { page.value = value; }); return { args, page }; }, template: '<div class="kit-stack" style="max-width:960px"><MPagination v-bind="args" v-model="page" /><p class="kit-muted">父模型页码：{{ page }}</p></div>' }),
} satisfies Meta<typeof MPagination>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Middle: Story = { args: { modelValue: 5, total: 156 } };
export const LargeTotal: Story = { name: '极大总量', args: { modelValue: 1e20, total: 1e21, pageSize: 1 } };
export const Empty: Story = { args: { total: 0 } };
export const Disabled: Story = { args: { disabled: true } };
export const ChangingTotal: Story = { render: () => defineComponent({ components: { MPagination }, setup: () => ({ page: ref(8), total: ref(86) }), template: '<div class="kit-stack"><MPagination v-model="page" :total="total" /><button type="button" @click="total = total === 86 ? 12 : 86">切换记录总量</button><p>父模型页码：{{ page }} · 记录数：{{ total }}</p></div>' }) };
