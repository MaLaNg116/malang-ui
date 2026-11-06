<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { MButton, MInput, MSegmented } from '../../../src';
import type { MControlSize } from '../../../src';
import CodeBlock from './CodeBlock.vue';
import {
  buttonLevelsCode, buttonSizesCode, buttonAsyncCode,
  inputBasicCode, inputStatesCode, inputFormCode,
} from '../data/component-examples';

const props = defineProps<{ name: string }>();
const selectedSize = ref<MControlSize>('md');
const action = ref(''), loading = ref(false), saved = ref('');
const project = ref('山海之间'), conflict = ref('已存在的名称');
const email = ref(''), submitted = ref('');
const sizes = [{ value: 'sm', label: '小尺寸' }, { value: 'md', label: '中尺寸' }, { value: 'lg', label: '大尺寸' }];
let timer: ReturnType<typeof setTimeout> | undefined;
function simulateSave() {
  if (loading.value) return;
  loading.value = true;
  saved.value = '';
  timer = setTimeout(() => { loading.value = false; saved.value = '模拟保存完成'; }, 800);
}
function submit() { submitted.value = email.value; }
watch(() => props.name, () => {
  clearTimeout(timer);
  loading.value = false; saved.value = ''; action.value = '';
});
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div v-if="name === 'MButton'" class="component-examples">
    <section class="component-example" aria-labelledby="button-levels-heading">
      <div class="component-example__heading"><span aria-hidden="true">01</span><div><h3 id="button-levels-heading">明确操作的轻重</h3><p>主要操作使用实心朱砂，次要操作保留轮廓，低优先级操作轻量呈现。同一区域保持一个视觉主动作。</p></div></div>
      <div class="component-example__stage">
        <div class="component-example__row">
          <MButton @click="action = '主要操作'">主要操作</MButton>
          <MButton variant="secondary" @click="action = '次要操作'">次要操作</MButton>
          <MButton variant="ghost" @click="action = '文字操作'">文字操作</MButton>
        </div>
        <p class="component-example__result" role="status">{{ action ? `已触发：${action}` : '试着点一下，感受三种操作层级。' }}</p>
      </div>
      <details class="component-example__code"><summary><span>查看代码</span><code>ButtonLevels.vue</code></summary><CodeBlock :code="buttonLevelsCode" filename="ButtonLevels.vue" /></details>
    </section>
    <section class="component-example" aria-labelledby="button-sizes-heading">
      <div class="component-example__heading"><span aria-hidden="true">02</span><div><h3 id="button-sizes-heading">与界面的密度相称</h3><p>三种尺寸沿用相同的切面与焦点标记。紧凑工具栏使用小尺寸，主要表单使用中尺寸。</p></div></div>
      <div class="component-example__stage">
        <MSegmented v-model="selectedSize" label="按钮尺寸" :options="sizes" />
        <div class="component-example__row component-example__row--sizing"><MButton :size="selectedSize">创建项目</MButton><MButton :size="selectedSize" variant="secondary">取消</MButton></div>
      </div>
      <details class="component-example__code"><summary><span>查看代码</span><code>ButtonSizes.vue</code></summary><CodeBlock :code="buttonSizesCode(selectedSize)" filename="ButtonSizes.vue" /></details>
    </section>
    <section class="component-example" aria-labelledby="button-async-heading">
      <div class="component-example__heading"><span aria-hidden="true">03</span><div><h3 id="button-async-heading">等待，也给出回应</h3><p><code>loading</code> 会展示加载标记并阻止重复点击。此处模拟一次 800ms 保存，完成后恢复可操作状态。</p></div></div>
      <div class="component-example__stage"><div class="component-example__row"><MButton :loading="loading" @click="simulateSave">{{ loading ? '正在保存…' : '模拟保存' }}</MButton><MButton disabled>暂不可用</MButton></div><p class="component-example__result" role="status">{{ saved || '加载与禁用均保留原生按钮语义。' }}</p></div>
      <details class="component-example__code"><summary><span>查看代码</span><code>ButtonAsync.vue</code></summary><CodeBlock :code="buttonAsyncCode" filename="ButtonAsync.vue" /></details>
    </section>
    <aside class="component-examples__note"><b>使用提示</b><p>表单提交请显式设置 <code>type="submit"</code>。跳转到其他页面时，使用 <a href="#/components/MLink">MLink 链接</a> 保留浏览器原生导航能力。</p></aside>
  </div>

  <div v-else-if="name === 'MInput'" class="component-examples">
    <section class="component-example" aria-labelledby="input-basic-heading">
      <div class="component-example__heading"><span aria-hidden="true">01</span><div><h3 id="input-basic-heading">让注意力留在文字里</h3><p>用 <code>v-model</code> 连接输入值。标签说明字段含义，提示补充约束，焦点刻线标明当前输入位置。</p></div></div>
      <div class="component-example__stage"><div class="component-example__field"><MInput v-model="project" label="项目名称" hint="支持中文输入，最多 32 个字符。" placeholder="为新项目起个名字" :maxlength="32" /><p class="component-example__result" aria-live="polite">当前值：{{ project || '尚未填写' }}</p></div></div>
      <details class="component-example__code"><summary><span>查看代码</span><code>InputBasic.vue</code></summary><CodeBlock :code="inputBasicCode" filename="InputBasic.vue" /></details>
    </section>
    <section class="component-example" aria-labelledby="input-states-heading">
      <div class="component-example__heading"><span aria-hidden="true">02</span><div><h3 id="input-states-heading">状态清晰，信息有据</h3><p>错误使用独立语义色，并把说明关联到输入框。禁用状态保留内容，避免看似可以编辑。</p></div></div>
      <div class="component-example__stage component-example__fields"><MInput v-model="conflict" label="存在冲突" error="这个名称已被使用，请更换。" /><MInput model-value="仅供展示的内容" label="禁用输入" disabled /></div>
      <details class="component-example__code"><summary><span>查看代码</span><code>InputStates.vue</code></summary><CodeBlock :code="inputStatesCode" filename="InputStates.vue" /></details>
    </section>
    <section class="component-example" aria-labelledby="input-form-heading">
      <div class="component-example__heading"><span aria-hidden="true">03</span><div><h3 id="input-form-heading">接入原生表单</h3><p><code>name</code>、<code>required</code>、<code>autocomplete</code> 等属性直接传给原生输入框。试着输入一个邮箱，再提交验证。</p></div></div>
      <div class="component-example__stage"><form class="component-example__form" @submit.prevent="submit"><MInput v-model="email" label="联系邮箱" type="email" name="email" autocomplete="email" placeholder="you@example.com" required /><MButton type="submit">校验并确认</MButton><p class="component-example__result" role="status">{{ submitted ? `已确认：${submitted}` : '提交前由浏览器检查必填和邮箱格式。' }}</p></form></div>
      <details class="component-example__code"><summary><span>查看代码</span><code>InputForm.vue</code></summary><CodeBlock :code="inputFormCode" filename="InputForm.vue" /></details>
    </section>
    <aside class="component-examples__note"><b>使用提示</b><p>占位文字用于举例，不能替代可见标签。需要多行内容时使用 <a href="#/components/MTextarea">MTextarea 文本域</a>；跨字段验证可配合 <a href="#/components/MForm">MForm 表单</a>。</p></aside>
  </div>
</template>

<style scoped>
.component-examples { display: grid; gap: 28px; min-width: 0; }
.component-example { min-width: 0; }
.component-example__heading { display: flex; align-items: baseline; gap: 15px; margin-bottom: 16px; }
.component-example__heading > span { color: var(--site-accent); font: 10px var(--site-mono); }
.component-example__heading > div { min-width: 0; }
.component-example__heading h3 { margin: 0 0 9px; font-size: 16px; line-height: 1.5; font-weight: 600; }
.component-example__heading p { margin: 0; color: var(--site-muted); font-size: 13px; line-height: 1.85; }
.component-example__heading code, .component-examples__note code { color: var(--site-accent); font: 12px var(--site-mono); overflow-wrap: anywhere; }
.component-example__stage { display: grid; gap: 22px; min-width: 0; padding: 28px; border: 1px solid var(--site-line); background: var(--site-panel); }
.component-example__row { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
.component-example__row--sizing { min-height: 48px; }
.component-example__stage :deep(.ui-segmented) { justify-self: start; }
.component-example__result { margin: 0; min-height: 20px; color: var(--site-muted); font-size: 12px; line-height: 1.75; overflow-wrap: anywhere; }
.component-example__code { min-width: 0; border: 1px solid var(--site-line); border-top: 0; }
.component-example__code summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 44px; padding: 10px 18px; color: var(--site-muted); font-size: 12px; list-style: none; }
.component-example__code summary::-webkit-details-marker { display: none; }
.component-example__code summary span::before { content: '+'; display: inline-block; width: 20px; color: var(--site-accent); font: 15px var(--site-mono); }
.component-example__code[open] summary span::before { content: '−'; }
.component-example__code summary code { font: 10px var(--site-mono); }
.component-example__code summary:hover { background: var(--site-soft); color: var(--site-ink); }
.component-example__code summary:focus-visible { outline: 2px solid var(--site-accent); outline-offset: -3px; }
.component-example__code :deep(.site-code) { border: 0; border-top: 1px solid var(--site-line); }
.component-example__field { width: min(100%, 420px); display: grid; gap: 16px; }
.component-example__fields { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
.component-example__form { display: grid; gap: 18px; width: min(100%, 420px); }
.component-example__form > :deep(button) { justify-self: start; }
.component-examples__note { padding: 16px 20px; background: var(--site-soft); border-inline-start: 2px solid var(--site-accent); font-size: 12px; line-height: 1.85; }
.component-examples__note b { font-weight: 600; }
.component-examples__note p { margin: 5px 0 0; color: var(--site-muted); }
.component-examples__note a { text-decoration: underline; text-underline-offset: 3px; color: var(--site-ink); }
@media (max-width: 600px) {
  .component-example__stage { padding: 20px 16px; gap: 18px; }
  .component-example__heading { gap: 10px; }
  .component-example__heading h3 { font-size: 15px; }
  .component-example__fields { grid-template-columns: minmax(0, 1fr); }
  .component-example__code summary { padding-inline: 14px; gap: 8px; }
}
</style>
