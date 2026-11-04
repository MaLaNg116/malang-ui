import type { Preview } from '@storybook/vue3-vite';
import '../src/styles/tokens.css';
import './preview.css';

const preview: Preview = {
  initialGlobals: { theme: 'light', palette: 'paper', density: 'comfortable', motion: 'standard' },
  globalTypes: {
    theme: { description: '主题', toolbar: { title: '主题', icon: 'circlehollow', items: [{ value: 'dark', title: '深色' }, { value: 'light', title: '浅色' }], dynamicTitle: true } },
    palette: { description: '浅色材质配色；深色使用浓墨', toolbar: { title: '浅色配色', icon: 'paintbrush', items: [{ value: 'paper', title: '宣纸 · 朱砂' }, { value: 'celadon', title: '青瓷 · 冷玉' }, { value: 'gilt', title: '绢素 · 鎏金' }], dynamicTitle: true } },
    density: { description: '密度', toolbar: { title: '密度', icon: 'sidebar', items: [{ value: 'comfortable', title: '舒适' }, { value: 'compact', title: '紧凑' }], dynamicTitle: true } },
    motion: { description: '动态效果', toolbar: { title: '动态效果', icon: 'play', items: [{ value: 'standard', title: '标准动效' }, { value: 'reduced', title: '减少动态效果' }], dynamicTitle: true } }
  },
  decorators: [
    (story, context) => ({
      components: { Story: story() },
      setup: () => ({ globals: context.globals }),
      template: '<section class="kit-story-surface" :data-ui-theme="globals.theme" :data-ui-palette="globals.palette" :data-ui-density="globals.density" :data-ui-motion="globals.motion"><Story /></section>'
    })
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    options: { storySort: { order: ['开始', ['组件库展示首页', '纸墨试色台', '基础版使用指南', '功夫朋克规范', '归印调校台', '藏品归档台', '铸刃工坊', '业务组合工作台', '水墨科技样板', '导航与弹层', '工程起点'], '基础组件', ['交互语言', 'Button 按钮', 'Input 输入框', 'Textarea 多行输入', 'Select 选择器', 'Checkbox 复选框', 'RadioGroup 单选组', 'Switch 开关', 'Card 卡片', 'Tag 标签', 'Avatar 头像', 'Table 表格', 'Statistic 指标', 'Divider 分隔线', 'Tabs 标签页', 'Pagination 分页', 'Breadcrumb 面包屑', 'Dialog 对话框', 'Popover 气泡', 'Tooltip 提示', 'Badge 状态标记', 'Alert 提示块', 'Spinner 加载标记', 'Skeleton 骨架屏', 'Empty 空状态', 'Toast 轻提示'], '二级组件', ['InputNumber 数字输入', 'Slider 刻度滑轨', 'Combobox 搜索选择', 'DatePicker 日期历盘', 'Upload 本地文件', 'Menu 导航菜单', 'Tree 层级目录', 'Descriptions 资料描述', 'Result 结果面板', 'Drawer 抽屉', 'DropdownMenu 操作菜单', 'Accordion 折叠面板', 'Steps 步骤条', 'Progress 进度条', 'Timeline 时间线'], '动效', '实用工具'] } }
  }
};

export default preview;
