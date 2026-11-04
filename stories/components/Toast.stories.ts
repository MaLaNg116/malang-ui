import { defineComponent, nextTick, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MToast from '../../src/components/MToast.vue';
import MToastViewport from '../../src/components/MToastViewport.vue';
import { MButton, MInput, MSelect, MSwitch } from '../../src/components';
import type { MToastPlacement } from '../../src/components';

const meta = {
  title: '基础组件/Toast 轻提示',
  component: MToast,
  tags: ['autodocs'],
  args: { modelValue: false, title: '设置已保存', description: '新的配置已经应用，可以继续创作。', variant: 'success', closeLabel: '关闭通知', presentation: 'notification', closable: true },
  parameters: { docs: { description: { component: '受控的单条轻提示，每个实例管理自己的剩余时间。duration=0 保持显示；悬停、键盘焦点或页面隐藏时暂停，解除全部原因后继续。通知不抢焦点；独立的稳定 live regions 负责消息播报。MToastViewport 仅提供主题范围内的浮层布局，不创建全局单例。' } } },
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'error'] },
    presentation: { control: 'inline-radio', options: ['notification', 'message'], description: '通知卡片或单句轻提示，保留同一受控与播报模型。' },
    closable: { control: 'boolean', description: '是否显示关闭按钮；默认显示，短时轻提示可省略。' },
    duration: { control: { type: 'number', min: 0, step: 500 }, description: '自动关闭的毫秒数；未设置时轻提示3000ms、通知5000ms，错误持续显示。0 表示持续显示。' },
  },
  render: args => defineComponent({
    components: { MToast, MToastViewport, MButton, MInput },
    setup() {
      const open = ref(args.modelValue);
      const note = ref('继续编辑中的内容');
      watch(() => args.modelValue, value => { open.value = value; });
      async function show() { open.value = false; await nextTick(); open.value = true; }
      return { args, open, note, show };
    },
    template: `<main class="kit-stack"><p class="kit-mono kit-muted" style="font-size:11px;letter-spacing:1px">TOAST / 一次清楚的回应</p><h1 style="font-family:var(--ui-font-family-display);font-size:32px">消息落定，继续手中的事。</h1><p class="kit-muted">提示出现时保留当前焦点；鼠标悬停或聚焦关闭按钮，可以安心阅读。</p><MInput v-model="note" label="通知外输入框" style="max-width:400px" /><div class="kit-row"><MButton @click="show">显示保存通知</MButton></div><p class="kit-muted">{{ open ? '本页配置已保存。' : '当前没有显示的通知。' }}</p><MToastViewport><MToast v-bind="args" v-model="open" /></MToastViewport></main>`,
  }),
} satisfies Meta<typeof MToast>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Persistent: Story = { args: { duration: 0, title: '操作说明已就绪', description: '这条消息会保留，直到你手动关闭。' } };

export const Variants: Story = {
  render: () => defineComponent({
    components: { MToast, MToastViewport, MButton },
    setup: () => ({ info: ref(false), success: ref(false), error: ref(false) }),
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">不同状态，同样清楚。</h1><div class="kit-row"><MButton @click="info = success = error = true">显示三种通知</MButton></div><p class="kit-muted">普通与成功消息使用礼貌播报，错误消息使用即时提醒；每条可以独立关闭。</p><MToastViewport><MToast v-model="info" title="资料已就绪" description="可以开始查看新的设计资料。" :duration="0" /><MToast v-model="success" variant="success" title="草稿已归档" description="这一次创作已经留存。" :duration="0" /><MToast v-model="error" variant="error" title="保存未完成" description="请检查连接后重试，已填写内容仍保留。" /></MToastViewport></div>`,
  }),
};

export const Pause: Story = {
  render: () => defineComponent({
    components: { MToast, MToastViewport, MButton, MInput },
    setup() {
      const open = ref(false); const note = ref('把焦点放回这里继续计时');
      async function show() { open.value = false; await nextTick(); open.value = true; }
      return { open, note, show };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">读完，再继续。</h1><p class="kit-muted">显示 1200ms；悬停、键盘焦点与页面隐藏分别暂停，全部解除后才恢复剩余时间。</p><MInput v-model="note" label="通知外输入框" style="max-width:400px" /><div class="kit-row"><MButton @click="show">显示暂停示例</MButton></div><p data-testid="toast-pause-state" class="kit-muted">{{ open ? '通知显示中' : '通知已关闭' }}</p><MToastViewport><MToast v-model="open" title="暂停中的通知" description="可以将鼠标移到这里，再聚焦关闭按钮。" :duration="1200" /></MToastViewport></div>`,
  }),
};

export const Replacement: Story = {
  render: () => defineComponent({
    components: { MToast, MToastViewport, MButton },
    setup() {
      const open = ref(false); const version = ref(1);
      async function show() { open.value = false; version.value = 1; await nextTick(); open.value = true; }
      const replace = () => { version.value++; };
      return { open, version, show, replace };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">新消息，重新留出阅读时间。</h1><div class="kit-row"><MButton @click="show">显示可替换通知</MButton><MButton variant="secondary" :disabled="!open" @click="replace">替换当前消息</MButton></div><p class="kit-muted">每条新消息重新获得 1200ms；暂停状态仍会保留。</p><MToastViewport><MToast v-model="open" :title="version === 1 ? '第一条消息' : '第' + version + '条消息'" :description="'当前消息编号：' + version" :duration="1200" /></MToastViewport></div>`,
  }),
};

export const Controlled: Story = {
  render: () => defineComponent({
    components: { MToast, MToastViewport, MButton },
    setup() {
      const open = ref(false); const requests = ref(0);
      const request = () => { requests.value++; };
      async function show() { open.value = false; requests.value = 0; await nextTick(); open.value = true; }
      return { open, requests, request, show };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">关闭由页面确认。</h1><div class="kit-row"><MButton @click="show">显示受控通知</MButton><MButton variant="secondary" :disabled="!open" @click="open = false">接受关闭请求</MButton><MButton variant="ghost" @click="show">清零并重开</MButton></div><p data-testid="toast-close-requests" class="kit-muted">关闭请求：{{ requests }} 次</p><p class="kit-muted">本例先保留消息，只记录请求。650ms 到期仅请求一次，手动关闭仍可以再次请求。</p><MToastViewport><MToast :model-value="open" title="等待页面确认" description="关闭请求不会擅自改变父级状态。" :duration="650" @update:model-value="request" /></MToastViewport></div>`,
  }),
};

export const Multiple: Story = {
  render: () => defineComponent({
    components: { MToast, MToastViewport, MButton },
    setup() {
      const first = ref(false); const second = ref(false);
      async function show() { first.value = second.value = false; await nextTick(); first.value = second.value = true; }
      return { first, second, show };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">各自计时，彼此独立。</h1><div class="kit-row"><MButton @click="show">同时显示两条通知</MButton></div><p class="kit-muted">第一条 900ms，第二条 1600ms。暂停或关闭其中一条，不会改变另一条。</p><MToastViewport><MToast v-model="first" variant="success" title="归档已完成" :duration="900" /><MToast v-model="second" title="资料处理中" :duration="1600" /></MToastViewport></div>`,
  }),
};

export const UnmountCleanup: Story = {
  render: () => defineComponent({
    components: { MToast, MToastViewport, MButton },
    setup() {
      const mounted = ref(true); const open = ref(false); const requests = ref(0);
      const update = (value: boolean) => { requests.value++; open.value = value; };
      async function show() { mounted.value = false; open.value = false; requests.value = 0; await nextTick(); mounted.value = true; open.value = true; }
      const remount = () => { mounted.value = true; open.value = true; };
      return { mounted, open, requests, update, show, remount };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">离开时，不留下等待。</h1><div class="kit-row"><MButton @click="show">显示可卸载通知</MButton><MButton variant="secondary" :disabled="!mounted" @click="mounted = false">卸载当前通知</MButton><MButton variant="ghost" @click="remount">重新挂载通知</MButton></div><p data-testid="toast-unmount-requests" class="kit-muted">关闭请求：{{ requests }} 次</p><p class="kit-muted">650ms 内卸载后，不应再收到旧实例的关闭请求。</p><MToastViewport><MToast v-if="mounted" :model-value="open" title="等待中的临时通知" :duration="650" @update:model-value="update" /></MToastViewport></div>`,
  }),
};

export const LongContent: Story = {
  render: () => defineComponent({
    components: { MToast, MToastViewport, MButton },
    setup() {
      const open = ref(false);
      const title = '设计档案已更新 · ' + 'WORKSPACE'.repeat(12);
      const description = '这段较长的资料说明会保留完整内容，并在需要时独立滚动。'.repeat(22);
      return { open, title, description };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">长消息，也留有出口。</h1><div class="kit-row"><MButton @click="open = true">显示长消息</MButton></div><p class="kit-muted">右上方显示持续通知，长标题会换行，说明可以滚动；关闭按钮始终可用。</p><MToastViewport placement="top-end" label="阅读通知"><MToast v-model="open" :title="title" :description="description" :duration="0" /></MToastViewport></div>`,
  }),
};

export const TopCenter: Story = {
  name: '顶部居中',
  render: () => defineComponent({
    components: { MToast, MToastViewport, MButton, MInput, MSwitch },
    setup() {
      const open = ref(false), draft = ref('正在编辑的顶部通知草稿'), long = ref(false);
      const longTitle = '顶部消息 · ' + 'ArchiveReference'.repeat(14);
      const longDescription = '完整的资料说明保留在通知内，内容过长时可以独立滚动，关闭按钮始终可用。'.repeat(24);
      async function show() { open.value = false; await nextTick(); open.value = true; }
      return { open, draft, long, longTitle, longDescription, show };
    },
    template: `<main class="kit-stack" style="max-width:640px"><h1 style="font:500 32px/1.5 var(--ui-font-family-display)">轻轻回应，继续手中的事。</h1><p class="kit-muted">顶部居中的单句提示显示3秒，不打断编辑。长消息保留手动关闭与独立滚动。</p><MInput v-model="draft" label="顶部通知外的草稿" /><MSwitch v-model="long" label="使用长通知内容" /><div class="kit-row"><MButton @click="show">显示顶部居中通知</MButton></div><p class="kit-muted">{{ open ? '顶部通知显示中。' : '当前没有显示的顶部通知。' }}</p><MToastViewport placement="top-center" label="顶部通知"><MToast v-model="open" presentation="message" variant="success" :title="long ? longTitle : '资料已更新，可以继续编辑。'" :description="long ? longDescription : undefined" :duration="long ? 0 : 3000" :closable="long" close-label="关闭顶部通知" /></MToastViewport></main>`,
  }),
};

export const Positions: Story = {
  name: '六个通知位置',
  render: () => defineComponent({
    components: { MToast, MToastViewport, MButton, MInput, MSelect, MSwitch },
    setup() {
      const open = ref(false), draft = ref('位置切换时保留的编辑草稿'), rtl = ref(false);
      const placement = ref<MToastPlacement>('bottom-end');
      const options = [
        { value: 'top-start', label: '顶部 · 起始侧' }, { value: 'top-center', label: '顶部 · 居中' }, { value: 'top-end', label: '顶部 · 末尾侧' },
        { value: 'bottom-start', label: '底部 · 起始侧' }, { value: 'bottom-center', label: '底部 · 居中' }, { value: 'bottom-end', label: '底部 · 末尾侧' },
      ];
      return { open, draft, rtl, placement, options };
    },
    template: `<main class="kit-stack" :dir="rtl ? 'rtl' : 'ltr'" style="max-width:640px"><h1 style="font:500 32px/1.5 var(--ui-font-family-display)">落点可换，消息仍是这一条。</h1><p class="kit-muted">选择六个位置中的一个。起始侧与末尾侧跟随阅读方向，位置变化不重新播报消息，也不接管输入焦点。</p><MSelect v-model="placement" :options="options" label="通知位置" /><MSwitch v-model="rtl" label="从右向左阅读" /><MInput v-model="draft" label="位置通知外的草稿" /><div class="kit-row"><MButton @click="open = true">显示位置通知</MButton></div><p class="kit-muted">{{ open ? '同一条通知持续显示，可以继续切换位置。' : '当前没有显示的位置通知。' }}</p><MToastViewport :placement="placement" label="位置通知"><MToast v-model="open" title="位置通知已就绪" description="落点已经调整，手中的编辑内容会继续保留。" :duration="0" close-label="关闭位置通知" /></MToastViewport></main>`,
  }),
};
