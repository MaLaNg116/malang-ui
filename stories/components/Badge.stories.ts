import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent } from 'vue';
import MBadge from '../../src/components/MBadge.vue';

const meta = {
  title: '基础组件/Badge 状态标记',
  component: MBadge,
  tags: ['autodocs'],
  args: { tone: 'neutral' },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'info', 'success', 'warning', 'error'] } },
  parameters: { docs: { description: { component: '静态状态标记，由文字和色彩共同表达含义。默认插槽承载状态文字，本身没有点击行为或键盘停靠点。' } } },
  render: args => defineComponent({ components: { MBadge }, setup: () => ({ args }), template: '<MBadge v-bind="args">草稿</MBadge>' }),
} satisfies Meta<typeof MBadge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Tones: Story = {
  name: '常用状态',
  render: () => defineComponent({
    components: { MBadge },
    template: `<div class="kit-row"><MBadge>草稿</MBadge><MBadge tone="info">待查看</MBadge><MBadge tone="success">已归档</MBadge><MBadge tone="warning">待校对</MBadge><MBadge tone="error">未通过</MBadge></div>`,
  }),
};
export const LongContent: Story = {
  name: '长文字自然换行',
  render: () => defineComponent({
    components: { MBadge },
    template: '<div style="max-width:260px"><MBadge tone="warning">本次档案尚有需要进一步核对的内容，请完成校对后再归档。</MBadge></div>',
  }),
};
