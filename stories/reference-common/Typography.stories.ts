import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MTypography, MText, MLink, MIcon, mIconPaths } from '../../src/components';
const meta = { title: '基础组件/Typography 文字', component: MTypography, tags: ['autodocs'], args: { modelValue: '墨浪，锋芒藏于秩序。' } } satisfies Meta<typeof MTypography>;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Editing: Story = { render: () => defineComponent({ components: { MTypography, MText, MLink }, setup() { return { value: ref('档案尚未整理，点击编辑开始校对。'), long: '水墨藏锋，机关有序。'.repeat(15) }; }, template: '<main class="kit-stack" style="max-width:400px"><MTypography as="h2" model-value="字骨与留白" /><MTypography v-model="value" editable copyable /><MTypography :model-value="long" :ellipsis="2" expandable /><MText type="secondary">辅助说明仍保持清晰。</MText><MLink href="#archive">前往档案</MLink><MLink href="#disabled" disabled>暂不可用</MLink></main>' }) };
export const Icons: Story = { render: () => defineComponent({ components: { MIcon }, setup: () => ({ names: Object.keys(mIconPaths) }), template: '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:24px"><div v-for="name in names" :key="name" class="kit-stack"><MIcon :name="name" :size="28" :label="name" /><code>{{name}}</code></div></div>' }) };
