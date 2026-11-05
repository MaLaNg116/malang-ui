import { defineComponent } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MList from '../../src/components/reference-data/MList.vue';
import { records } from './fixtures';
const meta = { title: '数据组件/List 清单', tags: ['autodocs'], parameters: { docs: { description: { component: '静态原生列表，提供header/footer/item/loading/empty插槽。大数据使用独立VirtualList。' } } } } satisfies Meta;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => defineComponent({ components: { MList }, setup: () => ({ records: records.slice(0, 4) }), template: `<MList :items="records" label="卷宗目录"><template #header>山川卷宗</template><template #item="{item,index}">{{index+1}} · {{item.name}} <span class="kit-muted">{{item.group}}</span></template><template #footer>共4份，按登记顺序排列。</template></MList>` }) };
export const EmptyAndLoading: Story = { render: () => defineComponent({ components: { MList }, template: `<div class="kit-stack"><MList :items="[]" label="待登记清单"><template #empty>尚未登记，先留下第一笔。</template></MList><MList :items="[]" label="正在读取清单" loading /></div>` }) };
