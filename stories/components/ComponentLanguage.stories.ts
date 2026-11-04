import { computed, defineComponent, onBeforeUnmount, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MButton, MInput, MSwitch } from '../../src/components';
import './ComponentLanguage.css';

const ComponentLanguage = defineComponent({
  name: 'ComponentLanguage',
  components: { MButton, MInput, MSwitch },
  setup() {
    const project = ref('观山 · 设计档案');
    const code = ref('');
    const checked = ref(true);
    const lowMotion = ref(false);
    const loading = ref(false);
    const feedback = ref('点击、聚焦或切换，观察每一处反馈。');
    const attempted = ref(false);
    const codeError = computed(() => attempted.value && code.value.trim().length < 4 ? '请填写至少 4 位访问口令。' : '');
    const projectError = computed(() => attempted.value && !project.value.trim() ? '请填写项目名称。' : '');
    let timer: ReturnType<typeof setTimeout> | undefined;
    function save() {
      if (loading.value) return;
      attempted.value = true;
      if (!project.value.trim() || code.value.trim().length < 4) { feedback.value = '还有未完成的字段，请查看输入提示。'; return; }
      loading.value = true;
      const name = project.value.trim();
      timer = setTimeout(() => { loading.value = false; feedback.value = `「${name}」已在当前预览中保存。`; timer = undefined; }, 700);
    }
    function reset() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      loading.value = false;
      project.value = '观山 · 设计档案'; code.value = ''; attempted.value = false;
      checked.value = true; lowMotion.value = false;
      feedback.value = '已恢复默认示例。';
    }
    onBeforeUnmount(() => { if (timer !== undefined) clearTimeout(timer); });
    return { project, code, checked, lowMotion, loading, feedback, codeError, projectError, save, reset };
  },
  template: `
    <main class="control-study" :data-ui-motion="lowMotion ? 'reduced' : undefined">
      <header class="control-study__header">
        <div><p class="control-study__eyebrow">MALANG UI / COMPONENT STUDY</p><h1>笔锋，落在每一次交互。</h1><p class="control-study__intro">以轮廓辨识，以状态沟通。从一笔墨线，到每一个操作的落点。</p></div>
        <span class="control-study__stamp" aria-hidden="true">规<br>矩</span>
      </header>
      <section class="control-study__buttons" aria-labelledby="control-action-title">
        <div class="control-study__section-title"><h2 id="control-action-title"><span>壹</span> 动作有轻重</h2><p>主要操作、次要操作与轻量操作，各有自己的分寸。</p></div>
        <div class="control-study__actions"><MButton size="lg" @click="feedback = '主要操作已触发。'">开启新章 <span aria-hidden="true">↗</span></MButton><MButton variant="secondary" @click="feedback = '草稿已在当前预览中存放。'">暂存草稿</MButton><MButton variant="ghost" @click="feedback = '已打开操作说明：示例中的操作仅在当前预览中生效。'">查看说明</MButton><MButton disabled>等待开放</MButton><MButton :loading="loading" @click="save">{{ loading ? '落笔中…' : '验证并保存' }}</MButton></div>
        <div class="control-study__size-line"><span>同一语法，三种尺度</span><MButton size="sm" variant="secondary" @click="feedback = '小尺寸操作已触发。'">小成</MButton><MButton variant="secondary" @click="feedback = '默认尺寸操作已触发。'">适中</MButton><MButton size="lg" variant="secondary" @click="feedback = '大尺寸操作已触发。'">舒展</MButton></div>
      </section>
      <div class="control-study__columns">
        <section class="control-study__fields" aria-labelledby="control-input-title">
          <div class="control-study__section-title"><h2 id="control-input-title"><span>贰</span> 落笔有边界</h2><p>尝试聚焦与输入，观察焦点、提示和校验。</p></div>
          <form class="control-study__form" @submit.prevent="save">
            <MInput v-model="project" label="项目名称" name="project" :error="projectError" hint="支持中文输入；焦点清楚，文字安静。" autocomplete="organization" />
            <MInput v-model="code" label="访问口令" name="accessCode" type="password" autocomplete="new-password" placeholder="至少 4 位" :error="codeError" hint="仅用于本页演示，不会上传或保存口令。" />
            <MInput label="归档编号" model-value="ML—2026—001" disabled hint="不可用状态仍保留内容与标签。" />
            <div class="control-study__form-actions"><MButton type="submit" :loading="loading">{{ loading ? '正在保存' : '保存此页' }}</MButton><MButton variant="ghost" @click="reset">重置示例</MButton></div>
          </form>
        </section>
        <section class="control-study__switches" aria-labelledby="control-switch-title">
          <div class="control-study__section-title"><h2 id="control-switch-title"><span>叁</span> 切换有落点</h2><p>机械式的位移，清楚表达每一次选择。</p></div>
          <div class="control-study__switch-list"><MSwitch v-model="checked" label="自动收录新稿" hint="用方向与颜色共同表达开启状态。" /><MSwitch v-model="lowMotion" label="减少动态效果" hint="关闭本页的装饰性动效，仍保留状态反馈。" /><MSwitch :model-value="true" disabled label="团队归档规则" hint="此项由团队统一设置。" /></div>
          <div class="control-study__rule"><span>交互约定</span><p>可见的键盘焦点<br>明确的加载与错误<br>随时可以停止的动态效果</p></div>
        </section>
      </div>
      <footer class="control-study__feedback"><span aria-hidden="true">↳</span><p role="status" aria-live="polite">{{ feedback }}</p><span class="control-study__footnote">仅在当前预览中生效</span></footer>
    </main>`,
});

const meta = { title: '基础组件/交互语言', component: ComponentLanguage, parameters: { layout: 'fullscreen', controls: { disable: true } } } satisfies Meta<typeof ComponentLanguage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: '组件 · 形与势' };
