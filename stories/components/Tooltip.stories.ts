import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UiTooltip from '../../src/components/UiTooltip.vue';
import UiButton from '../../src/components/UiButton.vue';

const meta = {
  title: '基础组件/Tooltip 提示', component: UiTooltip, tags: ['autodocs'],
  args: { label: '保存草稿说明', text: '将当前编辑内容保存在工作空间中。', placement: 'top', delay: 300, disabled: false },
  argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] } },
  parameters: { docs: { description: { component: '切角铭牌、朱砂刻印与机械刻度组成纯文字提示，入场按实际定位方向短促归位。悬停稍候出现，键盘聚焦立即出现；Escape 退出并保留触发按钮的焦点。鼠标移入提示文字时保持打开，不承载可交互内容。装饰不参与辅助技术说明；减少动态效果时直接静态显示。定位与观察器按实例清理，trigger 内容为按钮内部文字或图标。' } } },
  render: args => defineComponent({ components: { UiTooltip }, setup: () => ({ args }), template: `<main class="kit-stack"><h1 style="font:500 30px/1.4 var(--ui-font-family-display)">说明到位，动作不停。</h1><p class="kit-muted">悬停、聚焦或按 Escape，查看同一份说明的不同入口。</p><div class="kit-row" style="padding-block:40px"><UiTooltip v-bind="args" /></div><p class="kit-muted">提示只解释操作，不包含按钮或表单。</p></main>` }),
} satisfies Meta<typeof UiTooltip>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const ShortContent: Story = { name: '短句铭牌', args: { label: '归档说明', text: '落印归档。', delay: 0 } };
export const LongContent: Story = { name: '长文字与边缘避让', args: { label: '长说明', text: '这是一段更完整的操作说明。'.repeat(8) + 'LongReferenceWithoutArtificialClipping'.repeat(4), placement: 'right', delay: 0 } };

export const Placements: Story = {
  name: '四向定位',
  render: () => defineComponent({
    components: { UiTooltip }, setup: () => ({ placements: ['top', 'bottom', 'left', 'right'] }),
    template: `<main class="kit-stack"><p class="kit-muted">每一处说明都跟随自己的触发按钮。</p><div class="kit-row" style="padding-block:70px"><UiTooltip v-for="placement in placements" :key="placement" :label="placement + ' 方向说明'" :text="'首选 ' + placement + '，空间不足时自动避让。'" :placement="placement" :delay="0" /></div></main>`,
  }),
};

export const UnmountCleanup: Story = {
  name: '卸载与重新挂载',
  render: () => defineComponent({
    components: { UiTooltip, UiButton }, setup: () => ({ mounted: ref(true) }),
    template: `<main class="kit-stack"><div class="kit-row"><UiButton variant="secondary" @click="mounted = !mounted">{{ mounted ? '卸载提示组件' : '重新挂载提示组件' }}</UiButton><UiTooltip v-if="mounted" label="可卸载提示" text="移除组件后计时器、定位观察与键盘订阅也会清理。" :delay="400" /></div><p class="kit-muted">可以在等待悬停提示时卸载，再重新挂载。</p></main>`,
  }),
};
