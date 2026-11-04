import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDropdownMenu from '../../src/components/MDropdownMenu.vue';
import MButton from '../../src/components/MButton.vue';
import MInput from '../../src/components/MInput.vue';
import MSwitch from '../../src/components/MSwitch.vue';
import type { MDropdownMenuItem } from '../../src/components/types';

const items: MDropdownMenuItem[] = [
  { value: 'edit', label: '编辑档案', shortcut: '↵' },
  { value: 'duplicate', label: '复制副本' },
  { value: 'export', label: '导出文件', disabled: true },
  { type: 'separator', key: 'archive' },
  { value: 'archive', label: '归入旧卷', danger: true },
];
const meta = {
  title: '二级组件/DropdownMenu 操作菜单', component: MDropdownMenu, tags: ['autodocs'],
  args: { modelValue: false, items, label: '档案操作', triggerLabel: '打开档案菜单', placement: 'bottom', disabled: false },
  argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] } },
  parameters: { docs: { description: { component: '切角清单、朱砂游标与轻量机械归位，承载一组操作命令。触发按钮内的文字与图标可由 #trigger 替换。每个操作 value、分隔项 key 应在组内唯一；shortcut 是可选的视觉提示，实际快捷键由调用方绑定。点击操作发出 select(value) 并请求关闭。方向键、Home/End 与英文前缀定位会跳过禁用项；Enter/空格确认，Escape 回到触发按钮，Tab 继续页面原生焦点顺序。程序改变受控状态不会沿用已拒绝请求的焦点意图。需要支持原生 Popover API 的现代浏览器。' } } },
  render: args => defineComponent({
    components: { MDropdownMenu, MButton, MInput },
    setup() {
      const open = ref(args.modelValue), result = ref('等待选择一项档案操作。');
      watch(() => args.modelValue, value => { open.value = value; });
      return { args, open, result, selected: (value: string) => { result.value = `已选择：${value}`; } };
    },
    template: `<main class="kit-stack"><h1 style="font:500 30px/1.4 var(--ui-font-family-display)">令出有章，进退有序。</h1><p class="kit-muted">操作收于一处，落点始终清晰。使用方向键、Enter、Escape 或 Tab 检查进退。</p><div class="kit-row" style="padding-block:30px"><MButton variant="ghost">菜单前一项</MButton><MDropdownMenu v-bind="args" v-model="open" @select="selected" /><MButton variant="ghost">菜单后一项</MButton></div><p role="status" class="kit-muted">{{ result }}</p><div style="max-width:320px;margin-top:220px"><MInput label="菜单外部输入框" placeholder="点击这里继续编辑" /></div></main>`,
  }),
} satisfies Meta<typeof MDropdownMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const AllDisabled: Story = { name: '全部禁用', args: { items: [{ value: 'edit', label: '编辑档案', disabled: true }, { value: 'export', label: '导出文件', disabled: true }] } };
export const Empty: Story = { name: '空操作列表', args: { items: [] } };
export const LongContent: Story = { name: '长清单与边缘避让', args: { label: '长清单', triggerLabel: '打开长清单', placement: 'right', items: Array.from({ length: 18 }, (_, index) => ({ value: `archive-${index + 1}`, label: index === 17 ? '最后一份档案' : `${index + 1} · 档案名称随内容自然换行 LongArchiveWithoutArtificialClipping`, disabled: index === 5 })) } };
export const KeyboardSearch: Story = { name: '英文前缀定位', args: { items: [{ value: 'archive', label: 'Archive' }, { value: 'blocked', label: 'Blocked', disabled: true }, { value: 'duplicate', label: 'Duplicate' }, { value: 'delete', label: 'Delete', danger: true }, { value: 'export', label: 'Export' }] } };
export const Controlled: Story = {
  name: '拒绝请求与程序控制',
  render: () => defineComponent({
    components: { MDropdownMenu, MButton, MInput, MSwitch },
    setup() {
      const open = ref(false), requests = ref(0), accepted = ref(false), outside = ref('继续外部编辑'), selected = ref('尚未选择');
      function update(value: boolean) { requests.value++; if (accepted.value) open.value = value; }
      return { open, requests, accepted, outside, selected, items, update };
    },
    template: `<main class="kit-stack"><h1 style="font:500 30px/1.4 var(--ui-font-family-display)">每次请求，都有当下的落点。</h1><MSwitch v-model="accepted" label="接受菜单更新请求" /><div class="kit-row"><MButton variant="secondary" :disabled="open" @click="open = true">程序打开菜单</MButton><MButton variant="secondary" :disabled="!open" @click="open = false">程序关闭菜单</MButton></div><MDropdownMenu :model-value="open" :items="items" label="受控档案操作" trigger-label="请求打开受控菜单" @update:model-value="update" @select="selected = $event" /><p data-testid="menu-requests">更新请求：{{ requests }} 次</p><p role="status">已选择：{{ selected }}</p><div style="max-width:320px;margin-top:160px"><MInput v-model="outside" label="受控菜单外部输入框" /></div></main>`,
  }),
};
export const UnmountCleanup: Story = {
  name: '卸载与重新挂载',
  render: () => defineComponent({
    components: { MDropdownMenu, MButton },
    setup: () => ({ mounted: ref(true), open: ref(false), selected: ref('尚未选择'), items }),
    template: `<main class="kit-stack"><MButton variant="secondary" @click="mounted = !mounted; open = false">{{ mounted ? '卸载菜单' : '重新挂载菜单' }}</MButton><MDropdownMenu v-if="mounted" v-model="open" :items="items" label="可卸载档案操作" trigger-label="打开可卸载菜单" @select="selected = $event" /><p role="status">已选择：{{ selected }}</p></main>`,
  }),
};
