import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MSteps from '../../src/components/MSteps.vue';
import MButton from '../../src/components/MButton.vue';
import type { MStepItem } from '../../src/components/types';

const items: MStepItem[] = [
  { value: 'archive', label: '建档', description: '确定目标与素材。' },
  { value: 'motion', label: '编排', description: '让内容与动效配合。' },
  { value: 'review', label: '复核', description: '这一阶段暂未开放。', disabled: true },
  { value: 'publish', label: '落印', description: '确认后保存本次成果。' },
];
const meta = {
  title: '二级组件/Steps 步骤条', component: MSteps, tags: ['autodocs'],
  args: { modelValue: 'motion', items, label: '档案编排进度', interactive: false, orientation: 'horizontal', status: 'process' },
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] }, status: { control: 'inline-radio', options: ['process', 'error', 'success'] } },
  parameters: { docs: { description: { component: '由刻印节点与机械连接轨表达实际流程进度，默认是静态有序列表。modelValue 对应唯一的步骤 value；之前步骤显示完成，之后步骤等待，status 调整当前步骤的进行中、错误或完成状态。interactive 开启原生按钮导航，禁用项无法操作；父级决定是否接受更新。无效值显示首项但不自动回写。窄屏自动竖排，orientation 也可固定为 vertical。' } } },
  render: args => defineComponent({
    components: { MSteps },
    setup() { const value = ref(args.modelValue); watch(() => args.modelValue, next => { value.value = next; }); return { args, value }; },
    template: `<main class="kit-stack" style="max-width:960px"><h1 style="font:500 30px/1.5 var(--ui-font-family-display)">步步成章，终有所印。</h1><p class="kit-muted">{{ args.interactive ? '使用按钮选择步骤；尚未开放的阶段会保持禁用。' : '步骤条表达当前进展，流程由外部操作推进。' }}</p><div style="padding-block:24px"><MSteps v-bind="args" v-model="value" /></div><p class="kit-muted kit-mono" role="status">父模型步骤：{{ value }}</p></main>`,
  }),
} satisfies Meta<typeof MSteps>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Interactive: Story = { name: '可选择步骤', args: { interactive: true } };
export const Error: Story = { name: '当前步骤异常', args: { modelValue: 'review', status: 'error' } };
export const Success: Story = { name: '完成落印', args: { modelValue: 'publish', status: 'success' } };
export const Vertical: Story = { name: '纵向流程', args: { orientation: 'vertical' } };
export const InvalidValue: Story = { name: '不可用值兜底', args: { modelValue: 'missing', items: [{ value: 'archive', label: '建档', description: '首项会显示为当前阶段，父模型保持原值。' }, ...items.slice(1)] } };
export const Controlled: Story = {
  name: '父级确认步骤',
  render: () => defineComponent({
    components: { MSteps, MButton },
    setup() { const value = ref('archive'); const requested = ref('archive'); const count = ref(0); function request(next: string) { requested.value = next; count.value++; } return { value, requested, count, items, request }; },
    template: `<main class="kit-stack" style="max-width:960px"><MSteps :model-value="value" :items="items" label="受控编排进度" interactive @update:model-value="request" /><div><MButton variant="secondary" @click="value = requested">接受最近步骤</MButton></div><p class="kit-muted" role="status">请求：{{ count }} 次；父模型：{{ value }}</p></main>`,
  }),
};
