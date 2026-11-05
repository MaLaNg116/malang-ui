import { defineComponent, onBeforeUnmount, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MApp, MConfigProvider, MButton, MInput, MLoading, useMApp, vMLoading, createMLoading } from '../../src/components';
const Controls = defineComponent({
  components: { MButton, MInput }, setup() {
    const app = useMApp(), result = ref(''), draft = ref('独立上下文中的草稿');
    async function prompt() { const response = await app.messageBox({ title: '重命名档案', message: '至少输入两个字', inputLabel: '档案名称', kind: 'prompt', validate: async value => value.length >= 2 || '请至少输入两个字' }); result.value = `${response.action}:${response.value}`; }
    const load = () => { const handle = app.message({ key: 'progress', content: '正在校对', type: 'loading', duration: 0 }); return handle; };
    let handle: ReturnType<typeof load> | undefined;
    return { app, result, draft, prompt, start: () => { handle = load(); }, finish: () => { handle?.update({ content: '校对完成', type: 'success', duration: 3000 }); } };
  }, template: '<section class="kit-stack"><MInput v-model="draft" label="应用草稿" /><div class="kit-row"><MButton @click="app.message(\'已保存\')">轻提示</MButton><MButton @click="app.notification({ title: \'档案更新\', content: \'请核对版本\', duration: 0 })">通知</MButton><MButton @click="prompt">打开输入确认</MButton><MButton @click="start">开始等待</MButton><MButton @click="finish">完成等待</MButton><MButton @click="app.destroyAll">关闭全部</MButton></div><output>{{result}}</output></section>',
});
const meta = { title: '配置/App 应用上下文', component: MApp, tags: ['autodocs'], render: () => ({ components: { MApp, Controls }, template: '<MApp><Controls /></MApp>' }) } satisfies Meta<typeof MApp>;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Scoped: Story = { render: () => defineComponent({ components: { MApp, Controls, MConfigProvider }, template: '<div class="kit-stack"><MConfigProvider locale="en-US" theme="dark"><MApp data-testid="english"><Controls /></MApp></MConfigProvider><MConfigProvider locale="zh-CN" theme="light"><MApp data-testid="chinese"><Controls /></MApp></MConfigProvider></div>' }) };
export const Loading: Story = { render: () => defineComponent({
  directives: { mLoading: vMLoading }, components: { MLoading, MButton, MInput }, setup() {
    const open = ref(false), full = ref(false), directive = ref(false), draft = ref('加载遮罩下的草稿'), target = ref<HTMLElement>();
    let handle: ReturnType<typeof createMLoading> | undefined;
    onBeforeUnmount(() => handle?.close());
    return { open, full, directive, draft, target, start: () => { handle = createMLoading({ target: target.value, text: '服务加载中', cancelable: true, onCancel: () => handle?.close() }); }, close: () => { handle?.close(); } };
  }, template: '<main class="kit-stack"><div class="kit-row"><MButton @click="open = !open">切换局部加载</MButton><MButton @click="full = true">全屏加载</MButton><MButton @click="directive = !directive">切换指令加载</MButton><MButton @click="start">服务加载</MButton><MButton @click="close">关闭服务</MButton></div><MLoading v-model="open" cancelable @cancel="open = false"><MInput v-model="draft" label="遮罩内草稿" /><div style="height:140px">组件内部内容</div></MLoading><MLoading v-model="full" fullscreen cancelable @cancel="full = false" /><div v-m-loading="{loading:directive,text:\'指令加载中\'}" style="height:120px"><MButton>指令区域按钮</MButton></div><div ref="target" style="height:120px"><MButton>服务区域按钮</MButton></div></main>',
}) };
