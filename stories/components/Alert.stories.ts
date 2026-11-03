import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';
import UiAlert from '../../src/components/UiAlert.vue';
import UiButton from '../../src/components/UiButton.vue';

const meta = {
  title: '基础组件/Alert 提示块',
  component: UiAlert,
  tags: ['autodocs'],
  args: { title: '新的说明已就绪', description: '开始创作前，可以先查看这份档案的整理说明。', tone: 'info', announce: false },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'info', 'success', 'warning', 'error'] } },
  parameters: { docs: { description: { component: '持续显示的说明与结果。默认作为静态 note；动态重要消息可显式开启 announce，此时错误使用 alert，其他状态使用 status。组件不自动关闭、不移动焦点；默认插槽可放补充内容或操作。' } } },
  render: args => defineComponent({ components: { UiAlert }, setup: () => ({ args }), template: '<UiAlert v-bind="args" style="max-width:680px" />' }),
} satisfies Meta<typeof UiAlert>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Tones: Story = {
  name: '状态与补充操作',
  render: () => defineComponent({
    components: { UiAlert, UiButton },
    setup: () => ({ details: ref(false) }),
    template: `<div class="kit-stack" style="max-width:680px"><UiAlert title="档案草稿" description="这份内容仍可继续编辑。" tone="neutral" /><UiAlert title="已完成归档" description="新的整理结果已保存在当前工作空间。" tone="success" /><UiAlert title="请检查缺失的说明" description="补全来源信息后，即可继续归档。" tone="warning" /><UiAlert title="保存未完成" description="内容仍保留在当前页面，可检查后重试。" tone="error"><UiButton size="sm" variant="secondary" :aria-expanded="details" @click="details = !details">{{ details ? '收起检查要点' : '查看检查要点' }}</UiButton><p v-if="details" style="margin-top:12px">请确认档案名称与来源信息均已填写。</p></UiAlert></div>`,
  }),
};
export const DynamicAnnouncement: Story = {
  name: '动态错误播报',
  render: () => defineComponent({
    components: { UiAlert, UiButton },
    setup: () => ({ visible: ref(false) }),
    template: `<div class="kit-stack" style="max-width:680px"><div><UiButton variant="secondary" @click="visible = !visible">{{ visible ? '收起动态错误提示' : '显示动态错误提示' }}</UiButton></div><UiAlert v-if="visible" announce tone="error" title="档案名称未填写" description="请返回名称字段，补全后再保存。" /><p class="kit-muted">动态插入时播报消息，焦点留在触发按钮上。</p></div>`,
  }),
};
