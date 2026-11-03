import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UiBreadcrumb from '../../src/components/UiBreadcrumb.vue';
const meta = { title: '基础组件/Breadcrumb 面包屑', component: UiBreadcrumb, tags: ['autodocs'], args: { items: [{ label: '组件库', href: '#library' }, { label: '工作空间', href: '#workspace' }, { label: '项目档案' }] }, parameters: { docs: { description: { component: '使用原生链接表达上级路径，最后一项始终为带 aria-current=page 的当前页面文本。无 href 的中间项也保持静态；路径允许自然换行。' } } } } satisfies Meta<typeof UiBreadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongPath: Story = { args: { items: [{ label: '组件库', href: '#library' }, { label: '跨团队的内容与协作工作空间', href: '#workspace' }, { label: 'ProjectArchiveWithUnbrokenCharacters'.repeat(3) }] } };
