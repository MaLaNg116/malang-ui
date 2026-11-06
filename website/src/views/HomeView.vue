<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { MButton, MInput, MProgress, MQRCode, MSegmented, MConfigProvider, MSwitch, MCheckbox } from '../../../src/index';
import CodeBlock from '../components/CodeBlock.vue';
import { quickStartCode } from '../data/guide';
import { componentCatalog } from '../data/catalog';
const MotionExhibit = defineAsyncComponent(() => import('../components/MotionExhibit.vue'));
const name = ref('山海之间'), confirmed = ref(''), progress = ref(42);
const material = ref('paper'), previewName = ref('留一份自己的笔意'), enabled = ref(true), checked = ref(true);
const materials = [{ value: 'paper', label: '宣纸' }, { value: 'ink', label: '浓墨' }, { value: 'celadon', label: '青瓷' }, { value: 'gilt', label: '绢素' }];
const materialTheme = computed(() => material.value === 'ink' ? 'dark' : 'light');
const materialPalette = computed(() => material.value === 'ink' ? 'paper' : material.value as 'paper' | 'celadon' | 'gilt');
const descriptions: Record<string, { title: string; text: string; code: string }> = {
  paper: { title: '纸白有温，朱砂有力。', text: '把留白交给内容，把锋芒留给关键的那一下。', code: 'PAPER / VERMILION' },
  ink: { title: '墨色有层，微光有界。', text: '在安静的深色里，让信息与动作各有位置。', code: 'INK / CELADON' },
  celadon: { title: '冷玉为骨，清润为面。', text: '更轻的温度，更克制的强调，适合长时间相处。', code: 'CELADON / JADE' },
  gilt: { title: '绢素铺底，一线鎏金。', text: '把细腻留在表面，把秩序藏进每一条刻线。', code: 'SILK / GILT' },
};
const activeDescription = computed(() => descriptions[material.value] ?? descriptions.paper!);
const componentCount = componentCatalog.length;
const categories = [
  { n: '01', title: '基础与输入', text: '从按钮到复杂表单，让每一次输入都有回应。', tags: ['Button', 'Input', 'Select', 'Form'], link: 'MInput' },
  { n: '02', title: '数据与结构', text: '装得下内容的轻重，也容得下真实业务的复杂。', tags: ['Table', 'Tree', 'Calendar', 'VirtualList'], link: 'MTable' },
  { n: '03', title: '反馈与导航', text: '提示有分寸，去向有线索，操作有清晰的落点。', tags: ['Message', 'Dialog', 'Tabs', 'Menu'], link: 'MMessage' },
  { n: '04', title: '动效与工具', text: '让变化可感知，让重复工作更轻一点。', tags: ['MG', 'Transition', 'Debounce', 'AsyncLock'], link: '' },
];
function confirmName() { if (name.value.trim()) confirmed.value = name.value.trim(); }
</script>
<template>
  <div class="site-home">
    <section class="site-container site-hero">
      <div class="site-hero__copy">
        <p class="site-eyebrow"><span class="site-status-dot" /> VUE 3 COMPONENT LIBRARY <span class="site-hero__version">v0.1.0</span></p>
        <h1>以墨为骨，<br><em>以动成形。</em></h1>
        <p class="site-hero__description">一套有东方骨力的现代界面语言。<br>把水墨的留白、机械的精度，<br class="site-desktop-break">写进每一次自然的交互。</p>
        <div class="site-hero__actions"><a class="site-link-button" href="#/guide">开始构建 <span>→</span></a><a class="site-link-button site-link-button--secondary" href="#/components">浏览组件 <span>↗</span></a></div>
        <div class="site-hero__footnote"><span>Vue 3 + TypeScript</span><i aria-hidden="true" /><span>MIT LICENSE</span><i aria-hidden="true" /><span>原创 · 功夫朋克</span></div>
      </div>
      <div class="site-hero__art">
        <span class="site-art__corner site-art__corner--a" aria-hidden="true" /><span class="site-art__corner site-art__corner--b" aria-hidden="true" />
        <div class="site-art__top"><span>墨 浪 / MALANG</span><span>INK × TECHNOLOGY</span></div>
        <div class="site-art__canvas"><MotionExhibit compact autoplay /></div>
        <div class="site-art__bottom"><span>留白之间，自有锋芒。</span><span class="site-seal" aria-hidden="true">墨</span></div>
      </div>
    </section>
    <div class="site-container site-spec-strip"><div><b>{{ componentCount }}</b><span>实用组件</span></div><div><b>07</b><span>可控动效工厂</span></div><div><b>04</b><span>材质与主题</span></div><p>有性格，也有章法。<br><span>从日常控件，到完整界面。</span></p></div>

    <section class="site-container site-home-section">
      <div class="site-section-heading"><div><p class="site-eyebrow">01 / A FEEL FOR INTERACTION</p><h2>先上手，<em>再心动。</em></h2></div><p>输入、推进、确认。<br>设计的手感，藏在这些小事里。</p></div>
      <div class="site-live-board">
        <form class="site-live-cell site-live-cell--form" @submit.prevent="confirmName"><div class="site-live-cell__label"><span>起笔 / INPUT</span><a href="#/components/MInput" aria-label="查看输入框文档">↗</a></div><h3>给创作，一个名字。</h3><MInput v-model="name" label="作品名称" placeholder="写下你的下一份创作" required :maxlength="32" /><MButton type="submit">确认名称 <span aria-hidden="true">↗</span></MButton><p class="site-demo-result" aria-live="polite">{{ confirmed ? `这份创作，叫「${confirmed}」。` : '清晰的焦点，让注意力留在文字里。' }}</p></form>
        <div class="site-live-cell site-live-cell--progress"><div class="site-live-cell__label"><span>推敲 / FEEDBACK</span><a href="#/components/MProgress" aria-label="查看进度条文档">↗</a></div><div class="site-progress-number" aria-hidden="true">{{ progress }}<span>%</span></div><MProgress :value="progress" label="细节打磨" :status="progress === 100 ? 'success' : 'default'" :show-value="false" /><div class="site-demo-actions"><MButton variant="secondary" size="sm" @click="progress = progress >= 100 ? 0 : Math.min(100, progress + 14)">{{ progress === 100 ? '再来一次' : '向前一步' }} <span aria-hidden="true">→</span></MButton><span>{{ progress === 100 ? '恰到好处。' : '每一步，都看得见。' }}</span></div></div>
        <div class="site-live-cell site-live-cell--qr"><div class="site-live-cell__label"><span>成印 / QRCODE</span><a href="#/components/MQRCode" aria-label="查看二维码文档">↗</a></div><MQRCode value="https://github.com/MaLaNg116/malang-ui" :size="160" :bordered="false" label="MaLang UI 仓库二维码" /><p>一枚有骨力的码印。<br><span>扫码，走进源码。</span></p></div>
      </div>
    </section>

    <section class="site-container site-home-section site-materials">
      <div class="site-section-heading"><div><p class="site-eyebrow">02 / FOUR EXPRESSIONS</p><h2>一套骨架，<em>四种气韵。</em></h2></div><p>宣纸、浓墨、青瓷、绢素。<br>换一种材质，保留同样顺手的交互。</p></div>
      <div class="site-materials__layout">
        <div class="site-materials__intro"><MSegmented v-model="material" :options="materials" label="预览材质" /><p class="site-eyebrow">{{ activeDescription.code }}</p><h3>{{ activeDescription.title }}</h3><p>{{ activeDescription.text }}</p><a class="site-text-link" href="#/guide">了解主题配置 <span>↗</span></a><div class="site-materials__swatches" aria-hidden="true"><span v-for="color in ['canvas', 'surface', 'accent', 'secondary-accent']" :key="color" :data-ui-theme="materialTheme" :data-ui-palette="materialPalette" :style="{ backgroundColor: `var(--ui-color-${color})` }" /></div></div>
        <MConfigProvider class="site-materials__preview" :theme="materialTheme" :palette="materialPalette"><div class="site-preview-heading"><span>纸墨之间</span><span class="site-seal" aria-hidden="true">印</span></div><p>为下一份界面，选一种气质。</p><MInput v-model="previewName" label="创作笔记" /><div class="site-preview-options"><MCheckbox v-model="checked" label="保留自己的表达" /><MSwitch v-model="enabled" label="让交互有回应" /></div><MButton :disabled="!enabled" @click="previewName = '让界面，也有自己的性格。'">写下这一笔 <span aria-hidden="true">↗</span></MButton><div class="site-preview-footnote">MALANG UI <span>DESIGNED TO FEEL DIFFERENT.</span></div></MConfigProvider>
      </div>
    </section>

    <section class="site-container site-home-section">
      <div class="site-section-heading"><div><p class="site-eyebrow">03 / A COMPLETE VOCABULARY</p><h2>从一点一线，<br><em>到整个界面。</em></h2></div><a class="site-text-link" href="#/components">探索 {{ componentCount }} 个组件 <span>↗</span></a></div>
      <div class="site-category-list"><a v-for="category in categories" :key="category.n" :href="category.link ? `#/components/${category.link}` : '#/motion'" class="site-category-row"><span class="site-category-row__number">{{ category.n }}</span><h3>{{ category.title }}</h3><p>{{ category.text }}<span>{{ category.tags.join(' / ') }}</span></p><b aria-hidden="true">↗</b></a></div>
    </section>

    <section class="site-container site-home-section site-code-section"><div><p class="site-eyebrow">04 / FAMILIAR BY DESIGN</p><h2>风格鲜明，<br><em>用法熟悉。</em></h2><p>标准的 Vue 组件，完整的 TypeScript 声明。<br>把心思留给产品，让细节有章可循。</p><ul><li>原生表单语义与键盘操作</li><li>明暗主题与减少动态效果</li><li>UI、工具和 GSAP 动效分入口引入</li></ul><a class="site-text-link" href="#/guide">阅读接入指南 <span>↗</span></a></div><CodeBlock :code="quickStartCode" filename="YourNextIdea.vue" /></section>
    <section class="site-container site-home-end"><p class="site-eyebrow">THE NEXT STROKE IS YOURS.</p><h2>下一笔，<em>由你落下。</em></h2><a class="site-link-button" href="#/guide">开始构建 <span>→</span></a><span class="site-home-end__mark" aria-hidden="true">墨浪</span></section>
  </div>
</template>
