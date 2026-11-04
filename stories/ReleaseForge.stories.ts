import { computed, defineComponent, nextTick, onBeforeUnmount, ref, useId } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MAccordion, MAlert, MBadge, MBreadcrumb, MButton, MCheckbox, MDrawer, MDropdownMenu, MInput, MProgress, MSteps, MTextarea, MTimeline, MToast, MToastViewport, asyncLock } from '../src';
import type { MDropdownMenuItem, MTimelineItem, MToastVariant } from '../src';
import './ReleaseForge.css';

const ReleaseForge = defineComponent({
  components: { MAccordion, MAlert, MBadge, MBreadcrumb, MButton, MCheckbox, MDrawer, MDropdownMenu, MInput, MProgress, MSteps, MTextarea, MTimeline, MToast, MToastViewport },
  setup() {
    const name = ref('malang-ui'); const version = ref('0.2.0'); const notes = ref('新增功夫朋克二级流程组件，统一 M 前缀。');
    const drawer = ref(false); const menu = ref(false); const draftName = ref(''); const draftVersion = ref(''); const draftNotes = ref(''); const attempted = ref(false);
    const id = useId(); const formId = `forge-editor-${id}`; const nameId = `forge-name-${id}`; const versionId = `forge-version-${id}`;
    const nameError = computed(() => attempted.value && !draftName.value.trim() ? '请填写组件包名称。' : '');
    const versionError = computed(() => attempted.value && !draftVersion.value.trim() ? '请填写版本标识。' : '');
    const sections = ref(['notes', 'checks']); const running = ref(false); const progress = ref(0); const step = ref('prepare'); const outcome = ref('ready'); const fault = ref(false);
    const records = ref<MTimelineItem[]>([{ value: 'ready', title: '工坊已就绪', description: '填写资料，然后开始一次本地交付演练。', status: 'success' }]);
    const toast = ref(false); const toastTitle = ref(''); const toastText = ref(''); const toastVariant = ref<MToastVariant>('info');
    let generation = 0; let notice = 0; let sequence = 0;
    let timer: ReturnType<typeof setTimeout> | undefined; let settle: ((continueRun: boolean) => void) | undefined;
    const stages = [{ value: 'prepare', label: '理卷', description: '整理交付资料' }, { value: 'check', label: '淬炼', description: '逐项校准状态' }, { value: 'deliver', label: '落印', description: '记录交付结果' }];
    const sectionItems = [{ value: 'notes', label: '交付资料', description: '为这次迭代留下清晰的说明。' }, { value: 'checks', label: '流程控制', description: '开始、取消、异常与重试均可操作。' }];
    const menuItems = computed<MDropdownMenuItem[]>(() => [{ value: 'edit', label: '编辑交付资料…' }, { type: 'separator', key: 'record-actions' }, { value: 'clear', label: '清空运行记录', danger: true, disabled: !records.value.length }]);
    const statusText = computed(() => ({ ready: '待启程', running: '淬炼中', success: '已落印', error: '待修正', cancelled: '已取消' })[outcome.value] || '待启程');
    const resultText = computed(() => ({ ready: '按下开始检查，观察三个阶段的衔接。', running: '演练正在进行，可以随时取消。', success: '本地演练完成，交付记录已经就绪。', error: '演示异常已触发；关闭异常开关后可以重新检查。', cancelled: '本次演练已取消，保留当前进度和记录。' })[outcome.value] || '');
    async function notify(title: string, description: string, variant: MToastVariant = 'info') {
      const token = ++notice; toast.value = false; await nextTick();
      if (token !== notice) return;
      toastTitle.value = title; toastText.value = description; toastVariant.value = variant; toast.value = true;
    }
    function openEditor() { draftName.value = name.value; draftVersion.value = version.value; draftNotes.value = notes.value; attempted.value = false; drawer.value = true; }
    async function menuAction(value: string) {
      if (value === 'edit') { await nextTick(); await nextTick(); openEditor(); }
      else if (value === 'clear') { records.value = []; void notify('记录已清空', '下一次演练会生成新的时间线。'); }
    }
    async function saveDetails() {
      attempted.value = true;
      if (nameError.value || versionError.value) { await nextTick(); document.getElementById(nameError.value ? nameId : versionId)?.focus(); return; }
      name.value = draftName.value.trim(); version.value = draftVersion.value.trim(); notes.value = draftNotes.value.trim(); drawer.value = false;
      void notify('资料已保存', `${name.value} · ${version.value} 已更新。`, 'success');
    }
    function wait() { return new Promise<boolean>(resolve => { settle = resolve; timer = setTimeout(() => { timer = undefined; settle = undefined; resolve(true); }, 700); }); }
    function stopWait() { if (timer !== undefined) clearTimeout(timer); timer = undefined; settle?.(false); settle = undefined; }
    function addRecord(title: string, description: string) {
      const key = `run-${++sequence}`;
      const item: MTimelineItem = { value: key, title, description, status: 'active', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }) };
      records.value = [...records.value, item].slice(-8);
      return key;
    }
    function finishRecord(key: string, status: MTimelineItem['status']) { records.value = records.value.map(item => item.value === key ? { ...item, status } : item); }
    const run = asyncLock(async () => {
      const token = ++generation; running.value = true; outcome.value = 'running'; progress.value = 0; step.value = 'prepare'; sections.value = ['checks'];
      for (let index = 0; index < stages.length; index++) {
        const stage = stages[index]!; step.value = stage.value;
        const key = addRecord(stage.label + ' · ' + stage.description, `${name.value} / ${version.value}`);
        if (!await wait() || token !== generation) return;
        progress.value = Math.round((index + 1) / stages.length * 100);
        if (index === 1 && fault.value) { finishRecord(key, 'error'); running.value = false; outcome.value = 'error'; void notify('检查需要修正', '已演示异常分支，可以关闭异常开关后重试。', 'error'); return; }
        finishRecord(key, 'success');
      }
      running.value = false; outcome.value = 'success'; void notify('落印完成', `${name.value} · ${version.value} 本地演练已完成。`, 'success');
    });
    function cancel() { if (!running.value) return; generation++; stopWait(); running.value = false; outcome.value = 'cancelled'; records.value = records.value.map(item => item.status === 'active' ? { ...item, status: 'neutral' as const, description: '本次检查已取消，可重新开始。' } : item); }
    onBeforeUnmount(() => { generation++; notice++; stopWait(); });
    return { name, version, notes, drawer, menu, draftName, draftVersion, draftNotes, formId, nameId, versionId, nameError, versionError, sections, running, progress, step, outcome, fault, records, stages, sectionItems, menuItems, statusText, resultText, toast, toastTitle, toastText, toastVariant, openEditor, menuAction, saveDetails, run, cancel, breadcrumbs: [{ label: '组件工坊', href: '#forge-top' }, { label: '交付演练' }] };
  },
  template: `<main id="forge-top" class="release-forge">
    <MBreadcrumb :items="breadcrumbs" />
    <header class="release-forge__hero"><div><p class="release-forge__eyebrow">MALANG / RELEASE FORGE</p><h1>理卷、淬炼，<br>一印成章。</h1><p class="release-forge__intro">把资料、校准与交付串成一条顺手的主线。每一个细节，都有自己的落点。</p><div class="release-forge__hero-actions"><MButton :loading="running" @click="run">{{ running ? '检查进行中' : outcome === 'ready' ? '开始检查' : '重新检查' }}</MButton><MDropdownMenu v-model="menu" :items="menuItems" label="工坊操作" :disabled="running" @select="menuAction"><template #trigger>工坊操作</template></MDropdownMenu></div></div>
      <div class="release-forge__emblem" aria-hidden="true"><svg viewBox="0 0 240 220" fill="none"><path class="release-forge__orbit" d="M120 18 222 110 120 202 18 110Z"/><path class="release-forge__inner-orbit" d="m120 42 76 68-76 68-76-68Z"/><path class="release-forge__rail" d="M0 82h54m132 0h54M0 138h54m132 0h54M120 0v32m0 156v32"/><path class="release-forge__blade" d="m138 47 6 19-32 58-22 11 5-22 43-66Z"/><path class="release-forge__hilt" d="m83 129 39 19m-20-10-13 32-9-4 13-32"/><path class="release-forge__trace" pathLength="100" :style="{ strokeDashoffset: 100 - progress }" d="M120 18 222 110 120 202 18 110Z"/><circle class="release-forge__pin" cx="18" cy="110" r="3"/><circle class="release-forge__pin" cx="222" cy="110" r="3"/></svg><span>{{ String(progress).padStart(2, '0') }}<small>%</small></span><p>{{ statusText }}</p></div>
    </header>
    <MAlert class="release-forge__notice" title="本地交付演练" description="三个阶段使用本地计时模拟，可取消和重试；不会执行实际构建，也不会发布软件包。" />
    <section class="release-forge__steps" aria-label="交付阶段"><MSteps v-model="step" :items="stages" label="交付流程" :status="outcome === 'error' ? 'error' : outcome === 'success' ? 'success' : 'process'" /></section>
    <div class="release-forge__workspace"><section class="release-forge__main" aria-labelledby="forge-details-heading"><div class="release-forge__section-heading"><h2 id="forge-details-heading">交付档案</h2><MBadge :tone="outcome === 'error' ? 'error' : outcome === 'success' ? 'success' : 'info'">{{ statusText }}</MBadge></div>
      <div class="release-forge__package"><p class="release-forge__package-name">{{ name }} <span>{{ version }}</span></p><MButton variant="ghost" size="sm" :disabled="running" @click="openEditor">编辑资料</MButton></div>
      <MAccordion v-model="sections" :items="sectionItems" label="交付档案章节" multiple><template #notes><p class="release-forge__notes">{{ notes || '尚未填写交付说明。' }}</p></template><template #checks><div class="release-forge__checks"><MProgress label="交付准备度" :value="progress" :status="outcome === 'error' ? 'error' : outcome === 'success' ? 'success' : 'default'">{{ resultText }}</MProgress><MCheckbox v-model="fault" label="演示异常分支" hint="在第二阶段展示异常反馈，关闭后可以重新检查。" :disabled="running" /><div v-if="running"><MButton variant="secondary" @click="cancel">取消检查</MButton></div></div></template></MAccordion>
    </section><aside class="release-forge__history" aria-labelledby="forge-history-heading"><div class="release-forge__section-heading"><h2 id="forge-history-heading">行进留痕</h2><span class="release-forge__count">{{ records.length }} 条</span></div><MTimeline :items="records" label="工坊运行记录" /></aside></div>
    <footer class="release-forge__footer"><span aria-hidden="true">↳</span><p>{{ resultText }}</p></footer>
    <MDrawer v-model="drawer" title="交付资料" description="编辑包名称、版本与说明，保存后同步更新工坊。"><form :id="formId" class="release-forge__form" @submit.prevent="saveDetails"><MInput :id="nameId" v-model="draftName" label="组件包名称" :error="nameError" maxlength="48" name="packageName" autofocus /><MInput :id="versionId" v-model="draftVersion" label="版本标识" :error="versionError" maxlength="24" name="version" hint="例如 0.2.0 或 0.2.0-preview。" /><MTextarea v-model="draftNotes" label="交付说明" :rows="5" maxlength="320" name="notes" /></form><template #footer="{ close }"><MButton variant="secondary" @click="close">取消编辑</MButton><MButton type="submit" :form="formId">保存资料</MButton></template></MDrawer>
    <MToastViewport><MToast v-model="toast" :title="toastTitle" :description="toastText" :variant="toastVariant" :duration="toastVariant === 'error' ? 0 : 6000" /></MToastViewport>
  </main>`,
});
const meta = { title: '开始/铸刃工坊', component: ReleaseForge, parameters: { layout: 'fullscreen', controls: { disable: true } } } satisfies Meta<typeof ReleaseForge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: '理卷 · 淬炼 · 落印' };
