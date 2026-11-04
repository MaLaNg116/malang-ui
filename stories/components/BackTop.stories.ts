import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MBackTop from '../../src/components/MBackTop.vue';
import MSpace from '../../src/components/MSpace.vue';
import { MButton, MCard } from '../../src';

const notes = Array.from({ length: 12 }, (_, index) => ({ title: `卷页 ${String(index + 1).padStart(2, '0')}`, text: '整理山川稿的底纸、墨迹与修订说明。滚动位置只属于当前卷宗，返回顶部保留键盘操作焦点。' }));
const containerStyle = 'height:260px;overflow:auto;scroll-behavior:smooth;border:1px solid var(--ui-color-rule);padding:14px;box-sizing:border-box';
const columnsStyle = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:24px;min-width:0';
const ContainerDemo = defineComponent({
  components: { MBackTop, MSpace, MButton, MCard },
  setup() {
    const a = ref<HTMLElement>(), b = ref<HTMLElement>();
    const targetA = () => a.value, targetB = () => b.value;
    const clicks = ref(0);
    const scroll = (which: 'a' | 'b') => (which === 'a' ? a.value : b.value)?.scrollTo({ top: 380, behavior: 'instant' });
    return { a, b, targetA, targetB, notes, clicks, scroll, containerStyle, columnsStyle };
  },
  template: `<div class="kit-stack"><MSpace><MButton @click="scroll('a')">卷甲滚到末段</MButton><MButton variant="secondary" @click="scroll('b')">卷乙滚到末段</MButton></MSpace><p>两个容器各自回顶。滚动区设置了 CSS smooth，减少动效时使用真正的 instant 跳转。</p><div :style="columnsStyle"><section style="position:relative;min-width:0"><div ref="a" data-backtop-target="a" tabindex="0" role="region" aria-label="甲卷滚动区" :style="containerStyle"><MSpace direction="vertical" align="stretch" size="lg"><MCard v-for="note in notes" :key="note.title" :title="note.title"><p>{{ note.text }}</p></MCard></MSpace></div><MBackTop :target="targetA" :visibility-height="120" label="返回甲卷顶部" style="position:absolute;right:12px;bottom:12px" @click="clicks++"/></section><section style="position:relative;min-width:0"><div ref="b" data-backtop-target="b" tabindex="0" role="region" aria-label="乙卷滚动区" :style="containerStyle"><MSpace direction="vertical" align="stretch" size="lg"><MCard v-for="note in notes" :key="note.title" :title="note.title"><p>{{ note.text }}</p></MCard></MSpace></div><MBackTop :target="targetB" :visibility-height="120" label="返回乙卷顶部" style="position:absolute;right:12px;bottom:12px"/></section></div><output data-backtop-clicks>甲卷回顶请求：{{ clicks }}</output><MButton variant="ghost">继续整理附件</MButton></div>`,
});

const meta = {
  title: '基础组件/BackTop 返回顶部', component: MBackTop, tags: ['autodocs'],
  args: { visibilityHeight: 400, label: '返回顶部', behavior: 'smooth' },
  argTypes: { target: { control: false } },
  parameters: { docs: { description: { component: '原生 44px 返回按钮，默认跟随窗口滚动；传入元素或响应式 getter 可独立管理滚动容器。getter 暂未返回元素时保持等待，不接管窗口。按钮持有焦点时回顶后保留到 blur，系统或任一祖先容器减少动效时以 instant 绕过 CSS smooth。style 可覆盖固定定位与边距；插槽仅放图标或文字，label 始终提供按钮名称。非法可见阈值回退到 400。' } } },
  render: args => defineComponent({ components: { MBackTop, MSpace, MCard }, setup: () => ({ args, notes }), template: '<div class="kit-stack" style="max-width:820px"><h2>长卷浏览</h2><p>向下滚动超过 400px，右下角出现归顶轨标。按 Tab 聚焦后可用 Enter 或空格回到文章开头。</p><MSpace direction="vertical" align="stretch" size="lg"><MCard v-for="note in notes" :key="note.title" :title="note.title"><p>{{ note.text }}</p><p>长标题与正文按照自然阅读顺序排布，归顶控件不插入正文，也不移动文章焦点。</p></MCard></MSpace><MBackTop v-bind="args"/></div>' }),
} satisfies Meta<typeof MBackTop>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WindowDefault: Story = {};
export const ScrollContainer: Story = { render: () => ContainerDemo };
export const ReducedMotion: Story = { globals: { motion: 'reduced' }, render: () => ContainerDemo };
export const TargetLifecycle: Story = { render: () => defineComponent({
  components: { MBackTop, MSpace, MButton, MCard },
  setup() {
    const a = ref<HTMLElement>(), b = ref<HTMLElement>(), selected = ref<'a' | 'b' | 'none'>('a'), show = ref(true), clicks = ref(0);
    const target = () => selected.value === 'none' ? null : selected.value === 'a' ? a.value : b.value;
    const scroll = (which: 'a' | 'b') => (which === 'a' ? a.value : b.value)?.scrollTo({ top: 380, behavior: 'instant' });
    return { a, b, selected, show, clicks, target, scroll, notes, containerStyle, columnsStyle };
  },
  template: `<div class="kit-stack" style="min-height:1200px"><MSpace><MButton @click="selected = 'a'">监测甲卷</MButton><MButton variant="secondary" @click="selected = 'b'">监测乙卷</MButton><MButton variant="secondary" @click="selected = 'none'">等待滚动目标</MButton><MButton variant="ghost" @click="show = !show">{{ show ? '卸载返回控件' : '挂载返回控件' }}</MButton></MSpace><MSpace><MButton variant="secondary" @click="scroll('a')">甲卷滚到末段</MButton><MButton variant="secondary" @click="scroll('b')">乙卷滚到末段</MButton></MSpace><p data-backtop-selection>当前监测：{{ selected }}</p><div :style="columnsStyle"><div ref="a" data-backtop-target="a" tabindex="0" role="region" aria-label="生命周期甲卷" :style="containerStyle"><MSpace direction="vertical" align="stretch"><MCard v-for="note in notes" :key="note.title" :title="note.title"><p>{{ note.text }}</p></MCard></MSpace></div><div ref="b" data-backtop-target="b" tabindex="0" role="region" aria-label="生命周期乙卷" :style="containerStyle"><MSpace direction="vertical" align="stretch"><MCard v-for="note in notes" :key="note.title" :title="note.title"><p>{{ note.text }}</p></MCard></MSpace></div></div><MBackTop v-if="show" :target="target" :visibility-height="120" label="返回当前卷顶部" behavior="instant" @click="clicks++">上归</MBackTop><output data-backtop-life-clicks>回顶请求：{{ clicks }}</output></div>`,
}) };
