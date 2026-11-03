import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UiRadioGroup from '../../src/components/UiRadioGroup.vue';
import UiButton from '../../src/components/UiButton.vue';

const options = [
  { value: 'balanced', label: '均衡', description: '适合日常阅读和操作。' },
  { value: 'experimental', label: '实验方案', description: '正在打磨，暂不可用。', disabled: true },
  { value: 'expressive', label: '表现', description: '为展示保留更多动态细节。' },
];
const meta = {
  title: '基础组件/RadioGroup 单选组', component: UiRadioGroup, tags: ['autodocs'],
  args: { modelValue: 'balanced', options, label: '选择界面方案', hint: '同组保留一个选择，可使用方向键。', disabled: false },
  parameters: { docs: { description: { component: 'fieldset、legend 与原生同名 radio 组成单选组。默认使用实例唯一名称，方向键与原生校验保留；name、required 与 form 会作用于真实单选控件。options 的 value 应在同组唯一。' } } },
  render: args => defineComponent({ components: { UiRadioGroup }, setup() { const value = ref(args.modelValue); watch(() => args.modelValue, next => { value.value = next; }); return { args, value }; }, template: '<div class="kit-stack" style="max-width:520px"><UiRadioGroup v-bind="args" v-model="value" /><p class="kit-muted">当前方案：{{ value || "尚未选择" }}</p></div>' }),
} satisfies Meta<typeof UiRadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = { args: { modelValue: '', error: '请选择一个界面方案。' } };
export const Disabled: Story = { args: { disabled: true } };
export const FormAttributes: Story = {
  name: '原生表单提交',
  render: () => defineComponent({
    components: { UiRadioGroup, UiButton },
    setup() { const value = ref(''); const message = ref('尚未提交'); function submit(event: Event) { message.value = `提交方案：${new FormData(event.target as HTMLFormElement).get('scheme')}`; } return { value, message, options, submit }; },
    template: '<form class="kit-stack" @submit.prevent="submit"><UiRadioGroup v-model="value" :options="options" label="归档方案" name="scheme" required /><div><UiButton type="submit">提交方案</UiButton></div><p role="status">{{ message }}</p></form>',
  }),
};
export const Controlled: Story = {
  name: '受控更新',
  render: () => defineComponent({ components: { UiRadioGroup }, setup: () => ({ options, requests: ref(0) }), template: '<div class="kit-stack"><UiRadioGroup model-value="balanced" :options="options" label="受控界面方案" hint="父页面暂不确认新值，选中状态仍保持均衡。" @update:model-value="requests++" /><p role="status">更新请求：{{ requests }} 次</p></div>' }),
};
export const IndependentGroups: Story = {
  name: '多个独立分组',
  render: () => defineComponent({
    components: { UiRadioGroup },
    setup: () => ({ options, first: ref('balanced'), second: ref('balanced') }),
    template: '<div class="kit-stack" style="max-width:520px"><UiRadioGroup v-model="first" :options="options" label="第一组方案" /><UiRadioGroup v-model="second" :options="options" label="第二组方案" /><p role="status">第一组：{{ first }}；第二组：{{ second }}</p></div>',
  }),
};
