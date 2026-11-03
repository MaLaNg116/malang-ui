import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { UiButton, UiInput, UiSwitch } from '../src';

const Introduction = defineComponent({
  components: { UiButton, UiInput, UiSwitch },
  setup() {
    const name = ref('我的组件工作台');
    const enabled = ref(true);
    const message = ref('基础组件、GSAP 编排与工具，从同一套规范出发。');
    return { name, enabled, message };
  },
  template: `
    <main class="kit-stack">
      <div class="kit-row kit-mono" style="color:var(--ui-color-accent);font-size:12px;letter-spacing:2px">MALANG UI / 开发工作台</div>
      <h1 style="font-size:clamp(32px,5vw,52px);letter-spacing:-2px">从一个组件，<br><span style="color:var(--ui-color-accent)">走向完整体验。</span></h1>
      <p class="kit-muted">这是第一版开发工作台。通过左侧目录查看组件状态、MG 编排和工具交互，通过顶部工具栏切换主题与密度。</p>
      <section class="kit-panel kit-stack" aria-label="组合使用示例">
        <h2 style="font-size:18px">先创建一个工作空间</h2>
        <UiInput v-model="name" label="工作空间名称" hint="体验共享 Token、输入状态与键盘操作" />
        <UiSwitch v-model="enabled" label="启用进展提醒" />
        <div class="kit-row"><UiButton @click="message = '工作空间「' + (name || '未命名') + '」已准备好。'">创建空间 ↗</UiButton><UiButton variant="secondary" @click="name = ''; message = '请重新填写工作空间名称。'">清空输入</UiButton></div>
        <p role="status" aria-live="polite" class="kit-muted">{{ message }}</p>
      </section>
      <div class="kit-panel kit-stack">
        <h2 style="font-size:18px">这一版验证什么</h2>
        <p class="kit-muted">基础组件的状态与焦点；GSAP 时间轴的播放、定位和清理；防抖、节流与异步锁的真实行为。</p>
        <p class="kit-muted">配色与细节仍沿用已确认的草案，品牌文档站将继续复用这里的公开入口。</p>
      </div>
    </main>`
});

const meta = { title: '开始/工程起点', component: Introduction, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Introduction>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Workbench: Story = { name: '组合工作台' };
