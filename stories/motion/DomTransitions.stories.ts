import { defineComponent, ref, useId } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MButton from '../../src/components/MButton.vue';
import MSwitch from '../../src/components/MSwitch.vue';
import { useMTransition } from '../../src/composables/useMTransition';
import '../../src/styles/dom-transitions.css';
import '../../src/components/reference-inputs/referenceInputs.css';

const MotionDesk = defineComponent({
  components: { MButton, MSwitch },
  props: { duration: Number },
  setup(props) {
    const rows = ref([
      { id: 1, label: '墨关', note: '墨迹原稿', selected: false },
      { id: 2, label: '青玉', note: '机械切面', selected: false },
      { id: 3, label: '绢素', note: '经纬织光', selected: false },
    ]);
    const stage = ref<HTMLElement>();
    const panelId = `motion-fold-${useId()}`;
    const expanded = ref(true);
    const note = ref('保留编辑中的内容');
    const localReduced = ref(false);
    const disabled = ref(false);
    const published = ref(false);
    const result = ref('尚未登记');
    const controls = { disabled, duration: props.duration };
    const { transition: group, moveClass } = useMTransition({
      ...controls,
      preset: 'reveal',
      group: true,
      focusTarget: () => stage.value?.querySelector('[data-motion-add]') ?? null,
    });
    const { transition: fold } = useMTransition({
      ...controls,
      preset: 'fold',
      focusTarget: () => stage.value?.querySelector('[data-motion-fold]') ?? null,
    });
    const { transition: stamp } = useMTransition({ ...controls, preset: 'stamp' });
    let nextId = 4;
    function newRow() {
      const id = nextId++;
      return { id, label: `新卷 ${id}`, note: '', selected: false };
    }
    function add() { rows.value = [...rows.value, newRow()]; }
    function remove(id: number) { rows.value = rows.value.filter(row => row.id !== id); }
    function reorder() { rows.value = [...rows.value].reverse(); }
    function replace() { rows.value = [newRow(), ...rows.value.slice(2)]; }
    function submit(event: Event) {
      const values = new FormData(event.currentTarget as HTMLFormElement);
      result.value = `已登记 ${values.getAll('archives').length} 份卷宗`;
    }
    return { stage, rows, panelId, expanded, note, localReduced, disabled, published, result, group, moveClass, fold, stamp, add, remove, reorder, replace, submit };
  },
  template: `
    <form ref="stage" class="kit-stack" data-motion-desk :data-ui-motion="localReduced ? 'reduced' : undefined"
      :style="{ maxWidth: '660px', '--ui-motion-duration-transition': duration ? duration + 'ms' : undefined }" @submit.prevent="submit">
      <h1>开合有度，移位有据。</h1>
      <p class="kit-muted">给卷宗增删和移位，折叠备注，或为登记状态落印。</p>
      <div class="kit-row">
        <MButton data-motion-add @click="add">新增卷宗</MButton>
        <MButton variant="secondary" @click="reorder">倒序排列</MButton>
        <MButton variant="secondary" @click="replace">替换前两卷</MButton>
      </div>
      <TransitionGroup tag="ul" class="ui-transition-group" aria-label="当前卷宗"
        v-bind="group" :move-class="moveClass" style="display:grid;gap:8px;margin:0;padding:0;list-style:none">
        <li v-for="row in rows" :key="row.id" :data-motion-row="row.id"
          style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0;padding:8px 12px;border:1px solid var(--ui-color-rule);background:var(--ui-color-surface-raised)">
          <input type="checkbox" v-model="row.selected" :aria-label="'勾选' + row.label">
          <label :for="'archive-' + panelId + '-' + row.id" style="flex:1;min-width:64px">{{ row.label }}</label>
          <input :id="'archive-' + panelId + '-' + row.id" v-model="row.note" name="archives" class="ui-ri__control" style="max-width:100%;min-width:0;width:140px">
          <MButton variant="secondary" :aria-label="'移除' + row.label" @click="remove(row.id)">移除</MButton>
        </li>
      </TransitionGroup>
      <MButton variant="secondary" data-motion-fold :aria-expanded="expanded" :aria-controls="panelId" @click="expanded = !expanded">切换卷末备注</MButton>
      <Transition v-bind="fold">
        <div v-show="expanded" :id="panelId" data-motion-panel
          style="background:var(--ui-color-surface-raised);border-block-start:2px solid var(--ui-color-secondary-accent)">
          <div class="kit-stack" style="padding:14px">
            <label :for="panelId + '-note'">卷末备注</label>
            <input :id="panelId + '-note'" v-model="note" :name="expanded ? 'note' : undefined" class="ui-ri__control">
            <input name="protected" value="封存字段" disabled aria-label="封存字段" class="ui-ri__control">
          </div>
        </div>
      </Transition>
      <div class="kit-row">
        <MButton type="submit">登记可见卷宗</MButton>
        <MButton variant="secondary" @click="published = !published">切换落印状态</MButton>
      </div>
      <Transition v-bind="stamp" mode="out-in">
        <p :key="published ? 'published' : 'draft'" data-motion-status role="status"
          style="margin:0;padding:8px 12px;border-inline-start:3px solid var(--ui-color-seal);background:var(--ui-color-surface-raised)">
          {{ published ? '已落印 · 可以交付' : '待落印 · 保持草稿' }}
        </p>
      </Transition>
      <p data-motion-result>{{ result }}</p>
      <MSwitch v-model="localReduced" label="减少容器动态效果" />
      <MSwitch v-model="disabled" label="停用工作台过渡" />
    </form>
  `,
});

const meta = {
  title: '动效/DOM 变化过渡',
  parameters: { docs: { description: { component: '通过 useMTransition 为 Vue Transition 提供揭页、折叠和落印。TransitionGroup 使用键控内容、group: true 与 moveClass 实现列表位移。离场内容在动画期间退出交互和表单提交。' } } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => defineComponent({ components: { MotionDesk }, template: '<MotionDesk />' }) };
export const ReducedMotion: Story = { ...Default, globals: { motion: 'reduced' } };
export const Lifecycle: Story = {
  render: () => defineComponent({
    components: { MotionDesk, MButton },
    setup: () => ({ mounted: ref(true), second: ref(false) }),
    template: `
      <div class="kit-stack">
        <div class="kit-row">
          <MButton variant="secondary" @click="mounted = !mounted">{{ mounted ? "卸载过渡工作台" : "恢复过渡工作台" }}</MButton>
          <MButton variant="secondary" @click="second = !second">{{ second ? "收起并行工作台" : "打开并行工作台" }}</MButton>
        </div>
        <section data-motion-primary><MotionDesk v-if="mounted" :duration="720" /></section>
        <section v-if="second" data-motion-secondary><MotionDesk :duration="720" /></section>
      </div>
    `,
  }),
};
