import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref, watch } from 'vue';
import { MInput } from '../../src/components';

const meta = {
  title: '基础组件/Input 输入框',
  component: MInput,
  tags: ['autodocs'],
  args: {
    modelValue: '',
    label: '工作空间名称',
    hint: '支持中文、英文和数字。',
    disabled: false,
    type: 'text',
  },
  render: (args) => defineComponent({
    components: { MInput },
    setup() {
      const value = ref(args.modelValue || '');
      watch(() => args.modelValue, (next) => { value.value = next || ''; });
      return { args, value };
    },
    template: `<div style="width:min(100%,400px);display:grid;gap:12px">
      <MInput v-bind="args" v-model="value" placeholder="例如：我的创作空间" autocomplete="organization" maxlength="40" />
      <p style="margin:0;font-size:12px;color:var(--ui-color-text-secondary)">当前输入：{{ value || '尚未输入' }}</p>
    </div>`,
  }),
} satisfies Meta<typeof MInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = { args: { modelValue: '我的创作空间' } };
export const Error: Story = { args: { modelValue: '已使用的名称', error: '该名称已被使用，请换一个。' } };
export const Disabled: Story = { args: { modelValue: '只读预览空间', disabled: true } };

export const FormAttributes: Story = {
  render: () => defineComponent({
    components: { MInput },
    setup: () => ({ value: ref('') }),
    template: `<form style="width:min(100%,400px)" @submit.prevent>
      <MInput v-model="value" label="联系邮箱" type="email" name="email" autocomplete="email" required placeholder="you@example.com" hint="原生 name、required、autocomplete 等属性会传给输入框。" />
    </form>`,
  }),
};

export const CompositionWithChangingHint: Story = {
  render: () => defineComponent({
    components: { MInput },
    setup() {
      const value = ref('');
      const hint = ref('使用中文输入法开始输入，提示会在组合期间更新。');
      const updates = ref(0);
      function startComposition() {
        hint.value = '提示已更新：未提交的组合文本应保持在输入框中。';
      }
      function updateValue(next: string) {
        value.value = next;
        updates.value += 1;
      }
      return { value, hint, updates, startComposition, updateValue };
    },
    template: `<div style="width:min(100%,400px);display:grid;gap:12px">
      <MInput :model-value="value" label="中文组合输入" :hint="hint" @compositionstart="startComposition" @update:model-value="updateValue" />
      <p data-testid="committed-value" style="margin:0;font-size:12px;color:var(--ui-color-text-secondary)">已提交：{{ value || '尚未提交' }}</p>
      <p data-testid="model-update-count" style="margin:0;font-size:12px;color:var(--ui-color-text-secondary)">模型更新：{{ updates }} 次</p>
    </div>`,
  }),
};
