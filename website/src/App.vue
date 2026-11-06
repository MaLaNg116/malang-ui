<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { MConfigProvider, MDialog, MPopover, MSegmented, MSwitch, useReducedMotion } from '../../src/index';
import { componentCatalog } from './data/catalog';
import HomeView from './views/HomeView.vue';
const ComponentsView = defineAsyncComponent(() => import('./views/ComponentsView.vue'));
const MotionView = defineAsyncComponent(() => import('./views/MotionView.vue'));
const GuideView = defineAsyncComponent(() => import('./views/GuideView.vue'));
type Theme = 'light' | 'dark';
type Palette = 'paper' | 'celadon' | 'gilt';
const storageKey = 'malang-website-settings-v1';
function saved(): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}
const initial = saved();
const theme = ref<Theme>(initial.theme === 'light' ? 'light' : 'dark');
const palette = ref<Palette>(['paper', 'celadon', 'gilt'].includes(String(initial.palette)) ? initial.palette as Palette : 'paper');
const reduce = ref(initial.reduce === true);
const systemReduced = useReducedMotion();
const motion = computed(() => reduce.value || systemReduced.value ? 'reduced' : 'standard');
const hash = ref(location.hash), mobileOpen = ref(false), appearanceOpen = ref(false);
const main = ref<HTMLElement>(), nav = ref<HTMLElement>(), menuButton = ref<HTMLButtonElement>();
const indicator = ref({ x: 0, width: 0 }), indicatorReady = ref(false);
const routes = [{ key: 'home', href: '#/', label: '概览' }, { key: 'components', href: '#/components', label: '组件' }, { key: 'motion', href: '#/motion', label: '动效' }, { key: 'guide', href: '#/guide', label: '指南' }];
const route = computed(() => {
  let path = '/'; try { path = decodeURIComponent(hash.value.replace(/^#/, '') || '/').split('?')[0]!; } catch { return { page: 'missing', name: undefined }; }
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return { page: 'home', name: undefined };
  if (parts[0] === 'components' && parts.length <= 2) return { page: 'components', name: parts[1] };
  return { page: ['motion', 'guide'].includes(parts[0]!) && parts.length === 1 ? parts[0]! : 'missing', name: undefined };
});
const workbench = import.meta.env.DEV ? 'http://127.0.0.1:6006/' : './workbench/';
const searchOpen = ref(false), search = ref(''), searchInput = ref<HTMLInputElement>(), activeResult = ref(0);
const results = computed(() => {
  const needle = search.value.trim().toLocaleLowerCase();
  return componentCatalog.filter(item => !needle || [item.name, item.label, item.category, item.description, ...item.keywords].join(' ').toLocaleLowerCase().includes(needle)).slice(0, 10);
});
watch(search, () => { activeResult.value = 0; });
watch(searchOpen, async open => { if (open) { search.value = ''; activeResult.value = 0; await nextTick(); searchInput.value?.focus(); } });
async function searchKey(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const length = results.value.length;
    if (length) {
      activeResult.value = (activeResult.value + (event.key === 'ArrowDown' ? 1 : -1) + length) % length;
      await nextTick();
      const item = results.value[activeResult.value];
      if (searchOpen.value && item) document.getElementById(`site-search-${item.name}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
  if (event.key === 'Enter' && results.value[activeResult.value]) { event.preventDefault(); location.hash = `/components/${results.value[activeResult.value]!.name}`; searchOpen.value = false; }
}
function globalKey(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') { event.preventDefault(); searchOpen.value = !searchOpen.value; }
  if (event.key === 'Escape' && mobileOpen.value) { mobileOpen.value = false; menuButton.value?.focus(); }
}
async function closeMobileNavigation(href: string) {
  mobileOpen.value = false;
  if (location.hash === href || (!location.hash && href === '#/')) {
    await nextTick();
    menuButton.value?.focus();
  }
}
function alignIndicator() {
  const item = nav.value?.querySelector<HTMLElement>('[aria-current="page"]');
  if (!item || !nav.value) return;
  const bounds = item.getBoundingClientRect(), container = nav.value.getBoundingClientRect();
  indicator.value = { x: bounds.left - container.left, width: bounds.width };
  cancelAnimationFrame(indicatorFrame);
  indicatorFrame = requestAnimationFrame(() => { indicatorReady.value = true; });
}
async function routeChanged() {
  hash.value = location.hash; mobileOpen.value = false; appearanceOpen.value = false;
  await nextTick(); alignIndicator(); window.scrollTo({ top: 0, behavior: 'instant' }); main.value?.focus({ preventScroll: true });
}
watch([theme, palette, reduce, motion], () => {
  document.documentElement.dataset.uiTheme = theme.value;
  document.documentElement.dataset.uiPalette = palette.value;
  document.documentElement.dataset.uiMotion = motion.value;
  document.documentElement.style.colorScheme = theme.value;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.value === 'dark' ? '#101713' : '#f3f0e7');
  try { localStorage.setItem(storageKey, JSON.stringify({ theme: theme.value, palette: palette.value, reduce: reduce.value })); } catch { /* Preferences remain usable when browser storage is restricted. */ }
}, { immediate: true });
watch(route, current => {
  const component = current.page === 'components' && componentCatalog.find(item => item.name === current.name);
  const title = component ? `${component.label} ${component.name}` : routes.find(item => item.key === current.page)?.label || '未找到页面';
  document.title = `${title} · MaLang UI 墨浪`;
}, { immediate: true });
let observer: ResizeObserver | undefined, mounted = true, indicatorFrame = 0;
onMounted(() => {
  window.addEventListener('hashchange', routeChanged); window.addEventListener('keydown', globalKey);
  if (nav.value) { observer = new ResizeObserver(alignIndicator); observer.observe(nav.value); }
  alignIndicator(); void document.fonts?.ready.then(() => { if (mounted) alignIndicator(); });
});
onBeforeUnmount(() => { mounted = false; cancelAnimationFrame(indicatorFrame); observer?.disconnect(); window.removeEventListener('hashchange', routeChanged); window.removeEventListener('keydown', globalKey); });
</script>
<template>
  <MConfigProvider class="site-app" :theme="theme" :palette="palette" :motion="motion" locale="zh-CN">
    <a class="site-skip" href="#main-content" @click.prevent="main?.focus()">跳到主要内容</a>
    <header class="site-header"><div class="site-header__inner">
      <a class="site-brand" href="#/" aria-label="MaLang UI 墨浪首页"><svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true"><path fill="currentColor" d="M0 0h36l12 12v36H0z"/><path fill="none" stroke="var(--ui-color-on-accent)" stroke-width="3" stroke-linecap="square" d="M12 34V14l12 12 12-12v20M12 34h8m8 0h8"/></svg><span>MaLang <b>UI</b><small>墨浪</small></span></a>
      <nav ref="nav" class="site-nav" aria-label="主导航"><a v-for="item in routes" :key="item.key" :href="item.href" :aria-current="route.page === item.key ? 'page' : undefined">{{ item.label }}</a><span class="site-nav__indicator" :class="{ 'is-ready': indicatorReady }" :style="{ width: indicator.width + 'px', transform: `translateX(${indicator.x}px)` }" aria-hidden="true" /></nav>
      <div class="site-header__actions"><button class="site-search-trigger" type="button" aria-label="搜索组件" @click="searchOpen = true"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><span>搜索组件</span><kbd>Ctrl K</kbd></button>
        <MPopover v-model="appearanceOpen" label="外观设置" trigger-label="外观设置" class="site-appearance" placement="bottom"><template #trigger><svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><path d="M16.8 12.2A7.3 7.3 0 0 1 7.8 3.2a7.3 7.3 0 1 0 9 9Z" stroke="currentColor" stroke-width="1.3"/></svg></template><div class="site-appearance__controls"><MSegmented v-model="theme" label="明暗模式" :options="[{value:'dark',label:'深色'},{value:'light',label:'浅色'}]" /><MSegmented v-model="palette" label="纸面材质" :options="[{value:'paper',label:'宣纸'},{value:'celadon',label:'青瓷'},{value:'gilt',label:'绢素'}]" /><p>纸面材质在浅色模式下呈现。</p><MSwitch v-model="reduce" label="减少动态效果" /><p v-if="systemReduced">系统已启用减少动态效果。</p></div></MPopover>
        <a class="site-github" href="https://github.com/MaLaNg116/malang-ui" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        <button ref="menuButton" type="button" class="site-menu-toggle" :aria-label="mobileOpen ? '关闭导航菜单' : '打开导航菜单'" :aria-expanded="mobileOpen" aria-controls="mobile-navigation" @click="mobileOpen = !mobileOpen"><span /><span /></button>
      </div>
    </div><nav v-if="mobileOpen" id="mobile-navigation" class="site-mobile-nav" aria-label="移动导航"><a v-for="item in routes" :key="item.key" :href="item.href" :aria-current="route.page === item.key ? 'page' : undefined" @click="closeMobileNavigation(item.href)">{{ item.label }} <span>↗</span></a><a href="https://github.com/MaLaNg116/malang-ui" target="_blank" rel="noreferrer">GitHub ↗</a></nav></header>
    <main id="main-content" ref="main" tabindex="-1" :data-site-page="route.page">
      <HomeView v-if="route.page === 'home'" />
      <ComponentsView v-else-if="route.page === 'components'" :component-name="route.name" :theme="theme" :palette="palette" :motion="motion" />
      <MotionView v-else-if="route.page === 'motion'" />
      <GuideView v-else-if="route.page === 'guide'" />
      <section v-else class="site-container site-not-found"><p class="site-eyebrow">404 / NO SUCH CHAPTER</p><h1>这一页，尚未落笔。</h1><a class="site-link-button" href="#/">回到首页 →</a></section>
    </main>
    <footer class="site-footer site-container"><a class="site-brand" href="#/">MaLang <b>UI</b><span class="site-footer__stamp" aria-hidden="true">墨浪</span></a><p>以墨为骨，以动成形。<small>原创界面语言 · MIT License · v0.1.0</small></p><div><a :href="workbench" target="_blank" rel="noreferrer">Storybook ↗</a><a href="https://github.com/MaLaNg116/malang-ui" target="_blank" rel="noreferrer">源码 ↗</a><a href="https://github.com/MaLaNg116/malang-ui/issues" target="_blank" rel="noreferrer">反馈 ↗</a></div></footer>
    <MDialog v-model="searchOpen" title="搜索组件" description="按名称或用途查找，使用方向键选择、回车打开。" class="site-search-dialog"><div class="site-search-dialog__body"><input ref="searchInput" v-model="search" type="search" class="site-search-input" placeholder="输入 Input、按钮、日期…" aria-label="查找组件" role="combobox" aria-autocomplete="list" :aria-expanded="true" aria-controls="site-search-results" :aria-activedescendant="results[activeResult] ? `site-search-${results[activeResult]!.name}` : undefined" @keydown="searchKey" /><ul id="site-search-results" class="site-search-results" role="listbox" aria-label="组件搜索结果"><li v-for="(item,index) in results" :key="item.name" role="presentation"><a :id="`site-search-${item.name}`" :href="`#/components/${item.name}`" role="option" :aria-selected="index === activeResult" tabindex="-1" @mousemove="activeResult=index" @click="searchOpen=false"><span>{{ item.label }} <b>{{ item.name }}</b></span><small>{{ item.category }}</small><i aria-hidden="true">↗</i></a></li></ul><p v-if="!results.length" class="site-search-empty" role="status">没有找到对应组件，试试其他名称。</p><div class="site-search-hint"><span><kbd>↑ ↓</kbd> 选择 <kbd>Enter</kbd> 打开</span><span>{{ componentCatalog.length }} 个组件</span></div></div></MDialog>
  </MConfigProvider>
</template>
