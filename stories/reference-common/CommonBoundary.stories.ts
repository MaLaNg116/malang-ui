import { createSSRApp, defineComponent, getCurrentInstance, h, nextTick, onBeforeUnmount, onMounted, ref, withDirectives } from 'vue';
import type { App } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MButton from '../../src/components/MButton.vue';
import MTypography from '../../src/components/reference-common/MTypography.vue';
import MApp from '../../src/components/reference-common/MApp.vue';
import { createMLoading, vMLoading } from '../../src/components/reference-common/loading';
import type { MLoadingHandle } from '../../src/components/reference-common/loading';
import { useMApp } from '../../src/composables/useApp';

const meta = { title: '配置/共享边界演练', tags: ['autodocs'] } satisfies Meta;
export default meta; type Story = StoryObj<typeof meta>;
function loadingFixture(mixed: boolean) {
  return defineComponent({
    components: { MButton },
    setup() {
      const target = ref<HTMLElement>(), shown = ref(true), appContext = getCurrentInstance()?.appContext;
      let first: MLoadingHandle | undefined, second: MLoadingHandle | undefined, version = 0;
      function closeFirst() { first?.close(); first = undefined; }
      function closeSecond() { second?.close(); second = undefined; }
      function clear() { version++; closeSecond(); closeFirst(); }
      async function start(order: 'local' | 'full-first' | 'full-second') {
        clear(); const current = version, element = target.value; if (!element) return;
        first = createMLoading({ target: element, text: order === 'full-first' ? '第一层全屏加载' : '第一层局部加载', fullscreen: order === 'full-first', cancelable: true, onCancel: closeFirst, appContext });
        await nextTick(); if (current !== version || !target.value?.isConnected) return;
        second = createMLoading({ target: element, text: order === 'full-second' ? '第二层全屏加载' : '第二层局部加载', fullscreen: order === 'full-second', cancelable: true, onCancel: closeSecond, appContext });
      }
      function toggle() { clear(); shown.value = !shown.value; }
      onBeforeUnmount(clear);
      return { target, shown, mixed, start, closeFirst, closeSecond, toggle };
    },
    template: `<main class="kit-stack" style="max-width:680px"><h1 style="font:500 30px/1.5 var(--ui-font-family-display)">叠层有序，归焦有主。</h1><p>同一目标可并发等待；只有最上层能响应取消，原内容直到最后一层结束才恢复。</p><div class="kit-row"><MButton v-if="!mixed" @click="start('local')">开启双层局部加载</MButton><template v-else><MButton @click="start('full-first')">全屏后接局部</MButton><MButton @click="start('full-second')">局部后接全屏</MButton></template><MButton variant="secondary" @click="closeFirst">关闭第一层</MButton><MButton variant="secondary" @click="closeSecond">关闭第二层</MButton><MButton variant="ghost" @click="toggle">切换加载区域</MButton></div><section v-if="shown" ref="target" aria-label="并发加载区域" style="position:relative;min-height:180px;padding:20px;border:1px solid var(--ui-color-rule)"><div><button type="button">原区域操作</button><p>原有业务内容，等待结束后继续可用。</p></div><div inert data-original-inert>原来已锁定的辅助内容</div></section><input aria-label="加载区域外的草稿" value="外部编辑保持独立" /></main>`,
  });
}
export const Default: Story = { render: () => loadingFixture(false) };
export const MixedLoading: Story = { render: () => loadingFixture(true) };

const HydrationFixture = defineComponent({
  setup() {
    const container = ref<HTMLElement>(), loading = ref(true), custom = ref(true), ready = ref(false), proof = ref(''), problem = ref('');
    let app: App<Element> | undefined, alive = true;
    const Content = defineComponent({ setup() { return () => h('div', [undefined, 'false', 'true'].map((busy, index) => withDirectives(h('section', { 'aria-label': `SSR 加载区域 ${index + 1}`, 'aria-busy': busy, style: 'position:relative;min-height:110px;margin-bottom:12px;padding:16px;border:1px solid var(--ui-color-rule)' }, [h('button', { type: 'button' }, `SSR 区域 ${index + 1} 操作`)]), [[vMLoading, custom.value ? { loading: loading.value, text: 'SSR 自定义加载文案' } : loading.value]]))); } });
    onMounted(async () => {
      try {
        const { renderToString } = await import('@vue/server-renderer');
        const markup = await renderToString(createSSRApp(Content));
        if (!alive || !container.value) return;
        proof.value = `真实SSR：${(markup.match(/data-ui-loading-ssr-busy/g) ?? []).length} 个 busy 归属标记`;
        container.value.innerHTML = markup;
        app = createSSRApp(Content); app.mount(container.value); ready.value = true;
      } catch (error) { problem.value = String(error); }
    });
    onBeforeUnmount(() => { alive = false; app?.unmount(); });
    return { container, loading, custom, ready, proof, problem };
  },
  render() { return h('section', { class: 'kit-stack' }, [h('p', { 'data-ssr-proof': '' }, this.proof), this.problem ? h('p', { role: 'alert' }, this.problem) : null, h('div', { class: 'kit-row' }, [h('button', { type: 'button', disabled: !this.ready, onClick: () => { this.custom = false; } }, '恢复默认加载文案'), h('button', { type: 'button', disabled: !this.ready, onClick: () => { this.loading = false; } }, '结束 SSR 指令加载')]), h('div', { ref: 'container', 'data-hydrated-content': '' })]); },
});
export const DirectiveHydration: Story = { render: () => defineComponent({ components: { HydrationFixture, MButton }, setup: () => ({ shown: ref(true) }), template: `<main class="kit-stack" style="max-width:680px"><h1 style="font:500 30px/1.5 var(--ui-font-family-display)">从服务端到手中，状态有始有终。</h1><MButton variant="secondary" @click="shown = !shown">切换水合示例</MButton><HydrationFixture v-if="shown" /></main>` }) };

export const TypographyFocus: Story = { render: () => defineComponent({
  components: { MTypography },
  setup() {
    const value = ref('保留这份原稿'), accept = ref(false), move = ref(false), outside = ref<HTMLInputElement>(), requests = ref(0);
    function update(text: string) { requests.value++; if (accept.value) value.value = text; if (move.value) outside.value?.focus(); }
    return { value, accept, move, outside, requests, update };
  },
  template: `<main class="kit-stack" style="max-width:600px"><h1 style="font:500 30px/1.5 var(--ui-font-family-display)">文字由业务接纳，焦点由当下决定。</h1><MTypography :model-value="value" editable label="边界文字编辑" @update:model-value="update"/><div class="kit-row"><label><input type="checkbox" v-model="accept"/>接受文字更新</label><label><input type="checkbox" v-model="move"/>保存时业务聚焦草稿</label></div><input ref="outside" aria-label="文字编辑外的草稿" value="继续编辑业务草稿"/><output data-typography-requests>保存请求：{{requests}}</output></main>`,
}) };

const KeyControls = defineComponent({
  props: { side: { type: String, required: true } }, components: { MButton },
  setup(props) {
    const app = useMApp();
    function add() { app.message({ key: '1', content: `${props.side} 显式编号消息`, duration: 0 }); app.message({ content: `${props.side} 自动编号消息`, duration: 0 }); }
    return { app, add };
  },
  template: `<div class="kit-row"><MButton @click="add">{{side}}添加并列提示</MButton><MButton variant="secondary" @click="app.destroyAll">{{side}}关闭提示</MButton></div>`,
});
export const AppKeys: Story = { render: () => defineComponent({ components: { MApp, KeyControls }, template: `<main class="kit-stack" style="padding-top:160px"><h1 style="font:500 30px/1.5 var(--ui-font-family-display)">编号有界，上下文独立。</h1><MApp data-testid="key-app-left"><KeyControls side="左侧"/></MApp><MApp data-testid="key-app-right"><KeyControls side="右侧"/></MApp></main>` }) };
