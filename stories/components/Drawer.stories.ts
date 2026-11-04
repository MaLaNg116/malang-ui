import { defineComponent, ref, useId, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDrawer from '../../src/components/MDrawer.vue';
import MDialog from '../../src/components/MDialog.vue';
import MButton from '../../src/components/MButton.vue';
import MInput from '../../src/components/MInput.vue';
import MTextarea from '../../src/components/MTextarea.vue';

const meta = {
  title: '二级组件/Drawer 抽屉', component: MDrawer, tags: ['autodocs'],
  args: { modelValue: false, title: '档案侧卷', description: '展开一页侧卷，让当前工作留在原处。', side: 'right', size: 'md', closeOnEscape: true, closeOnBackdrop: false, closeLabel: '关闭抽屉' },
  argTypes: { side: { control: 'inline-radio', options: ['left', 'right', 'bottom'] }, size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  parameters: { docs: { description: { component: '以 MDialog 的原生模态、焦点与滚动锁为基础，加入机械滑轨与侧向归位。支持左右侧卷及底部展开，内容单独滚动，标题和 footer 留在可见区域。默认 Escape 关闭，默认不点击遮罩关闭；footer 提供 close()。原生属性与事件传给实际 dialog，减少动态效果时直接静态呈现。' } } },
  render: args => defineComponent({
    components: { MDrawer, MButton, MInput, MTextarea },
    setup() {
      const open = ref(args.modelValue); const name = ref('观山 · 设计档案'); const notes = ref('把更深入的设置收进侧卷，让主要内容保持清楚。'); const result = ref('配置只在当前示例中保存。'); const formId = `drawer-form-${useId()}`;
      watch(() => args.modelValue, value => { open.value = value; });
      function save() { result.value = `「${name.value}」已保存。`; open.value = false; }
      return { args, open, name, notes, result, formId, save };
    },
    template: `<main class="kit-stack"><p class="kit-mono kit-muted" style="font-size:11px;letter-spacing:2px">DRAWER / 侧卷展开</p><h1 style="font:500 34px/1.4 var(--ui-font-family-display)">一卷在侧，主线从容。</h1><p class="kit-muted" style="line-height:1.8">沿着滑轨展开细节，完成后回到原先的位置。</p><div class="kit-row"><MButton @click="open = true">展开档案侧卷</MButton></div><p role="status" class="kit-muted">{{ result }}</p><MDrawer v-bind="args" v-model="open"><form :id="formId" style="display:grid;gap:24px" @submit.prevent="save"><MInput v-model="name" label="档案名称" name="archiveName" autofocus maxlength="40" /><MTextarea v-model="notes" label="整理说明" :rows="5" name="notes" /><p style="font-size:12px;color:var(--ui-color-text-secondary);line-height:1.9">关闭后保留输入。Tab 与 Shift+Tab 在侧卷中切换，Escape 返回展开入口。</p></form><template #footer="{ close }"><MButton variant="secondary" @click="close">暂时合卷</MButton><MButton type="submit" :form="formId">保存侧卷</MButton></template></MDrawer></main>`,
  }),
} satisfies Meta<typeof MDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Left: Story = { name: '左侧展开', args: { side: 'left', size: 'sm' } };
export const Bottom: Story = { name: '底部展开', args: { side: 'bottom' } };
export const ReducedMotion: Story = { name: '静态展开', globals: { motion: 'reduced' } };
export const LongContent: Story = {
  name: '长卷与固定操作',
  render: () => defineComponent({
    components: { MDrawer, MButton }, setup: () => ({ open: ref(false) }),
    template: `<main class="kit-stack"><div><MButton @click="open = true">展开长卷</MButton></div><p class="kit-muted">长内容在卷内滚动，标题、关闭与操作区始终可达。</p><MDrawer v-model="open" title="山川档案长卷" description="在窄屏或较矮窗口中，阅读与操作各有位置。"><div style="display:grid;gap:24px"><section v-for="index in 18" :key="index"><h3 style="font-family:var(--ui-font-family-display);font-size:22px">第 {{ index }} 章 · 山川有形</h3><p style="line-height:1.9;margin-top:12px;color:var(--ui-color-text-secondary)">一份内容可以有足够的细节，也应当保留自然阅读的节奏。侧卷只滚动正文，操作不会随着长文隐没。LongArchiveReferenceWithoutArtificialClipping</p></section><p>卷末：每一步都能安然归位。</p></div><template #footer="{ close }"><MButton @click="close">合上长卷</MButton></template></MDrawer></main>`,
  }),
};
export const BackdropDismiss: Story = {
  name: '遮罩关闭',
  render: () => defineComponent({ components: { MDrawer, MButton }, setup: () => ({ open: ref(false) }), template: `<main class="kit-stack"><div><MButton @click="open = true">展开阅读侧卷</MButton></div><MDrawer v-model="open" title="阅读侧卷" description="点击遮罩即可退出；从正文拖到遮罩会保持打开。" close-on-backdrop><p style="line-height:1.9">留一道边界，也留一个轻松返回的入口。</p><template #footer="{ close }"><MButton @click="close">读完了</MButton></template></MDrawer></main>` }),
};
export const ClosePolicy: Story = {
  name: '显式关闭',
  render: () => defineComponent({ components: { MDrawer, MButton }, setup: () => ({ open: ref(false) }), template: `<main class="kit-stack"><div><MButton @click="open = true">展开关闭策略示例</MButton></div><MDrawer v-model="open" title="完成当前检查" description="此例通过可见按钮退出，Escape 与遮罩保持当前内容。" :close-on-escape="false"><p style="line-height:1.9">退出方式由流程决定，关闭按钮始终清楚可见。</p><template #footer="{ close }"><MButton @click="close">检查完成</MButton></template></MDrawer></main>` }),
};
export const NestedAndUnmount: Story = {
  name: '嵌套与卸载清理',
  render: () => defineComponent({
    components: { MDrawer, MDialog, MButton },
    setup() { const mounted = ref(false); const open = ref(false); const inner = ref(false); function launch() { inner.value = false; mounted.value = true; open.value = true; } function remove() { mounted.value = false; open.value = false; inner.value = false; } return { mounted, open, inner, launch, remove }; },
    template: `<main class="kit-stack"><div><MButton @click="launch">打开嵌套抽屉</MButton></div><MDrawer v-if="mounted" v-model="open" title="侧卷设置" description="叠放的模态窗口各自归位，并只释放自己的滚动锁。"><div class="kit-stack"><p>可以在侧卷中打开补充说明，再用 Escape 回到侧卷。</p><div><MButton @click="inner = true">打开补充说明</MButton></div></div><MDialog v-model="inner" title="补充说明" description="关闭这层后回到侧卷入口。"><p style="line-height:1.9">卸载整个侧卷时，两层模态与背景滚动锁都会清理。</p><template #footer="{ close }"><MButton variant="secondary" @click="close">返回侧卷</MButton><MButton @click="remove">卸载整个侧卷</MButton></template></MDialog><template #footer="{ close }"><MButton @click="close">关闭侧卷设置</MButton></template></MDrawer></main>`,
  }),
};
