import type { Preview } from '@storybook/vue3-vite';
import '../src/styles/tokens.css';
import './preview.css';

const preview: Preview = {
  initialGlobals: { theme: 'light', density: 'comfortable', motion: 'standard' },
  globalTypes: {
    theme: { description: '主题', toolbar: { title: '主题', icon: 'circlehollow', items: [{ value: 'dark', title: '深色' }, { value: 'light', title: '浅色' }], dynamicTitle: true } },
    density: { description: '密度', toolbar: { title: '密度', icon: 'sidebar', items: [{ value: 'comfortable', title: '舒适' }, { value: 'compact', title: '紧凑' }], dynamicTitle: true } },
    motion: { description: '动态效果', toolbar: { title: '动态效果', icon: 'play', items: [{ value: 'standard', title: '标准动效' }, { value: 'reduced', title: '减少动态效果' }], dynamicTitle: true } }
  },
  decorators: [
    (story, context) => ({
      components: { Story: story() },
      setup: () => ({ globals: context.globals }),
      template: '<section class="kit-story-surface" :data-ui-theme="globals.theme" :data-ui-density="globals.density" :data-ui-motion="globals.motion"><Story /></section>'
    })
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    options: { storySort: { order: ['开始', ['水墨科技样板', '工程起点'], '基础组件', '动效', '实用工具'] } }
  }
};

export default preview;
