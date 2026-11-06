import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';
import { componentCatalog } from './catalog';

export interface ComponentExample {
  id: string;
  title: string;
  description: string;
  component: Component;
  source: string;
}
const modules = import.meta.glob<{ default: Component }>('../examples/**/*.vue');
const sources = import.meta.glob<string>('../examples/**/*.vue', { query: '?raw', import: 'default', eager: true });
const metadataModules = import.meta.glob<Record<string, Record<string, { title: string; description: string }>>>('./examples-{fields,display}.ts', { eager: true });
const metadata = Object.assign({}, ...Object.values(metadataModules).flatMap(module => Object.values(module))) as Record<string, { title: string; description: string }>;
const descriptions: Record<string, { title: string; description: string }> = {
  'MButton/basic': { title: '基础用法', description: '用 primary、secondary 和 ghost 区分操作的强调层级。同一区域保持一个明确的主操作。' },
  'MButton/sizes': { title: '按钮尺寸', description: '使用 size 选择小、中、大三种尺寸，使控件与表单或工具栏的密度保持一致。' },
  'MButton/loading': { title: '加载与禁用', description: '等待异步操作时设置 loading。加载和禁用状态均阻止重复点击；示例模拟一次 800ms 保存。' },
  'MInput/basic': { title: '基础用法', description: '通过 v-model 读写文本，使用可见标签和提示说明字段含义。中文组合输入完成后再更新受控值。' },
  'MInput/states': { title: '错误与禁用', description: '通过 error 提供错误说明，通过 disabled 保留内容并禁止编辑。' },
  'MInput/form': { title: '原生表单', description: 'name、required 和 autocomplete 等属性传给原生输入框。本例在提交前检查必填和邮箱格式。' },
  'MMenu/basic': { title: '基础导航', description: 'items 定义层级结构，v-model 保存当前选中项，v-model:expanded-values 独立控制展开的分组。' },
  'MMenu/controlled': { title: '控制分组展开', description: '选中与展开是两份独立状态。可以一次展开所有分组，也可以只保留最近打开的顶层分组。' },
  'MMenu/disabled': { title: '禁用与键盘操作', description: '菜单项可以单独禁用，也可以禁用整组导航。使用 Tab 移动焦点，Enter 或空格激活，Escape 收起当前展开分组。' },
};
const order = ['basic', 'sizes', 'loading', 'states', 'form', 'controlled', 'disabled'];
const byComponent = new Map<string, ComponentExample[]>();
for (const [path, load] of Object.entries(modules).sort(([a], [b]) => {
  const slug = (name: string) => name.split('/').at(-1)!.replace('.vue', '');
  return order.indexOf(slug(a)) - order.indexOf(slug(b));
})) {
  const match = path.match(/\/([^/]+)\/([^/]+)\.vue$/);
  if (!match) continue;
  const [, name, slug] = match as [string, string, string];
  const info = descriptions[`${name}/${slug}`] || metadata[name];
  const example = {
    id: `${name}-${slug}`,
    title: info?.title || '基础用法',
    description: info?.description || componentCatalog.find(item => item.name === name)?.description || '',
    component: defineAsyncComponent(load),
    source: sources[path]!,
  };
  const examples = byComponent.get(name) ?? [];
  examples.push(example);
  byComponent.set(name, examples);
}
export function getComponentExamples(name: string): ComponentExample[] {
  return byComponent.get(name) ?? [];
}
