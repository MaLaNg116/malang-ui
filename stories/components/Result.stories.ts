import { computed, defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MResult from '../../src/components/MResult.vue';
import MButton from '../../src/components/MButton.vue';
import MInput from '../../src/components/MInput.vue';

const meta = {
  title: '二级组件/Result 结果面板', component: MResult, tags: ['autodocs'],
  args: { title: '归档已成，资料有序。', description: '这份资料已完成本地登记，可以继续查看卷宗或补充新的素材。', status: 'success', headingTag: 'h2', announce: false },
  render: args => defineComponent({ components: { MResult }, setup: () => ({ args }), template: '<div style="width:min(100%,920px)"><MResult v-bind="args" /></div>' }),
  parameters: { docs: { description: { component: '页面级结果面板以刻印与切面图形表达成功、错误、警告和信息。title 必填，headingTag 选择页面层级；default 补充业务内容，footer 放原生按钮或链接。默认保持静态且不接管焦点。显式 announce 时，仅标题与描述的消息区使用 live region，错误为 assertive alert，其余为 polite status；补充内容与动作不参与整段播报。' } } },
} satisfies Meta<typeof MResult>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = { args: { status: 'error', title: '这次归档未能完成。', description: '附件检查未通过，请确认文件内容后再试。已有资料会继续保留。' } };
export const Warning: Story = { args: { status: 'warning', title: '还有一处资料需要确认。', description: '提交前请核对来源说明，再由当前工作区的负责人确认。' } };
export const Info: Story = { args: { status: 'info', title: '本轮资料已转交复核。', description: '复核结论会由业务流程返回，当前可以先查看其他卷宗。', headingTag: 'h1' } };
export const WithActions: Story = {
  name: '原生动作与显式播报',
  render: () => defineComponent({
    components: { MResult, MButton, MInput },
    setup() {
      const status = ref<'error' | 'success'>('error'), announce = ref(false), submitted = ref(0), lastAction = ref('尚未操作'), note = ref(''), hostClicks = ref(0), checked = ref(false);
      const title = computed(() => status.value === 'error' ? '需要再核对一处资料。' : '复核通过，资料已归档。');
      const description = computed(() => status.value === 'error' ? '请核对附件来源，然后确认本次归档。' : '本地确认已收到，可以返回资料清单。');
      function submit() { submitted.value++; status.value = 'success'; lastAction.value = '已确认归档'; }
      return { status, announce, submitted, lastAction, note, hostClicks, checked, title, description, submit, switchStatus: () => { status.value = status.value === 'error' ? 'success' : 'error'; } };
    },
    template: '<main class="kit-stack" style="width:min(100%,920px)"><div class="kit-row"><MButton variant="secondary" @click="announce = !announce">切换结果播报</MButton><MButton variant="ghost" @click="switchStatus">切换结果状态</MButton><span>播报：{{ announce ? \'显式开启\' : \'静默\' }}</span></div><MInput v-model="note" label="结果旁备注"/><form @submit.prevent="submit"><MResult :title="title" :description="description" :status="status" :announce="announce"><p>动作记录：{{ lastAction }} · 表单提交：{{ submitted }} 次</p><a href="#result-guide">查看归档规则</a><template #footer><MButton type="submit">确认归档</MButton><MButton type="button" variant="secondary" @click="lastAction = \'已返回列表\'">返回列表</MButton></template></MResult></form><div class="kit-row"><button type="button" @click="hostClicks++">宿主原生按钮</button><label>宿主确认框<input v-model="checked" type="checkbox"/></label><span>宿主点击：{{ hostClicks }}</span></div><p id="result-guide" tabindex="-1">归档规则：附件来源应清楚，确认动作由所在业务表单处理。</p></main>',
  }),
};
export const LongContent: Story = {
  name: '长文与窄屏动作',
  args: { title: 'ArchiveResultTitleWithoutArtificialClippingOrTruncation', description: 'ArchiveResultDescriptionWithoutArtificialTruncation'.repeat(4), status: 'warning' },
  render: args => defineComponent({ components: { MResult, MButton }, setup: () => ({ args }), template: '<main style="width:min(100%,920px)"><MResult v-bind="args"><p>ArchiveBusinessContextWithoutArtificialClippingOrEllipsisArchiveBusinessContextWithoutArtificialClippingOrEllipsis</p><template #footer><MButton type="button">确认这份需要完整核对来源说明的归档资料</MButton><MButton type="button" variant="secondary">返回当前工作区继续核对</MButton></template></MResult><button type="button">面板外原生按钮</button></main>' }),
};
