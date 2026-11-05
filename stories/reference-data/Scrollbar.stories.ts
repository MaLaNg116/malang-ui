import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MScrollbar from '../../src/components/reference-data/MScrollbar.vue';
import MButton from '../../src/components/MButton.vue';
const meta = { title: '数据组件/Scrollbar 滚动条', component: MScrollbar, tags: ['autodocs'], args: { height: 280, label: '卷宗滚动区' }, parameters: { docs: { description: { component: '原生滚动承载内容，细直轨支持双轴拖动、轨道定位和键盘。height/maxHeight 接受像素数或 CSS 长度，viewport 暴露真实滚动元素。内容改宽、图片或字体加载后会重新测量；纵向轨道跟随文字方向，强制颜色模式恢复系统滚动条。' } } } } satisfies Meta<typeof MScrollbar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { render: args => defineComponent({ components: { MScrollbar, MButton }, setup() { const rows = ref(80), mounted = ref(true), width = ref('1000px'); return { args, rows, mounted, width }; }, template: `<main class="kit-stack" style="max-width:720px"><h1>细轨循卷，纵横有度。</h1><div class="kit-row"><MButton @click="rows = rows === 80 ? 3 : 80">切换内容长度</MButton><MButton variant="secondary" @click="mounted = !mounted">切换滚动区域</MButton><MButton variant="secondary" @click="width = '1400px'">加宽卷宗</MButton><MButton variant="secondary" @click="width = '100%'">内容适配宽度</MButton></div><MScrollbar v-if="mounted" v-bind="args"><div :style="{ width, padding: '12px', boxSizing: 'border-box' }"><p v-for="index in rows" :key="index" style="margin:0;min-height:44px;border-bottom:1px solid var(--ui-color-rule)">卷宗 {{index}} · 墨线沿细轨归位，原生选字和滚动仍然可用。</p></div></MScrollbar><input aria-label="滚动区域外的草稿" value="保留焦点与编辑" /></main>` }) };
export const MaxHeight: Story = { render: () => defineComponent({ components: { MScrollbar }, template: `<main style="max-width:340px"><h2>内容少时自然收束</h2><MScrollbar :max-height="220" label="自适应长文"><p v-for="index in 30" :key="index">{{index}} · 山川入卷，纸墨成章。</p></MScrollbar></main>` }) };
export const ReducedMotion: Story = { ...Default, globals: { motion: 'reduced' } };

function plate(width: number) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="40"><rect width="100%" height="40" fill="#31575a"/><path d="M0 20H${width}" stroke="#d4b47b"/><path d="M12 10h20v20H12z" fill="#ad513f"/></svg>`)}`;
}
export const DynamicContent: Story = {
  render: () => defineComponent({
    components: { MScrollbar, MButton },
    setup() {
      const image = ref(plate(180));
      return { image, toggleImage: () => { image.value = image.value === plate(180) ? plate(900) : plate(180); } };
    },
    template: `<main class="kit-stack" style="max-width:440px"><h2>档案拓片</h2><MButton @click="toggleImage">切换档案图片宽度</MButton><MScrollbar :height="110" label="图片宽度变化"><div style="width:100%;height:56px"><img :src="image" alt="铜轨拓片" style="display:block;height:40px;width:auto;max-width:none" /></div></MScrollbar></main>`,
  }),
};
