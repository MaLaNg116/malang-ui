import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref, watch } from 'vue';
import { MButton, MInput, MSwitch } from '../../src/components';

const meta = {
  title: '基础组件/Switch 开关',
  component: MSwitch,
  tags: ['autodocs'],
  args: { modelValue: true, label: '增强交互动效', hint: '保持状态切换的空间连续性。', disabled: false },
  render: (args) => defineComponent({
    components: { MSwitch },
    setup() {
      const enabled = ref(args.modelValue);
      watch(() => args.modelValue, (next) => { enabled.value = next; });
      return { args, enabled };
    },
    template: `<div style="display:grid;gap:16px">
      <MSwitch v-bind="args" v-model="enabled" />
      <p role="status" style="margin:0;font-size:12px;color:var(--ui-color-text-secondary)">{{ enabled ? '增强动效已开启' : '增强动效已关闭' }}</p>
    </div>`,
  }),
} satisfies Meta<typeof MSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Off: Story = { args: { modelValue: false } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledOff: Story = { args: { disabled: true, modelValue: false } };

export const WorkspaceForm: Story = {
  render: () => defineComponent({
    components: { MButton, MInput, MSwitch },
    setup() {
      const name = ref('我的创作空间');
      const enhanced = ref(true);
      const saved = ref(false);
      const error = ref('');
      function submit() {
        error.value = name.value.trim() ? '' : '请填写工作空间名称。';
        saved.value = !error.value;
      }
      return { name, enhanced, saved, error, submit };
    },
    template: `<form @submit.prevent="submit" style="width:min(100%,420px);display:grid;gap:24px;padding:24px;border:1px solid var(--ui-color-border);border-radius:var(--ui-radius-panel);background:var(--ui-color-surface)">
      <div><p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;color:var(--ui-color-accent)">WORKSPACE / SETTINGS</p><h2 style="margin:0;font-size:24px;font-weight:500">工作空间设置</h2></div>
      <MInput v-model="name" label="工作空间名称" :error="error" name="workspaceName" />
      <MSwitch v-model="enhanced" label="增强交互动效" hint="可随时切换，重要操作保持及时响应。" />
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><MButton type="submit">保存设置 ↗</MButton><span role="status" style="font-size:12px;color:var(--ui-color-success)">{{ saved ? '设置已保存' : '' }}</span></div>
    </form>`,
  }),
};
