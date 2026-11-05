import { defineComponent, onBeforeUnmount, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MPopconfirm from '../../src/components/MPopconfirm.vue';
import { MButton, MCard, MInput, MSelect, MSwitch } from '../../src';
import type { MChoiceOption } from '../../src';

const meta = {
  title: '反馈组件/Popconfirm 气泡确认', component: MPopconfirm, tags: ['autodocs'],
  args: { modelValue: false, title: '确认归档这份卷宗？', description: '只在当前预览确认操作，外部草稿继续保留。', triggerLabel: '归档卷宗', confirmText: '确认归档', cancelText: '保留草稿', placement: 'top', disabled: false, danger: false },
  argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] }, beforeConfirm: { control: false } },
  parameters: { docs: { description: { component: '原生 Popover 与 Floating UI 构成的非模态轻确认。trigger 插槽只放图标或文字；键盘开启先聚焦取消，Tab 可离开气泡。confirm(MouseEvent)、cancel(MouseEvent/KeyboardEvent或无事件)与update:modelValue分别表达确认、用户退出与受控开关请求；外部点击退出不会拉回焦点。beforeConfirm(signal)返回false保留打开，抛出或拒绝时显示错误并emit confirm-error(unknown)。等待期间合并重复确认、允许取消；取消、关闭、禁用或卸载会中止本轮signal，仍忽略不响应signal的迟到结果。已完成的业务数据更新放在confirm中。danger只把危险确认动作改为错误语义色。' } } },
  render: args => defineComponent({
    components: { MPopconfirm, MCard, MInput },
    setup() {
      const open = ref(args.modelValue), draft = ref('山川稿 · 尚未归档'), confirmations = ref(0), cancellations = ref(0);
      watch(() => args.modelValue, value => { open.value = value; });
      return { args, open, draft, confirmations, cancellations };
    },
    template: '<main class="kit-stack" style="max-width:640px"><MCard title="待校对卷宗"><p>在原处确认下一步，保留手中的编辑。</p><template #footer><MPopconfirm v-bind="args" v-model="open" @confirm="confirmations++" @cancel="cancellations++"/></template></MCard><MInput v-model="draft" label="确认气泡外的草稿"/><output data-popconfirm-result>确认：{{ confirmations }}；取消：{{ cancellations }}</output></main>',
  }),
} satisfies Meta<typeof MPopconfirm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Danger: Story = { args: { title: '移除这份本地记录？', description: '请确认已经保留需要的内容。演示只记录本页确认次数。', triggerLabel: '移除记录', confirmText: '确认移除', cancelText: '保留记录', danger: true } };
export const AsyncConfirmation: Story = { render: () => defineComponent({
  components: { MPopconfirm, MButton, MInput, MSelect },
  setup() {
    const open = ref(false), show = ref(true), mode = ref('success'), draft = ref('等待确认期间继续编辑');
    const attempts = ref(0), confirmations = ref(0), cancellations = ref(0), errors = ref(0), aborted = ref(0), lastEvent = ref('无');
    const modes: MChoiceOption[] = [{ value: 'success', label: '通过确认' }, { value: 'deny', label: '返回 false 保留' }, { value: 'error', label: '报告校对错误' }, { value: 'late', label: '保留迟到结果（忽略取消）' }];
    const jobs = new Map<ReturnType<typeof setTimeout>, { resolve: (value: boolean) => void; signal: AbortSignal; abort: () => void }>();
    function beforeConfirm(signal: AbortSignal) {
      attempts.value++; const outcome = mode.value;
      return new Promise<boolean>((resolve, reject) => {
        const cleanup = () => { clearTimeout(timer); jobs.delete(timer); signal.removeEventListener('abort', abort); };
        const abort = () => { aborted.value++; if (outcome !== 'late') { cleanup(); resolve(false); } };
        const timer = setTimeout(() => { cleanup(); if (outcome === 'error') reject(new Error('本地校对暂未完成，请重试。')); else resolve(outcome !== 'deny'); }, 1200);
        jobs.set(timer, { resolve, signal, abort }); signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort();
      });
    }
    function confirmed(event: MouseEvent) { confirmations.value++; lastEvent.value = event.type; }
    function toggleMount() { show.value = !show.value; if (!show.value) open.value = false; }
    onBeforeUnmount(() => { for (const [timer, job] of jobs) { clearTimeout(timer); job.signal.removeEventListener('abort', job.abort); job.resolve(false); } jobs.clear(); });
    return { open, show, mode, modes, draft, attempts, confirmations, cancellations, errors, aborted, lastEvent, beforeConfirm, confirmed, toggleMount };
  },
  template: '<main class="kit-stack" style="max-width:640px"><h2>等到确认，再推进一步。</h2><p>本地等待 1.2 秒后返回所选结果，不请求服务器。普通模式响应取消信号；迟到模式刻意忽略信号，用于演练结果隔离。</p><MSelect v-model="mode" :options="modes" label="确认策略"/><div class="kit-row"><MPopconfirm v-if="show" v-model="open" title="提交这次校对？" description="等待时仍可取消，失败后可在原处重试。" trigger-label="提交校对" confirm-text="确认提交" cancel-text="取消提交" :before-confirm="beforeConfirm" @confirm="confirmed" @cancel="cancellations++" @confirm-error="errors++"/><MButton variant="ghost" @click="toggleMount">{{ show ? \'卸载确认组件\' : \'挂载确认组件\' }}</MButton></div><MInput v-model="draft" label="异步确认外的草稿"/><output data-popconfirm-async>尝试：{{ attempts }}；确认：{{ confirmations }}；取消：{{ cancellations }}；错误：{{ errors }}；事件：{{ lastEvent }}；中止：{{ aborted }}</output></main>',
}) };
export const Controlled: Story = { render: () => defineComponent({
  components: { MPopconfirm, MButton, MInput, MSwitch },
  setup() {
    const open = ref(false), acceptOpen = ref(false), acceptClose = ref(false), disabled = ref(false), draft = ref('程序更新后保留的草稿');
    const requests = ref(0), confirmations = ref(0), cancellations = ref(0);
    function update(value: boolean) { requests.value++; if (value ? acceptOpen.value : acceptClose.value) open.value = value; }
    return { open, acceptOpen, acceptClose, disabled, draft, requests, confirmations, cancellations, update };
  },
  template: '<main class="kit-stack" style="max-width:640px"><h2>由页面确认开合。</h2><MSwitch v-model="acceptOpen" label="接受打开请求"/><MSwitch v-model="acceptClose" label="接受关闭请求"/><MSwitch v-model="disabled" label="禁用气泡确认"/><div class="kit-row"><MButton variant="secondary" @click="open = true">程序打开确认</MButton><MButton variant="secondary" @click="open = false">程序关闭确认</MButton></div><MPopconfirm :model-value="open" title="受控确认归档？" trigger-label="请求确认归档" confirm-text="确认受控归档" cancel-text="取消受控归档" :disabled="disabled" @update:model-value="update" @confirm="confirmations++" @cancel="cancellations++"/><MInput v-model="draft" label="受控确认外的草稿"/><output data-popconfirm-controlled>请求：{{ requests }}；确认：{{ confirmations }}；取消：{{ cancellations }}；父模型：{{ open }}</output></main>',
}) };
export const EdgeAndLongContent: Story = { render: () => defineComponent({
  components: { MPopconfirm, MInput },
  setup: () => ({ open: ref(false), draft: ref('窄屏中保留的草稿'), description: 'archives/山川稿/修订材料与来源说明/'.repeat(28) }),
  template: '<main class="kit-stack"><p>靠近边缘时翻转避让。长说明可在气泡内滚动，取消和确认仍可操作。</p><div style="height:260px;overflow:auto;padding:16px;border:1px solid var(--ui-color-rule)"><div style="height:620px;display:flex;justify-content:flex-end;align-items:flex-start;padding-top:160px"><MPopconfirm v-model="open" title="移除长名称记录？" :description="description" trigger-label="检查长记录" confirm-text="确认移除长记录" cancel-text="保留长记录" placement="right" danger/></div></div><MInput v-model="draft" label="长确认外的草稿"/></main>',
}) };
export const ReducedMotion: Story = { globals: { motion: 'reduced' } };
