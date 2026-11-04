import { defineComponent } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MSpace from '../../src/components/MSpace.vue';
import { MBadge, MButton, MCard } from '../../src';

const meta = {
  title: '基础组件/Space 间距', component: MSpace, tags: ['autodocs'],
  args: { direction: 'horizontal', size: 'md', align: 'center', wrap: true, inline: false },
  parameters: { docs: { description: { component: '用原生 flex gap 安排组件间距，直接保留插槽中的 DOM，不增加条目包装或辅助技术角色。sm/md/lg 对应 space-2/3/5；数值为非负有限像素，0 有效，非法数值回退到 md。默认横向、居中并允许换行。' } } },
  render: args => defineComponent({ components: { MSpace, MButton, MBadge }, setup: () => ({ args }), template: '<MSpace v-bind="args"><MButton>建立档案</MButton><MButton variant="secondary">查看记录</MButton><MButton variant="ghost">稍后整理</MButton><MBadge tone="success">已校对</MBadge></MSpace>' }),
} satisfies Meta<typeof MSpace>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Vertical: Story = { args: { direction: 'vertical', align: 'stretch', size: 'lg' }, render: args => defineComponent({ components: { MSpace, MCard, MButton }, setup: () => ({ args }), template: '<MSpace v-bind="args" style="max-width:620px"><MCard title="卷宗目录"><p>纵向排列内容，stretch 让卡片沿同一基线展开。</p></MCard><MCard title="校对记录"><p>组件自身负责长文折行，布局只安排间距。</p></MCard><MButton variant="secondary">继续校对</MButton></MSpace>' }) };
export const GapAndAlignment: Story = { render: () => defineComponent({ components: { MSpace, MButton, MBadge }, template: '<div class="kit-stack"><MSpace size="sm" align="baseline" data-space-case="small"><span>细间距</span><MButton size="sm">小操作</MButton><MBadge>对齐文字</MBadge></MSpace><MSpace :size="0" data-space-case="zero"><MButton variant="secondary">零间距</MButton><MButton variant="secondary">相邻操作</MButton></MSpace><div><MSpace :size="18" align="end" inline data-space-case="custom"><span>18 px</span><MButton size="lg">自定义间距</MButton></MSpace></div><MSpace size="lg" align="start" data-space-case="large"><MButton>宽间距</MButton><span>起点对齐</span></MSpace></div>' }) };
export const Wrapping: Story = { render: () => defineComponent({ components: { MSpace, MButton }, template: '<div style="max-width:360px"><p>缩窄容器时自然换行，操作仍保持原来的键盘顺序。</p><MSpace size="lg"><MButton>建立项目档案</MButton><MButton variant="secondary">打开本地附件</MButton><MButton variant="secondary">检查交付日期</MButton><MButton variant="ghost">保存当前草稿</MButton></MSpace></div>' }) };
