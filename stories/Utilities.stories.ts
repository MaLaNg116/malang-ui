import { defineComponent, onBeforeUnmount, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { UiButton, UiInput } from '../src';
import { asyncLock, debounce } from '../src/utils';

const UtilityPlayground = defineComponent({
  components: { UiButton, UiInput },
  setup() {
    const query = ref('');
    const inputCount = ref(0);
    const searchCount = ref(0);
    const matches = ref(['Button', 'Input', 'Switch', 'MG Timeline', 'Debounce', 'Throttle']);
    const directory = [...matches.value];
    const status = ref('等待输入');
    const pending = ref(false);
    const runSearch = debounce((text: string) => {
      searchCount.value += 1;
      matches.value = directory.filter(item => item.toLowerCase().includes(text.toLowerCase()));
      pending.value = false;
      status.value = `找到 ${matches.value.length} 项`;
    }, 350);
    watch(query, value => {
      inputCount.value += 1;
      if (!value.trim()) {
        runSearch.cancel(); pending.value = false; matches.value = [...directory]; status.value = '已恢复完整目录'; return;
      }
      runSearch(value.trim()); pending.value = true; status.value = '等待输入停顿…';
    });
    const cancel = () => { runSearch.cancel(); pending.value = false; status.value = '已取消等待'; };
    const flush = () => runSearch.flush();
    const lockCalls = ref(0);
    const lockStatus = ref('等待操作');
    const save = asyncLock(async () => {
      lockCalls.value += 1;
      lockStatus.value = '正在保存，多次点击共享同一项操作';
      await new Promise<void>(resolve => setTimeout(resolve, 800));
      lockStatus.value = '已完成，可以再次操作';
    });
    const requestSave = () => { void save(); };
    onBeforeUnmount(() => runSearch.cancel());
    return { query, inputCount, searchCount, matches, status, pending, cancel, flush, requestSave, lockCalls, lockStatus };
  },
  template: `
    <main class="kit-stack">
      <h1 style="font-size:28px">实用工具，直接验证。</h1>
      <p class="kit-muted">这里调用的是工具层的公开函数。工具本身不依赖 Vue，Vue 负责界面与生命周期。</p>
      <section class="kit-panel kit-stack" aria-label="防抖搜索">
        <h2 style="font-size:18px">防抖搜索 · 350ms</h2>
        <UiInput v-model="query" label="搜索组件或工具" placeholder="连续输入 button、mg 或 debounce" />
        <div class="kit-row"><UiButton size="sm" :disabled="!pending" @click="flush">立即执行</UiButton><UiButton size="sm" variant="secondary" :disabled="!pending" @click="cancel">取消等待</UiButton></div>
        <p class="kit-muted kit-mono">输入 {{ inputCount }} 次 · 执行搜索 {{ searchCount }} 次</p>
        <p role="status" aria-live="polite">{{ status }}</p>
        <div class="kit-row"><code v-for="item in matches" :key="item" style="padding:6px 9px;border-radius:6px;background:var(--ui-color-accent-soft);color:var(--ui-color-text)">{{ item }}</code></div>
      </section>
      <section class="kit-panel kit-stack" aria-label="异步锁">
        <h2 style="font-size:18px">异步锁 · 共享进行中的操作</h2>
        <div class="kit-row"><UiButton @click="requestSave">连续点击保存 ↗</UiButton><span class="kit-muted">实际执行 {{ lockCalls }} 次</span></div>
        <p role="status" aria-live="polite">{{ lockStatus }}</p>
      </section>
    </main>`
});

const meta = { title: '实用工具/防抖与异步锁', component: UtilityPlayground } satisfies Meta<typeof UtilityPlayground>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Interactive: Story = { name: '交互体验' };
