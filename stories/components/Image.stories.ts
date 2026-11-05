import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MImage from '../../src/components/MImage.vue';
import { MButton, MInput } from '../../src/components';

const inkGate = new URL('../assets/archive/ink-gate.svg', import.meta.url).href;
const jadeWheel = new URL('../assets/archive/jade-wheel.svg', import.meta.url).href;
const giltWeave = new URL('../assets/archive/gilt-weave.svg', import.meta.url).href;
const broken = 'data:image/svg+xml,not-a-valid-image';
const records = [
  { src: inkGate, alt: '墨关 · 水墨机械档案', code: '001 / INK GATE', description: '墨山之间，一座青玉机关守住归途。' },
  { src: jadeWheel, alt: '青玉机关 · 轮轴构形档案', code: '002 / JADE MECHANISM', description: '同心轮轴与四向轨道，让每次归位都有依据。' },
  { src: giltWeave, alt: '绢素经纬 · 鎏金织构档案', code: '003 / GILT WEAVE', description: '墨线穿过绢素，折向与交叠形成有序织印。' },
];
const gallery = records.map(record => record.src);

const meta = {
  title: '基础组件/Image 图片',
  component: MImage,
  tags: ['autodocs'],
  args: { src: inkGate, alt: records[0]!.alt, fit: 'cover', loading: 'lazy', preview: true },
  parameters: { docs: { description: { component: '纸墨档案图片保留原生img与必填alt，支持懒加载、五种fit、加载失败重试及换源隔离。class/style作用于外框，其余原生图片属性传给img；width/height同时定义外框尺寸比例。载入完成后可打开原生Dialog大图预览，图片组支持上一张/下一张与左右方向键，缩放1–3倍，工具栏独立于滚动图片区。Escape关闭并安全返回触发按钮。previewSources只包含URL，其他组图按序命名；需要各自描述的画廊由每个缩略图提供alt。示例SVG均为仓库内原创代码插图，无外部请求。' } } },
  argTypes: {
    fit: { control: 'select', options: ['fill', 'contain', 'cover', 'none', 'scale-down'] },
    loading: { control: 'inline-radio', options: ['eager', 'lazy'] },
    preview: { control: 'boolean' },
    initialIndex: { control: { type: 'number', min: 0, step: 1 }, description: '指定打开组图的索引；省略时优先定位当前src。' },
  },
  render: args => defineComponent({
    components: { MImage },
    setup: () => ({ args, loaded: ref(0), failed: ref(0) }),
    template: `<main class="kit-stack" style="max-width:760px"><p class="kit-mono kit-muted">IMAGE / 图像成卷</p><h1 style="font:500 32px/1.5 var(--ui-font-family-display)">将一方天地，收入档案。</h1><p class="kit-muted">图像承托内容，短折角与原图入口保留清楚边界。</p><MImage v-bind="args" width="640" height="400" decoding="async" referrerpolicy="no-referrer" @load="loaded++" @error="failed++" /><p class="kit-muted" data-testid="image-events">载入：{{ loaded }} 次 · 失败：{{ failed }} 次</p></main>`,
  }),
} satisfies Meta<typeof MImage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Fits: Story = {
  name: '五种适配',
  render: () => defineComponent({
    components: { MImage },
    setup: () => ({ src: jadeWheel, fits: ['fill', 'contain', 'cover', 'none', 'scale-down'] as const }),
    template: `<main class="kit-stack"><h1 style="font:500 32px/1.5 var(--ui-font-family-display)">同一张图，各得其位。</h1><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:20px"><figure v-for="fit in fits" :key="fit" style="display:grid;gap:10px;margin:0;min-width:0"><MImage :src="src" :alt="'青玉机关，适配方式' + fit" :fit="fit" :preview="false" style="height:150px;aspect-ratio:auto" /><figcaption class="kit-mono kit-muted">{{ fit }}</figcaption></figure></div></main>`,
  }),
};

export const SourceChange: Story = {
  name: '失败重试与换源',
  render: args => defineComponent({
    components: { MImage, MButton },
    setup() {
      const src = ref(broken), loaded = ref(0), failed = ref(0);
      return { src, loaded, failed, inkGate: args.src, jadeWheel, broken, sources: [args.src, broken, jadeWheel] };
    },
    template: `<main class="kit-stack" style="max-width:700px"><h1 style="font:500 32px/1.5 var(--ui-font-family-display)">换一份图，也接得住迟来的回应。</h1><p class="kit-muted">失败时保留替代说明与重试入口。预览组的第二张刻意使用无效图片，仍可继续浏览下一张。</p><div class="kit-row"><MButton variant="secondary" @click="src = inkGate">载入墨关</MButton><MButton variant="secondary" @click="src = jadeWheel">载入青玉机关</MButton><MButton variant="ghost" @click="src = broken">使用失效图片</MButton></div><MImage :src="src" alt="可重新载入的档案插图" :preview-sources="sources" loading="eager" style="max-width:600px" @load="loaded++" @error="failed++" /><p class="kit-muted" data-testid="image-events">载入：{{ loaded }} 次 · 失败：{{ failed }} 次</p></main>`,
  }),
};

export const Gallery: Story = {
  name: '机关图志画廊',
  render: () => defineComponent({
    components: { MImage, MButton, MInput },
    setup: () => ({ records, gallery, mounted: ref(true), draft: ref('机关图志 · 第一卷') }),
    template: `<main class="kit-stack" style="max-width:1100px"><div class="kit-row" style="justify-content:space-between"><div><p class="kit-mono kit-muted">ARCHIVE / ORIGINAL CODE ILLUSTRATIONS</p><h1 style="font:500 36px/1.5 var(--ui-font-family-display)">机关图志</h1></div><MButton variant="ghost" @click="mounted = !mounted">{{ mounted ? '移除画廊' : '恢复画廊' }}</MButton></div><p class="kit-muted">三份原创矢量档案可独立预览，也能在大图中顺序浏览。</p><MInput v-model="draft" label="画廊卷名" style="max-width:440px" /><div v-if="mounted" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:24px"><figure v-for="(record, index) in records" :key="record.src" style="display:grid;align-content:start;gap:12px;margin:0;min-width:0"><MImage :src="record.src" :alt="record.alt" :preview-sources="gallery" :initial-index="index" /><figcaption style="display:grid;gap:6px"><span class="kit-mono kit-muted" style="font-size:11px">{{ record.code }}</span><strong style="font:500 20px/1.6 var(--ui-font-family-display)">{{ record.alt.split(' · ')[0] }}</strong><p class="kit-muted" style="font-size:12px;line-height:1.8">{{ record.description }}</p></figcaption></figure></div><p v-else class="kit-muted">画廊已收起，卷名继续保留。</p></main>`,
  }),
};

export const LongAlt: Story = {
  name: '长说明与窄屏',
  args: { src: giltWeave, alt: '绢素经纬档案，记录墨线与鎏金在机械轨道间穿行、折返与交叠的原创构形。'.repeat(5), previewSources: gallery },
};

export const ReducedMotion: Story = {
  name: '减少动态效果',
  globals: { motion: 'reduced' },
  args: { src: jadeWheel, alt: records[1]!.alt, previewSources: gallery },
};
