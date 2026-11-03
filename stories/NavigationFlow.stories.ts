import { computed, defineComponent, nextTick, ref, useId } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { UiButton, UiDialog, UiInput, UiSwitch, UiTabs } from '../src';
import './NavigationFlow.css';

const usage = `<script setup lang="ts">
import { ref } from 'vue';
import { UiButton, UiDialog, UiInput, UiTabs } from 'malang-ui';
import 'malang-ui/style.css';

const active = ref('preview');
const open = ref(false);
const name = ref('观山设计室');
const items = [
  { value: 'preview', label: '示例' },
  { value: 'usage', label: '用法' },
];
</script>

<template>
  <UiTabs v-model="active" :items="items" label="内容导航">
    <template #preview>
      <UiButton @click="open = true">编辑空间</UiButton>
    </template>
    <template #usage>在这里放置说明内容。</template>
  </UiTabs>
  <UiDialog v-model="open" title="编辑工作空间">
    <UiInput v-model="name" label="空间名称" />
    <template #footer="{ close }">
      <UiButton @click="close">完成</UiButton>
    </template>
  </UiDialog>
</template>`;

const NavigationFlow = defineComponent({
  name: 'NavigationFlow',
  components: { UiButton, UiDialog, UiInput, UiSwitch, UiTabs },
  setup() {
    const active = ref('preview');
    const items = [
      { value: 'preview', label: '示例' },
      { value: 'usage', label: '用法' },
      { value: 'api', label: '参数' },
      { value: 'planned', label: '更新记录', disabled: true },
    ];
    const name = ref('观山设计室');
    const motion = ref(true);
    const open = ref(false);
    const draft = ref(name.value);
    const draftMotion = ref(motion.value);
    const attempted = ref(false);
    const error = computed(() => attempted.value && !draft.value.trim() ? '请填写工作空间名称。' : '');
    const feedback = ref('从「示例」开始，打开编辑窗口试一试。');
    const instance = useId();
    const formId = `flow-settings-${instance}`;
    const nameId = `flow-name-${instance}`;
    function edit() { draft.value = name.value; draftMotion.value = motion.value; attempted.value = false; open.value = true; }
    async function save() {
      attempted.value = true;
      if (!draft.value.trim()) { await nextTick(); document.getElementById(nameId)?.focus(); return; }
      name.value = draft.value.trim(); motion.value = draftMotion.value; open.value = false;
      feedback.value = `「${name.value}」已更新，设置仅在当前预览中生效。`;
    }
    function reset() { name.value = '观山设计室'; motion.value = true; feedback.value = '已恢复默认工作空间。'; }
    return { active, items, name, motion, open, draft, draftMotion, error, feedback, formId, nameId, usage, edit, save, reset };
  },
  template: `
    <main class="flow-study" :data-ui-motion="motion ? undefined : 'reduced'">
      <header class="flow-study__header"><div><p class="flow-study__eyebrow">MALANG UI / INTERACTION STUDY 03</p><h1>阅读有层次，操作有归处。</h1><p class="flow-study__intro">用同一套组件，完成内容切换、编辑与确认。</p></div><span class="flow-study__stamp" aria-hidden="true">行<br>止</span></header>
      <div class="flow-study__meta"><span>工作空间 / WORKSPACE</span><span>Tabs <i>×</i> Dialog</span></div>
      <UiTabs v-model="active" :items="items" label="工作空间示例与文档">
        <template #preview>
          <section class="flow-study__preview" aria-label="工作空间预览">
            <div class="flow-study__workspace"><p class="flow-study__index">01 / YOUR WORKSPACE</p><h2>{{ name }}</h2><p>留住每一次灵感，让创作自有秩序。</p><div class="flow-study__actions"><UiButton @click="edit">编辑空间 <span aria-hidden="true">↗</span></UiButton><UiButton variant="ghost" @click="reset">还原示例</UiButton></div></div>
            <dl class="flow-study__facts"><div><dt>界面组件</dt><dd>05 <span>个，来自同一公开入口</span></dd></div><div><dt>动态效果</dt><dd>{{ motion ? '标准' : '减少' }} <span>由空间设置决定</span></dd></div><div><dt>保存方式</dt><dd>当前预览 <span>刷新后恢复默认值</span></dd></div></dl>
          </section>
          <div class="flow-study__notes"><div><span>切换</span><p>聚焦页签后，用左右键切换内容。表单与面板状态会保留。</p></div><div><span>编辑</span><p>打开编辑窗口，修改名称并保存。关闭后焦点回到触发按钮。</p></div></div>
        </template>
        <template #usage><div class="flow-study__documentation"><h2>从公开入口开始。</h2><p>页签使用同名内容插槽，对话框通过 v-model 控制显示。</p><pre class="flow-study__code"><code>{{ usage }}</code></pre></div></template>
        <template #api><div class="flow-study__documentation"><h2>让状态与内容各就其位。</h2><p>完整状态可在左侧 Tabs 与 Dialog 的独立示例中检查。</p><div class="flow-study__table-wrap"><table class="flow-study__table"><caption>本示例使用的主要接口</caption><thead><tr><th>组件</th><th>接口</th><th>用途</th></tr></thead><tbody><tr><td>Tabs</td><td><code>v-model</code></td><td>当前选中的页签值</td></tr><tr><td>Tabs</td><td><code>items</code></td><td>值、标题和禁用状态</td></tr><tr><td>Tabs</td><td><code>activationMode</code></td><td>聚焦即切换，或按回车确认</td></tr><tr><td>Dialog</td><td><code>v-model</code></td><td>显示与关闭</td></tr><tr><td>Dialog</td><td><code>title / description</code></td><td>可见标题与简短说明</td></tr><tr><td>Dialog</td><td><code>#footer="{ close }"</code></td><td>自定义操作区与关闭请求</td></tr></tbody></table></div></div></template>
      </UiTabs>
      <footer class="flow-study__feedback"><span aria-hidden="true">↳</span><p role="status" aria-live="polite">{{ feedback }}</p><span>可用键盘完成全流程</span></footer>
      <UiDialog v-model="open" title="编辑工作空间" description="为你的创作空间起一个名字；设置仅在当前预览中生效。">
        <form :id="formId" class="flow-study__form" @submit.prevent="save"><UiInput :id="nameId" v-model="draft" label="工作空间名称" name="workspaceName" :error="error" autocomplete="organization" maxlength="40" /><UiSwitch v-model="draftMotion" label="允许动态效果" hint="关闭后，当前示例使用减少动态效果的反馈。" /></form>
        <template #footer="{ close }"><UiButton variant="secondary" @click="close">取消</UiButton><UiButton type="submit" :form="formId">保存修改 <span aria-hidden="true">↗</span></UiButton></template>
      </UiDialog>
    </main>`,
});

const meta = { title: '开始/导航与弹层', component: NavigationFlow, parameters: { layout: 'fullscreen', controls: { disable: true } } } satisfies Meta<typeof NavigationFlow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: '阅读 · 编辑 · 归位' };
