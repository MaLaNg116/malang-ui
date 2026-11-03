import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UiPopover from '../../src/components/UiPopover.vue';
import UiButton from '../../src/components/UiButton.vue';
import UiInput from '../../src/components/UiInput.vue';
import UiDialog from '../../src/components/UiDialog.vue';

const meta = {
  title: '基础组件/Popover 气泡', component: UiPopover, tags: ['autodocs'],
  args: { modelValue: false, label: '编辑备注', triggerLabel: '打开编辑气泡', placement: 'bottom', disabled: false },
  parameters: { docs: { description: { component: '基于原生 Popover API 的非模态浮层，保留所在区域主题，并通过 Floating UI 跟随锚点、翻转与避让视口边缘。默认内容插槽提供 close()；trigger 插槽仅承载按钮内的文字或图标。Escape 与外部点击可以退出；不锁定背景滚动或困住焦点。需要支持 Popover API 的现代浏览器。' } } },
  argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] } },
  render: args => defineComponent({
    components: { UiPopover, UiButton, UiInput },
    setup() {
      const open = ref(args.modelValue), note = ref('以留白衬托内容。'), status = ref('备注仅在当前预览中生效。');
      watch(() => args.modelValue, value => { open.value = value; });
      function save(close: () => void) { status.value = `备注已更新：${note.value || '空备注'}`; close(); }
      return { args, open, note, status, save };
    },
    template: `<main class="kit-stack"><h1 style="font:500 30px/1.4 var(--ui-font-family-display)">在原处，展开一步。</h1><p class="kit-muted">使用触发按钮、Escape、外部输入框，检查非模态浮层的进退。</p><div class="kit-row"><UiPopover v-bind="args" v-model="open"><template #default="{ close }"><div style="display:grid;gap:20px"><UiInput v-model="note" label="备注内容" maxlength="60" /><div class="kit-row"><UiButton @click="save(close)">保存备注</UiButton><UiButton variant="ghost" @click="close">取消备注</UiButton></div></div></template></UiPopover></div><UiInput label="外部输入框" placeholder="气泡打开时也可点击这里" style="max-width:340px;margin-top:220px" /><p role="status" class="kit-muted">{{ status }}</p></main>`,
  }),
} satisfies Meta<typeof UiPopover>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };

export const EdgeAndScroll: Story = {
  name: '视口边缘与滚动跟随',
  render: () => defineComponent({
    components: { UiPopover }, setup: () => ({ open: ref(false) }),
    template: `<main class="kit-stack"><p class="kit-muted">锚点贴近滚动区域右侧；滚动时气泡跟随，边缘空间不足时翻转避让。</p><div style="height:260px;overflow:auto;border:1px solid var(--ui-color-border);padding:18px"><div style="height:600px;padding-top:160px;display:flex;justify-content:flex-end;align-items:flex-start"><UiPopover v-model="open" label="边缘说明" trigger-label="打开边缘气泡" placement="right"><p style="margin:0;line-height:1.8">气泡不会扩大整页宽度。可滚动此区域，也可以调整预览窗口大小。</p></UiPopover></div></div></main>`,
  }),
};

export const Controlled: Story = {
  name: '受控关闭请求',
  render: () => defineComponent({
    components: { UiPopover, UiButton },
    setup() {
      const open = ref(false), requests = ref(0), accepted = ref(true);
      function update(value: boolean) { requests.value++; if (accepted.value || value) open.value = value; }
      return { open, requests, accepted, update };
    },
    template: `<div class="kit-stack"><div class="kit-row"><UiButton variant="secondary" @click="accepted = !accepted">{{ accepted ? '改为拒绝关闭' : '允许关闭' }}</UiButton><span>更新请求：{{ requests }}</span></div><UiPopover :model-value="open" label="受控气泡" trigger-label="打开受控气泡" @update:model-value="update"><template #default="{ close }"><p style="margin:0 0 16px">父页面可以决定是否接受关闭请求。</p><UiButton @click="close">请求关闭气泡</UiButton></template></UiPopover><p class="kit-muted">{{ accepted ? '父页面接受关闭请求。' : '父页面保留打开状态，仍可再次请求。' }}</p></div>`,
  }),
};

export const InDialog: Story = {
  name: '对话框中的气泡',
  render: () => defineComponent({
    components: { UiPopover, UiButton, UiDialog }, setup: () => ({ dialog: ref(false), popover: ref(false) }),
    template: `<div class="kit-stack"><UiButton @click="dialog = true">打开含气泡的对话框</UiButton><UiDialog v-model="dialog" title="编辑说明"><UiPopover v-model="popover" label="行内说明" trigger-label="打开行内气泡"><p style="margin:0;line-height:1.8">气泡保留对话框的主题。先按 Escape 退出气泡，再按一次退出对话框。</p></UiPopover><template #footer="{ close }"><UiButton @click="close">关闭编辑说明</UiButton></template></UiDialog></div>`,
  }),
};

export const ControlledFocus: Story = {
  name: '拒绝请求后的外部焦点',
  render: () => defineComponent({
    components: { UiPopover, UiButton, UiInput },
    setup() {
      const open = ref(false);
      const requests = ref(0);
      const outside = ref('继续外部任务');
      const inside = ref('气泡中的内容');
      const request = () => { requests.value++; };
      return { open, requests, outside, inside, request };
    },
    template: `<main class="kit-stack"><h1 style="font:500 30px/1.4 var(--ui-font-family-display)">焦点跟随当下的操作。</h1><p class="kit-muted">此例拒绝触发按钮的打开与关闭请求。之后由页面程序改变状态时，应保留外部正在编辑的焦点。</p><div class="kit-row"><UiButton variant="secondary" :disabled="open" @click="open = true">程序打开焦点气泡</UiButton><UiButton variant="secondary" :disabled="!open" @click="open = false">程序关闭焦点气泡</UiButton></div><UiPopover :model-value="open" label="受控焦点说明" trigger-label="请求打开焦点气泡" @update:model-value="request"><UiInput v-model="inside" label="气泡内输入框" /></UiPopover><UiInput v-model="outside" label="焦点示例外部输入框" style="max-width:340px;margin-top:180px" /><p class="kit-muted" data-testid="popover-focus-requests">焦点示例请求：{{ requests }} 次</p></main>`,
  }),
};
