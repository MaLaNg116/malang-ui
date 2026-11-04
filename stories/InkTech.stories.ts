import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { PropType } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MButton, MInput, MSwitch, asyncLock, debounce } from '../src';
import { createInkSequence } from '../src/motion';
import type { InkSequenceController, InkSequenceState } from '../src/motion';
import './InkTech.css';

const phases = [
  { key: 'gather', name: '蓄势', time: 1.15, detail: '墨迹聚合' },
  { key: 'cut', name: '疾出', time: 1.95, detail: '刀锋切面' },
  { key: 'assemble', name: '收锋', time: 3.45, detail: '切面重组' },
  { key: 'complete', name: '归位', time: 5, detail: '印记落定' },
];
const catalog = [
  { name: 'Button', label: '按钮', type: 'UI', detail: '轻按有回应，落点有分寸。' },
  { name: 'Input', label: '输入框', type: 'UI', detail: '输入、提示与错误，各就其位。' },
  { name: 'Switch', label: '开关', type: 'UI', detail: '清晰表达每一次选择。' },
  { name: 'debounce', label: '防抖', type: 'UTIL', detail: '稍候片刻，只执行最后一次。' },
  { name: 'asyncLock', label: '异步锁', type: 'UTIL', detail: '一次进行中的任务，共享结果。' },
];

const InkTechStudy = defineComponent({
  name: 'InkTechStudy',
  components: { MButton, MInput, MSwitch },
  props: { reducedMotion: { type: [Boolean, String] as PropType<boolean | 'system'>, default: 'system' } },
  setup(props) {
    const canvas = ref<HTMLCanvasElement>();
    const state = shallowRef<InkSequenceState>({ time: 1.15, duration: 5, progress: 0.23, phase: 'gather', playing: false, reducedMotion: false, disposed: false });
    const workspace = ref('无界设计工作室');
    const motionEnabled = ref(true);
    const saving = ref(false);
    const saved = ref('配置仅在当前预览中生效。');
    const workspaceError = ref('');
    const search = ref('');
    const query = ref('');
    const searches = ref(0);
    const waiting = ref(false);
    const results = computed(() => catalog.filter(item => `${item.name} ${item.label}`.toLowerCase().includes(query.value.toLowerCase().trim())));
    const currentPhase = computed(() => phases.find(phase => phase.key === state.value.phase)!);
    let controller: InkSequenceController | undefined;
    let mounted = false;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let finishSave: (() => void) | undefined;
    const updateSearch = debounce((value: string) => { query.value = value; searches.value++; waiting.value = false; }, 300);
    watch(search, value => { waiting.value = true; updateSearch(value); });
    watch(motionEnabled, enabled => { if (!enabled) controller?.pause(); });
    watch(workspace, () => { workspaceError.value = ''; });
    function create() {
      if (!canvas.value) return;
      const time = controller?.state.time ?? 1.15;
      controller?.dispose();
      controller = createInkSequence(canvas.value, { reducedMotion: props.reducedMotion, onUpdate: next => { state.value = next; } });
      controller.seek(controller.state.reducedMotion ? 5 : time);
    }
    onMounted(() => { mounted = true; create(); });
    watch(() => props.reducedMotion, () => { if (mounted) create(); });
    onBeforeUnmount(() => {
      mounted = false;
      controller?.dispose();
      updateSearch.cancel();
      if (saveTimer !== undefined) clearTimeout(saveTimer);
      finishSave?.();
    });
    const save = asyncLock(async () => {
      const name = workspace.value.trim();
      if (!name) { workspaceError.value = '请填写工作空间名称。'; saved.value = '名称还未填写。'; return; }
      saving.value = true;
      try {
        await new Promise<void>(resolve => { finishSave = resolve; saveTimer = setTimeout(resolve, 650); });
        if (mounted) saved.value = `「${name}」已保存。`;
      } finally { saving.value = false; finishSave = undefined; saveTimer = undefined; }
    });
    function play() { if (state.value.playing) controller?.pause(); else controller?.play(); }
    function seek(time: number) { controller?.pause(); controller?.seek(time); }
    return { canvas, state, phases, currentPhase, workspace, workspaceError, motionEnabled, saving, saved, search, results, searches, waiting, save, play, seek };
  },
  template: `
    <main class="ink-study">
      <header class="ink-study__masthead">
        <a class="ink-study__brand" href="#ink-top" aria-label="MALANG UI，返回顶部">
          <svg class="ink-study__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M3 4h26v24H3zM8 10h5v12H8zm5 6 9-6h3v12h-5v-6l-7 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          MALANG<span>UI</span>
        </a>
        <nav class="ink-study__nav" aria-label="样板页导航"><a href="#ink-components">组件试炼 <span>01</span></a><a href="#ink-tools">实用工具 <span>02</span></a></nav>
        <span class="ink-study__edition">设计手记 <b>壹</b></span>
      </header>

      <section id="ink-top" class="ink-study__hero" aria-labelledby="ink-heading">
        <div class="ink-study__intro">
          <p class="ink-study__eyebrow"><i aria-hidden="true"></i> INK / FORM / FUNCTION</p>
          <h1 id="ink-heading">以墨为形。<br><em>以动见势。</em></h1>
          <p class="ink-study__lede">让东方的留白，遇见精密的秩序。<br>一套有锋芒，也有分寸的界面语言。</p>
          <div class="ink-study__hero-actions">
            <MButton size="lg" :disabled="!motionEnabled" @click="play">{{ state.reducedMotion ? '查看落印状态' : state.playing ? '暂停 · 定格此刻' : '起势 · 播放 MG' }} <span aria-hidden="true">↗</span></MButton>
            <a class="ink-study__text-link" href="#ink-components">试用组件 <span aria-hidden="true">↓</span></a>
          </div>
          <p class="ink-study__small-note">{{ state.reducedMotion ? '减少动态效果已开启，直接呈现落印。' : '五秒构形 · 手动播放 · 随时可停' }}</p>
        </div>
        <div class="ink-study__motion">
          <div class="ink-study__stage-heading"><span>动势研究 / 001</span><span class="ink-study__live"><i aria-hidden="true"></i>{{ state.playing ? '演绎中' : state.time === 5 ? '已落印' : '待起势' }}</span></div>
          <div class="ink-study__art">
            <span class="ink-study__character" aria-hidden="true">势</span>
            <span class="ink-study__vertical" aria-hidden="true">一笔起，万象生。</span>
            <canvas ref="canvas" role="img" aria-label="干刷墨迹、朱砂切面与原创几何印记的四段构形动画">墨迹聚合，被朱砂切面划开，再重组成几何印记。</canvas>
            <span class="ink-study__coordinates" aria-hidden="true">X: 032 / Y: 116<br>ORIGINAL MOTION STUDY</span>
            <span class="ink-study__seal" aria-hidden="true">墨<br>构</span>
          </div>
          <div class="ink-study__playhead"><span>{{ currentPhase.detail }}</span><input type="range" min="0" max="5" step="0.01" :value="state.time" aria-label="样板 MG 进度" :aria-valuetext="state.time.toFixed(1) + ' 秒，共 5 秒；' + currentPhase.name" @input="seek(Number($event.target.value))"><span>{{ state.time.toFixed(1) }} <small>/ 5s</small></span></div>
          <div class="ink-study__phases"><button v-for="(phase, index) in phases" :key="phase.key" type="button" :class="{ 'is-current': state.phase === phase.key }" :aria-pressed="state.phase === phase.key" :aria-label="'定位到' + phase.name" @click="seek(phase.time)"><span>0{{ index + 1 }}</span>{{ phase.name }}<i aria-hidden="true">↗</i></button></div>
        </div>
      </section>

      <div class="ink-study__manifesto"><span>东方意韵 <b>×</b> 精密构形</span><p>有表现力的展示，有执行力的组件。</p><span class="ink-study__mono">VUE 3 · TYPESCRIPT · GSAP</span></div>

      <div class="ink-study__specimens">
        <section id="ink-components" class="ink-study__specimen" aria-labelledby="ink-components-heading">
          <header class="ink-study__section-heading"><span>01 / 组件试炼</span><span>FORM & FEEDBACK</span></header>
          <h2 id="ink-components-heading">日常界面，也有锋芒。</h2>
          <p class="ink-study__section-copy">把风格放进真实操作，保留清晰、效率与手感。</p>
          <form class="ink-study__form" @submit.prevent="save">
            <MInput v-model="workspace" label="工作空间名称" placeholder="给你的工作空间起个名字" :error="workspaceError" autocomplete="organization" maxlength="40" />
            <div class="ink-study__setting"><div><strong>允许动效预览</strong><p>由你决定何时起势。</p></div><MSwitch v-model="motionEnabled" aria-label="允许动效预览" /></div>
            <div class="ink-study__form-actions"><MButton type="submit" :loading="saving">{{ saving ? '正在保存' : '保存配置' }} <span v-if="!saving" aria-hidden="true">↗</span></MButton><MButton variant="secondary" @click="workspace = '无界设计工作室'; motionEnabled = true; workspaceError = ''; saved = '已恢复默认配置。'">恢复默认</MButton><MButton variant="ghost" disabled>即将开放</MButton></div>
            <p class="ink-study__feedback" role="status" aria-live="polite">{{ saved }}</p>
          </form>
        </section>

        <section id="ink-tools" class="ink-study__specimen" aria-labelledby="ink-tools-heading">
          <header class="ink-study__section-heading"><span>02 / 实用工具</span><span>SMALL THINGS, WELL MADE</span></header>
          <h2 id="ink-tools-heading">细节之间，自有章法。</h2>
          <p class="ink-study__section-copy">试着连续输入。停下 300ms，搜索才会执行。</p>
          <div class="ink-study__search"><MInput v-model="search" label="搜索组件与工具" type="search" placeholder="输入 button、输入框、防抖…" /><p class="ink-study__search-info" role="status" aria-live="polite">{{ waiting ? '等待输入结束…' : '找到 ' + results.length + ' 项' }}<span>执行 {{ searches }} 次</span></p></div>
          <ul class="ink-study__results" aria-label="搜索结果"><li v-for="item in results" :key="item.name"><span class="ink-study__result-type">{{ item.type }}</span><div><strong>{{ item.name }} <span>{{ item.label }}</span></strong><p>{{ item.detail }}</p></div><span class="ink-study__result-line" aria-hidden="true"></span></li></ul>
          <p v-if="!results.length" class="ink-study__empty">未找到匹配项，试试“按钮”或“防抖”。</p>
        </section>
      </div>
      <footer class="ink-study__footer"><span>MALANG UI <span aria-hidden="true">/</span> 水墨科技样板</span><span>留白有度，落笔有声。</span><a href="#ink-top">回到起笔处 ↑</a></footer>
    </main>`,
});

const meta = {
  title: '开始/水墨科技样板',
  component: InkTechStudy,
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: (_, context) => ({ setup: () => () => h(InkTechStudy, { reducedMotion: context.globals.motion === 'reduced' ? true : 'system' }) }),
} satisfies Meta<typeof InkTechStudy>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: '水墨 · 构形' };
export const Dark: Story = { name: '浓墨 · 夜色', globals: { theme: 'dark' } };
export const ReducedMotion: Story = { name: '静态 · 落印', globals: { motion: 'reduced' } };
