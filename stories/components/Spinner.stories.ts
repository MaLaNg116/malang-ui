import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';
import MSpinner from '../../src/components/MSpinner.vue';
import MButton from '../../src/components/MButton.vue';
import MSkeleton from '../../src/components/MSkeleton.vue';

const meta = {
  title: '基础组件/Spinner 加载标记',
  component: MSpinner,
  tags: ['autodocs'],
  args: { label: '加载中', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  parameters: { docs: { description: { component: '方印离合：四枚厚折角逐角离位，再共同锁合成印框；双楔内芯反向换位，外轨保持匀速旋转。每轮留出约 0.7 秒共同合拢，避免一直散成碎片。根盒保持 16 / 24 / 32 px，切角在小尺寸仍保留实体，位移留在图形安全范围内。只有一个 SVG；固定 0/90/180/270 度的分布与活动折角分层。外轨默认主题主色，内芯使用副色；--ui-spinner-color / --ui-spinner-secondary-color 可分别设置，按钮中均继承 currentColor。status 只保留一份 label 文本，不按每帧播报。系统/容器减少动态效果和强制配色均保留完整静态方印。若父区域已有唯一加载消息，使用 aria-hidden="true" 与空 label 将图形作为装饰。' } } },
  render: args => defineComponent({ components: { MSpinner }, setup: () => ({ args }), template: '<div class="kit-row"><MSpinner v-bind="args" /><p class="kit-muted">正在载入设计档案。</p></div>' }),
} satisfies Meta<typeof MSpinner>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Sizes: Story = {
  name: '三个尺寸',
  render: () => defineComponent({ components: { MSpinner }, template: '<div class="kit-row" style="gap:28px"><MSpinner size="sm" label="小尺寸加载中" /><MSpinner label="默认尺寸加载中" /><MSpinner size="lg" label="大尺寸加载中" /><span class="kit-muted">16 / 24 / 32 px</span></div>' }),
};
export const MechanismDetail: Story = {
  name: '方印离合细节',
  render: () => defineComponent({ components: { MSpinner, MButton }, template: '<main class="kit-stack" style="max-width:720px;gap:36px"><div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap"><MSpinner label="方印离合细节" style="--ui-spinner-size:144px"/><div class="kit-stack" style="gap:8px"><h2>拆成四折，合成一印。</h2><p class="kit-muted">逐角离位，内芯反转；四折共同锁合，外轨继续转动。</p></div></div><div class="kit-row" style="gap:32px"><MSpinner size="sm" label="十六像素方印"/><MSpinner label="二十四像素方印"/><MSpinner size="lg" label="三十二像素方印"/><span class="kit-muted">16 / 24 / 32 px</span></div><div class="kit-stack" style="gap:16px"><p class="kit-muted">按钮复用同一构形 · 加载样式演示</p><div class="kit-row"><MButton loading>档案载入中</MButton><MButton loading variant="secondary">校准中</MButton><MButton loading variant="ghost">连接中</MButton></div></div></main>' }),
};
export const BusyRegion: Story = {
  name: '内容载入状态',
  render: () => defineComponent({
    components: { MSpinner, MButton, MSkeleton },
    setup: () => ({ loading: ref(false), started: ref(false) }),
    template: `<section class="kit-stack" style="width:min(100%,580px)"><div class="kit-row"><MButton variant="secondary" style="min-width:160px" @click="loading = !loading; started = true"><MSpinner v-if="loading" size="sm" label="" aria-hidden="true" />{{ loading ? '完成整理' : started ? '再次整理' : '开始整理' }}</MButton><span class="kit-muted">本地演示 · 手动完成</span></div><div role="region" aria-label="设计档案列表" :aria-busy="loading" class="kit-panel"><MSkeleton v-if="loading" :lines="4"/><p v-else class="kit-muted">{{ started ? '山水、器物与字体，均已完成整理。' : '点击开始整理，查看档案就绪前的状态。' }}</p></div><p role="status" class="kit-muted">{{ loading ? '本地档案正在整理。' : started ? '本地档案已准备好。' : '可以开始整理本地档案。' }}</p></section>`,
  }),
};
export const ReducedMotion: Story = { name: '减少动态效果', globals: { motion: 'reduced' } };
export const ThemePair: Story = {
  name: '明暗机械组合',
  render: () => defineComponent({ components: { MSpinner }, template: '<main style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:24px;max-width:620px"><section v-for="theme in [\'light\',\'dark\']" :key="theme" :data-ui-theme="theme" style="display:flex;gap:20px;align-items:center;padding:28px;min-width:0;background:var(--ui-color-canvas);color:var(--ui-color-text);border:1px solid var(--ui-color-rule)"><MSpinner size="lg" :label="theme === \'light\' ? \'浅色组合加载中\' : \'暗色组合加载中\'"/><p>{{ theme === \'light\' ? \'浅色 · 合轨\' : \'暗色 · 机芯\' }}</p></section></main>' }),
};
