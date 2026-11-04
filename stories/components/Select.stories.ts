import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MSelect from '../../src/components/MSelect.vue';
import MButton from '../../src/components/MButton.vue';

const options = [{ value: 'design', label: '设计档案' }, { value: 'motion', label: '动效实验' }, { value: 'locked', label: '团队资料（暂不可用）', disabled: true }];
const meta = {
  title: '基础组件/Select 选择器', component: MSelect, tags: ['autodocs'],
  args: { modelValue: '', options, label: '档案分类', placeholder: '请选择分类', hint: '使用原生选择器，保留键盘与触屏行为。', disabled: false },
  parameters: { docs: { description: { component: '单值原生 select，支持 options、占位项、表单属性、禁用与错误。值为字符串，未匹配的值不强制改成第一个选项；需要多选或搜索时应使用后续专用组件。' } } },
  render: args => defineComponent({ components: { MSelect }, setup() { const value = ref(args.modelValue); watch(() => args.modelValue, next => { value.value = next; }); return { args, value }; }, template: '<div class="kit-stack" style="width:min(100%,440px)"><MSelect v-bind="args" v-model="value" /><p class="kit-muted">当前分类：{{ value || "尚未选择" }}</p></div>' }),
} satisfies Meta<typeof MSelect>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = { args: { error: '请选择档案分类。' } };
export const Disabled: Story = { args: { modelValue: 'design', disabled: true } };
export const FormAttributes: Story = {
  name: '原生表单提交',
  render: () => defineComponent({
    components: { MSelect, MButton },
    setup() { const value = ref(''); const message = ref('尚未提交'); function submit(event: Event) { message.value = `提交分类：${new FormData(event.target as HTMLFormElement).get('category')}`; } return { value, message, options, submit }; },
    template: '<form class="kit-stack" style="max-width:440px" @submit.prevent="submit"><MSelect v-model="value" :options="options" label="提交分类" placeholder="请选择分类" name="category" autocomplete="off" required /><div><MButton type="submit">提交分类</MButton></div><p role="status">{{ message }}</p></form>',
  }),
};
export const Controlled: Story = {
  name: '受控更新',
  render: () => defineComponent({ components: { MSelect }, setup: () => ({ options, requests: ref(0) }), template: '<div class="kit-stack" style="max-width:440px"><MSelect model-value="design" :options="options" label="受控档案分类" hint="父页面记录请求但暂不确认，选择会恢复为设计档案。" @update:model-value="requests++" /><p role="status">更新请求：{{ requests }} 次</p></div>' }),
};
