<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';
import { cloneCode, installCode, quickStartCode, themeCode, utilityCode, transitionCode } from '../data/guide';
const workbench = import.meta.env.DEV ? 'http://127.0.0.1:6006/' : './workbench/';
const sections = [{ id: 'prepare', label: '准备环境' }, { id: 'install', label: '接入项目' }, { id: 'first', label: '第一个界面' }, { id: 'theme', label: '主题与材质' }, { id: 'modules', label: '按能力引入' }, { id: 'transitions', label: '让变化更自然' }];
function jump(id: string) { const target = document.getElementById(id); target?.scrollIntoView({ behavior: 'instant', block: 'start' }); target?.focus({ preventScroll: true }); }
</script>
<template>
  <div class="site-container site-guide">
    <aside class="site-guide__toc" aria-label="上手指南目录"><span class="site-eyebrow">GETTING STARTED</span><button v-for="section in sections" :key="section.id" @click="jump(section.id)">{{ section.label }}</button><a :href="workbench" target="_blank" rel="noreferrer">打开完整工作台 ↗</a></aside>
    <article class="site-guide__body">
      <header class="site-page-heading"><p class="site-eyebrow">从一行代码，到一个有性格的界面</p><h1>开始你的<br><em>下一份创作。</em></h1><p>Vue 3、TypeScript，以及已经打磨好的组件、材质和动效。<br>保留熟悉的开发方式，多一点表达自己的空间。</p></header>
      <div class="site-guide__notice"><span class="site-status-dot" /> v0.1.0 · 项目验证阶段<span>当前通过本地构建包接入，尚未发布到 npm。</span></div>
      <section id="prepare" tabindex="-1"><div class="site-section-label">01 / PREPARE</div><h2>准备环境</h2><p>使用 Node.js 24+、pnpm 11.25 与 Vue 3.5+。克隆仓库后，构建组件与类型声明，再生成本地安装包。</p><CodeBlock :code="cloneCode" language="shell" filename="终端 · 构建组件库" /></section>
      <section id="install" tabindex="-1"><div class="site-section-label">02 / CONNECT</div><h2>接入你的项目</h2><p>在消费项目中安装生成的 <code>.tgz</code>。基础 UI 不需要 GSAP；需要 MG 或聚合入口时，再安装动效依赖。</p><CodeBlock :code="installCode" language="shell" filename="终端 · 安装本地包" /></section>
      <section id="first" tabindex="-1"><div class="site-section-label">03 / BUILD</div><h2>第一个界面</h2><p>组件统一使用 <code>M</code> 前缀。样式导入一次，状态由你的业务掌握。</p><CodeBlock :code="quickStartCode" filename="FirstCanvas.vue" /><a class="site-text-link" href="#/components/MInput">了解 MInput 的所有状态 <span>↗</span></a></section>
      <section id="theme" tabindex="-1"><div class="site-section-label">04 / MATERIAL</div><h2>让内容有自己的气韵</h2><p>浅色有宣纸、青瓷、绢素三种材质；深色使用浓墨。通过 <code>MConfigProvider</code> 配置子树，或将 <code>data-ui-theme</code> 与 <code>data-ui-palette</code> 放在同一个容器上。</p><CodeBlock :code="themeCode" filename="Theme.vue" /><p>组件和 Canvas 动效会随主题更新。系统的减少动态效果偏好始终生效，应用也可通过 <code>motion="reduced"</code> 主动减少动态效果。</p></section>
      <section id="modules" tabindex="-1"><div class="site-section-label">05 / COMPOSE</div><h2>按能力引入</h2><div class="site-table-wrap"><table><thead><tr><th>入口</th><th>用在哪里</th></tr></thead><tbody><tr><td><code>malang-ui</code></td><td>Vue 组件、主题配置与响应式适配</td></tr><tr><td><code>malang-ui/utils</code></td><td>防抖、节流、异步锁；纯 TypeScript</td></tr><tr><td><code>malang-ui/motion</code></td><td>六套 Canvas MG 与 DOM 错峰；需 GSAP</td></tr><tr><td><code>malang-ui/all</code></td><td>UI、工具与动效的聚合入口</td></tr><tr><td><code>malang-ui/style.css</code></td><td>全部组件样式与设计变量</td></tr><tr><td><code>malang-ui/tokens.css</code></td><td>独立使用设计变量</td></tr></tbody></table></div><CodeBlock :code="utilityCode" language="typescript" filename="search.ts" /></section>
      <section id="transitions" tabindex="-1"><div class="site-section-label">06 / MOVE</div><h2>让变化更自然</h2><p>揭页、收合、落印，用短过渡交代变化。列表使用稳定的业务键；减少动效时保留完整、可操作的静态结果。</p><CodeBlock :code="transitionCode" filename="AnimatedRecords.vue" /><a class="site-text-link" href="#/motion">到动效展台亲手试试 <span>↗</span></a></section>
      <div class="site-guide__end"><h2>准备好了，开始构建。</h2><p>从一个按钮、一份表单开始，让真实项目推动下一次打磨。</p><a class="site-link-button" href="#/components">探索全部组件 <span>→</span></a></div>
    </article>
  </div>
</template>
