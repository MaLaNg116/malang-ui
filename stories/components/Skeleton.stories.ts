import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';
import MSkeleton from '../../src/components/MSkeleton.vue';
import MCard from '../../src/components/MCard.vue';
import MButton from '../../src/components/MButton.vue';

const meta = {
  title: '基础组件/Skeleton 骨架屏',
  component: MSkeleton,
  tags: ['autodocs'],
  args: { lines: 3 },
  argTypes: { lines: { control: { type: 'range', min: 1, max: 12, step: 1 } } },
  parameters: { docs: { description: { component: '细密雪花纹理承托稳定的版面，少量1px水平短断片以错开的相位低对比浮现，再平滑退去。局部回声仅小幅移动，整块底色不明灭，不使用全域棋盘、骤闪或整条白光扫动。lines 仍在 1 至 12 行之间；雪花来自固定 seed 的自包含 SVG feTurbulence，几何与相位均确定，不依赖随机数、外部图片、GSAP 或浏览器计时器。媒体可使用单行并通过 --ui-skeleton-line-height 设置占位高度。骨架本身 aria-hidden，不单独播报；父区域管理 aria-busy 与唯一加载消息。两种减少动效来源和强制配色均显示静态纹理。' } } },
  render: args => defineComponent({ components: { MSkeleton, MCard }, setup: () => ({ args }), template: '<div class="kit-stack" style="width:min(100%,580px)"><p class="kit-muted">细密雪花，安静保留尚未落定的版面。</p><MCard title="设计档案"><MSkeleton v-bind="args" /></MCard></div>' }),
} satisfies Meta<typeof MSkeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ContentReplacement: Story = {
  name: '内容替换',
  render: () => defineComponent({
    components: { MSkeleton, MCard, MButton },
    setup: () => ({ loading: ref(true) }),
    template: `<div class="kit-stack" style="width:min(100%,580px)"><MCard as="section" title="最近整理" :aria-busy="loading"><div v-if="loading" class="kit-stack" style="gap:20px"><MSkeleton :lines="1" style="--ui-skeleton-line-height:108px"/><MSkeleton :lines="4" /></div><div v-else class="kit-stack" style="gap:20px"><div role="img" aria-label="山川稿封面" style="height:108px;display:grid;place-items:center;background:linear-gradient(125deg,var(--ui-color-secondary-soft,var(--ui-color-accent-soft)),var(--ui-color-surface));color:var(--ui-color-secondary-accent);font-family:var(--ui-font-family-display);font-size:26px">山川稿 / 03</div><p>山川有形，笔墨有意。</p><p class="kit-muted">三份新的素材已放入设计档案，可以继续归类。</p></div></MCard><p role="status" class="kit-muted">{{ loading ? '内容正在载入。' : '内容已准备好。' }}</p><div><MButton variant="secondary" @click="loading = !loading">{{ loading ? '显示实际内容' : '显示骨架占位' }}</MButton></div></div>`,
  }),
};
export const ReducedMotion: Story = { name: '静态占位', globals: { motion: 'reduced' } };
export const Compositions: Story = {
  name: '文本、媒体与卡片',
  render: () => defineComponent({ components: { MSkeleton, MCard }, template: '<main class="kit-stack" style="width:min(100%,760px)"><section aria-label="文本骨架示例" class="kit-stack" style="gap:16px"><h3>笔记正文</h3><MSkeleton :lines="5" /></section><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:24px;min-width:0"><MCard title="媒体档案"><div class="kit-stack" style="gap:20px"><MSkeleton :lines="1" style="--ui-skeleton-line-height:172px"/><MSkeleton :lines="3"/></div></MCard><MCard title="资料卡片"><div class="kit-stack" style="gap:24px"><div style="display:grid;grid-template-columns:56px minmax(0,1fr);gap:16px;align-items:center"><MSkeleton :lines="1" style="--ui-skeleton-line-height:56px"/><MSkeleton :lines="2"/></div><MSkeleton :lines="5"/></div></MCard></div></main>' }),
};
export const LineCounts: Story = {
  name: '行数边界',
  render: () => defineComponent({ components: { MSkeleton }, setup: () => ({ cases: [{ key: 'single', label: '单行', lines: 1 }, { key: 'fraction', label: '小数行数', lines: 2.9 }, { key: 'minimum', label: '最少一行', lines: 0 }, { key: 'maximum', label: '最多十二行', lines: 99 }, { key: 'fallback', label: '无效值回退', lines: Number.NaN }] }), template: '<main class="kit-stack" style="width:min(100%,580px)"><section v-for="sample in cases" :key="sample.key" :data-skeleton-case="sample.key" class="kit-stack" style="gap:12px"><h3>{{ sample.label }}</h3><MSkeleton :lines="sample.lines"/></section></main>' }),
};
export const ThemePair: Story = {
  name: '明暗肌理',
  render: () => defineComponent({ components: { MSkeleton }, template: '<main style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:24px;max-width:760px"><section v-for="theme in [\'light\',\'dark\']" :key="theme" :data-ui-theme="theme" style="display:grid;gap:20px;min-width:0;padding:24px;background:var(--ui-color-canvas);border:1px solid var(--ui-color-rule);color:var(--ui-color-text)"><h3>{{ theme === \'light\' ? \'浅色碎墨\' : \'暗色雪花\' }}</h3><MSkeleton :lines="1" style="--ui-skeleton-line-height:128px"/><MSkeleton :lines="4"/></section></main>' }),
};
