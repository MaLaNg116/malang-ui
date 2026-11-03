import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UiCheckbox from '../../src/components/UiCheckbox.vue';
import UiButton from '../../src/components/UiButton.vue';

const meta = {
  title: '基础组件/Checkbox 复选框', component: UiCheckbox, tags: ['autodocs'],
  args: { modelValue: false, label: '接收更新提醒', hint: '有新的组件和设计手记时通知我。', indeterminate: false, disabled: false },
  parameters: { docs: { description: { component: '原生复选框，保留 name、value、required 等表单属性。indeterminate 为调用方维护的视觉中间态，不改变表单提交值；完成全选操作后应同步更新该状态。受控更新被拒绝时恢复原选中值。' } } },
  render: args => defineComponent({ components: { UiCheckbox }, setup() { const checked = ref(args.modelValue); watch(() => args.modelValue, value => { checked.value = value; }); return { args, checked }; }, template: '<div class="kit-stack"><UiCheckbox v-bind="args" v-model="checked" /><p class="kit-muted">当前状态：{{ checked ? "已选择" : "未选择" }}</p></div>' }),
} satisfies Meta<typeof UiCheckbox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = { args: { error: '请确认此项后继续。' } };
export const Disabled: Story = { args: { modelValue: true, disabled: true } };
export const Indeterminate: Story = {
  name: '部分选择',
  render: () => defineComponent({ components: { UiCheckbox }, setup: () => ({ checked: ref(false), mixed: ref(true) }), template: '<div class="kit-stack"><UiCheckbox :model-value="checked" :indeterminate="mixed" label="选择全部档案" hint="当前只选择了部分档案。" @update:model-value="checked = $event; mixed = false" /><p class="kit-muted">{{ mixed ? "部分选择" : checked ? "全部选择" : "全部取消" }}</p></div>' }),
};
export const FormAttributes: Story = {
  name: '原生表单提交',
  render: () => defineComponent({
    components: { UiCheckbox, UiButton },
    setup() { const checked = ref(false); const message = ref('尚未提交'); function submit(event: Event) { const data = new FormData(event.target as HTMLFormElement); message.value = `条款值：${data.get('terms') || '未选择'}`; } return { checked, message, submit }; },
    template: '<form class="kit-stack" @submit.prevent="submit"><UiCheckbox v-model="checked" label="接受使用条款" name="terms" value="yes" required hint="这是原生 required 校验与 FormData 示例。" /><div><UiButton type="submit">提交选择</UiButton></div><p role="status">{{ message }}</p></form>',
  }),
};
export const Controlled: Story = {
  name: '受控更新',
  render: () => defineComponent({ components: { UiCheckbox }, setup: () => ({ requests: ref(0) }), template: '<div class="kit-stack"><UiCheckbox :model-value="false" label="由父页面确认选择" hint="父页面记录请求但暂不确认，界面会恢复未选择。" @update:model-value="requests++" /><p role="status">更新请求：{{ requests }} 次</p></div>' }),
};
